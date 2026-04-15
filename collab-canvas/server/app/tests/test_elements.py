"""
Tests for element CRUD endpoints.

All endpoints require authentication and a valid canvas.
Covers creation of all five shape types, styling defaults, property
updates, text-specific fields, deletion, and auth/404 edge cases.
"""


class _ElementTestBase:
    """Shared helpers for element tests."""

    _counter = 0

    def _setup(self, client) -> tuple[dict, dict]:
        """Create a fresh user + canvas and return both."""
        _ElementTestBase._counter += 1
        n = _ElementTestBase._counter
        user = client.post(
            "/api/auth/signup",
            json={
                "email": f"elem-user-{n}@example.com",
                "password": "pass123456",
                "display_name": f"ElemUser{n}",
            },
        ).json()
        canvas = client.post(
            "/api/canvas",
            json={"title": f"Canvas {n}"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        ).json()
        return user, canvas

    def _auth(self, user) -> dict:
        return {"Authorization": f"Bearer {user['access_token']}"}


class TestCreateElement(_ElementTestBase):
    def test_create_rectangle(self, client):
        user, canvas = self._setup(client)
        response = client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={
                "element_type": "rectangle",
                "x": 10.0,
                "y": 20.0,
                "width": 100.0,
                "height": 50.0,
            },
            headers=self._auth(user),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["element_type"] == "rectangle"
        assert data["x"] == 10.0
        assert data["y"] == 20.0
        assert data["width"] == 100.0
        assert data["height"] == 50.0
        assert data["canvas_id"] == canvas["id"]
        assert "id" in data

    def test_create_all_shape_types(self, client):
        user, canvas = self._setup(client)
        for shape in ("rectangle", "circle", "line", "triangle", "text"):
            response = client.post(
                f"/api/canvas/{canvas['id']}/elements",
                json={
                    "element_type": shape,
                    "x": 0.0,
                    "y": 0.0,
                    "width": 50.0,
                    "height": 50.0,
                },
                headers=self._auth(user),
            )
            assert response.status_code == 201, f"Failed to create {shape}"
            assert response.json()["element_type"] == shape

    def test_create_element_defaults(self, client):
        user, canvas = self._setup(client)
        response = client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={
                "element_type": "circle",
                "x": 0.0,
                "y": 0.0,
                "width": 50.0,
                "height": 50.0,
            },
            headers=self._auth(user),
        )
        data = response.json()
        assert data["fill"] == "#FFFFFF"
        assert data["stroke"] == "#000000"
        assert data["stroke_width"] == 1.0
        assert data["opacity"] == 1.0
        assert data["rotation"] == 0.0
        assert data["z_index"] == 0

    def test_create_text_element(self, client):
        user, canvas = self._setup(client)
        response = client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={
                "element_type": "text",
                "x": 50.0,
                "y": 50.0,
                "width": 200.0,
                "height": 40.0,
                "text_content": "Hello World",
                "font_size": 24.0,
                "text_color": "#FF0000",
            },
            headers=self._auth(user),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["text_content"] == "Hello World"
        assert data["font_size"] == 24.0
        assert data["text_color"] == "#FF0000"

    def test_create_element_with_styling(self, client):
        user, canvas = self._setup(client)
        response = client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={
                "element_type": "rectangle",
                "x": 10.0,
                "y": 10.0,
                "width": 80.0,
                "height": 60.0,
                "fill": "#3B82F6",
                "stroke": "#1E40AF",
                "stroke_width": 3.0,
                "opacity": 0.8,
                "rotation": 45.0,
                "z_index": 5,
            },
            headers=self._auth(user),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["fill"] == "#3B82F6"
        assert data["stroke"] == "#1E40AF"
        assert data["stroke_width"] == 3.0
        assert data["opacity"] == 0.8
        assert data["rotation"] == 45.0
        assert data["z_index"] == 5

    def test_create_element_canvas_not_found(self, client):
        user, _ = self._setup(client)
        response = client.post(
            "/api/canvas/00000000-0000-0000-0000-000000000000/elements",
            json={
                "element_type": "rectangle",
                "x": 0.0,
                "y": 0.0,
                "width": 50.0,
                "height": 50.0,
            },
            headers=self._auth(user),
        )
        assert response.status_code == 404

    def test_create_element_unauthenticated(self, client):
        response = client.post(
            "/api/canvas/00000000-0000-0000-0000-000000000000/elements",
            json={
                "element_type": "rectangle",
                "x": 0.0,
                "y": 0.0,
                "width": 50.0,
                "height": 50.0,
            },
        )
        assert response.status_code == 401


class TestGetElements(_ElementTestBase):
    def test_get_elements(self, client):
        user, canvas = self._setup(client)
        client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={"element_type": "rectangle", "x": 0, "y": 0, "width": 50, "height": 50},
            headers=self._auth(user),
        )
        client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={"element_type": "circle", "x": 100, "y": 100, "width": 30, "height": 30},
            headers=self._auth(user),
        )
        response = client.get(
            f"/api/canvas/{canvas['id']}/elements",
            headers=self._auth(user),
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        types = {e["element_type"] for e in data}
        assert types == {"rectangle", "circle"}

    def test_get_elements_empty_canvas(self, client):
        user, canvas = self._setup(client)
        response = client.get(
            f"/api/canvas/{canvas['id']}/elements",
            headers=self._auth(user),
        )
        assert response.status_code == 200
        assert response.json() == []


class TestUpdateElement(_ElementTestBase):
    def _create_element(self, client, user, canvas) -> dict:
        return client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={"element_type": "rectangle", "x": 0, "y": 0, "width": 50, "height": 50},
            headers=self._auth(user),
        ).json()

    def test_update_element_position(self, client):
        user, canvas = self._setup(client)
        element = self._create_element(client, user, canvas)
        response = client.patch(
            f"/api/canvas/{canvas['id']}/elements/{element['id']}",
            json={"x": 200.0, "y": 300.0},
            headers=self._auth(user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["x"] == 200.0
        assert data["y"] == 300.0

    def test_update_element_styling(self, client):
        user, canvas = self._setup(client)
        element = self._create_element(client, user, canvas)
        response = client.patch(
            f"/api/canvas/{canvas['id']}/elements/{element['id']}",
            json={"fill": "#FF0000", "opacity": 0.5, "rotation": 90.0},
            headers=self._auth(user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["fill"] == "#FF0000"
        assert data["opacity"] == 0.5
        assert data["rotation"] == 90.0

    def test_update_element_not_found(self, client):
        user, canvas = self._setup(client)
        response = client.patch(
            f"/api/canvas/{canvas['id']}/elements/00000000-0000-0000-0000-000000000000",
            json={"x": 100.0},
            headers=self._auth(user),
        )
        assert response.status_code == 404


class TestDeleteElement(_ElementTestBase):
    def test_delete_element(self, client):
        user, canvas = self._setup(client)
        element = client.post(
            f"/api/canvas/{canvas['id']}/elements",
            json={"element_type": "triangle", "x": 0, "y": 0, "width": 50, "height": 50},
            headers=self._auth(user),
        ).json()

        response = client.delete(
            f"/api/canvas/{canvas['id']}/elements/{element['id']}",
            headers=self._auth(user),
        )
        assert response.status_code == 204

        get_resp = client.get(
            f"/api/canvas/{canvas['id']}/elements",
            headers=self._auth(user),
        )
        assert len(get_resp.json()) == 0

    def test_delete_element_not_found(self, client):
        user, canvas = self._setup(client)
        response = client.delete(
            f"/api/canvas/{canvas['id']}/elements/00000000-0000-0000-0000-000000000000",
            headers=self._auth(user),
        )
        assert response.status_code == 404

    def test_delete_element_unauthenticated(self, client):
        response = client.delete(
            "/api/canvas/00000000-0000-0000-0000-000000000000/elements/00000000-0000-0000-0000-000000000000"
        )
        assert response.status_code == 401
