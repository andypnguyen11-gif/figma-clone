"""
Tests for Canvas CRUD endpoints.

All endpoints require authentication. Uses the `client` fixture which
overrides the DB with an in-memory SQLite session.
"""


class TestCreateCanvas:
    def _signup(self, client) -> dict:
        resp = client.post(
            "/api/auth/signup",
            json={
                "email": "canvas-owner@example.com",
                "password": "pass123456",
                "display_name": "Canvas Owner",
            },
        )
        return resp.json()

    def test_create_canvas(self, client):
        user = self._signup(client)
        response = client.post(
            "/api/canvas",
            json={"title": "My Design"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "My Design"
        assert "id" in data
        assert "share_token" in data
        assert data["owner_id"] == user["id"]

    def test_create_canvas_unauthenticated(self, client):
        response = client.post("/api/canvas", json={"title": "No Auth"})
        assert response.status_code == 401

    def test_create_canvas_missing_title(self, client):
        user = self._signup(client)
        response = client.post(
            "/api/canvas",
            json={},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        )
        assert response.status_code == 422


class TestGetCanvas:
    def _create_canvas(self, client) -> tuple[dict, dict]:
        user = client.post(
            "/api/auth/signup",
            json={
                "email": "get-canvas@example.com",
                "password": "pass123456",
                "display_name": "Getter",
            },
        ).json()
        canvas = client.post(
            "/api/canvas",
            json={"title": "Fetch Me"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        ).json()
        return user, canvas

    def test_get_canvas(self, client):
        user, canvas = self._create_canvas(client)
        response = client.get(
            f"/api/canvas/{canvas['id']}",
            headers={"Authorization": f"Bearer {user['access_token']}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == canvas["id"]
        assert data["title"] == "Fetch Me"

    def test_get_canvas_not_found(self, client):
        user = client.post(
            "/api/auth/signup",
            json={
                "email": "notfound@example.com",
                "password": "pass123456",
                "display_name": "NotFound",
            },
        ).json()
        response = client.get(
            "/api/canvas/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": f"Bearer {user['access_token']}"},
        )
        assert response.status_code == 404

    def test_get_canvas_unauthenticated(self, client):
        response = client.get("/api/canvas/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 401


class TestUpdateCanvas:
    def _create_canvas(self, client) -> tuple[dict, dict]:
        user = client.post(
            "/api/auth/signup",
            json={
                "email": "updater@example.com",
                "password": "pass123456",
                "display_name": "Updater",
            },
        ).json()
        canvas = client.post(
            "/api/canvas",
            json={"title": "Old Title"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        ).json()
        return user, canvas

    def test_update_canvas_title(self, client):
        user, canvas = self._create_canvas(client)
        response = client.patch(
            f"/api/canvas/{canvas['id']}",
            json={"title": "New Title"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "New Title"

    def test_update_canvas_not_found(self, client):
        user = client.post(
            "/api/auth/signup",
            json={
                "email": "update-nf@example.com",
                "password": "pass123456",
                "display_name": "UpdateNF",
            },
        ).json()
        response = client.patch(
            "/api/canvas/00000000-0000-0000-0000-000000000000",
            json={"title": "Nope"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        )
        assert response.status_code == 404
