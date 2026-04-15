"""
Tests for canvas sharing endpoints.

Verifies share token generation and joining a canvas via shared token.
"""


class TestShareCanvas:
    def _create_canvas(self, client) -> tuple[dict, dict]:
        user = client.post(
            "/api/auth/signup",
            json={
                "email": "sharer@example.com",
                "password": "pass123456",
                "display_name": "Sharer",
            },
        ).json()
        canvas = client.post(
            "/api/canvas",
            json={"title": "Shared Canvas"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        ).json()
        return user, canvas

    def test_get_share_info(self, client):
        user, canvas = self._create_canvas(client)
        response = client.get(
            f"/api/canvas/{canvas['id']}/share",
            headers={"Authorization": f"Bearer {user['access_token']}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "share_token" in data
        assert "share_url" in data
        assert data["share_token"] == canvas["share_token"]

    def test_get_share_info_not_found(self, client):
        user = client.post(
            "/api/auth/signup",
            json={
                "email": "share-nf@example.com",
                "password": "pass123456",
                "display_name": "ShareNF",
            },
        ).json()
        response = client.get(
            "/api/canvas/00000000-0000-0000-0000-000000000000/share",
            headers={"Authorization": f"Bearer {user['access_token']}"},
        )
        assert response.status_code == 404

    def test_get_share_unauthenticated(self, client):
        response = client.get(
            "/api/canvas/00000000-0000-0000-0000-000000000000/share"
        )
        assert response.status_code == 401


class TestJoinCanvas:
    def _create_canvas(self, client) -> tuple[dict, dict]:
        user = client.post(
            "/api/auth/signup",
            json={
                "email": "join-owner@example.com",
                "password": "pass123456",
                "display_name": "Join Owner",
            },
        ).json()
        canvas = client.post(
            "/api/canvas",
            json={"title": "Joinable Canvas"},
            headers={"Authorization": f"Bearer {user['access_token']}"},
        ).json()
        return user, canvas

    def test_join_canvas_via_token(self, client):
        user, canvas = self._create_canvas(client)
        joiner = client.post(
            "/api/auth/signup",
            json={
                "email": "joiner@example.com",
                "password": "pass123456",
                "display_name": "Joiner",
            },
        ).json()

        response = client.get(
            f"/api/canvas/join/{canvas['share_token']}",
            headers={"Authorization": f"Bearer {joiner['access_token']}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == canvas["id"]
        assert data["title"] == "Joinable Canvas"

    def test_join_canvas_invalid_token(self, client):
        joiner = client.post(
            "/api/auth/signup",
            json={
                "email": "bad-join@example.com",
                "password": "pass123456",
                "display_name": "BadJoin",
            },
        ).json()
        response = client.get(
            "/api/canvas/join/nonexistent-token",
            headers={"Authorization": f"Bearer {joiner['access_token']}"},
        )
        assert response.status_code == 404

    def test_join_canvas_unauthenticated(self, client):
        response = client.get("/api/canvas/join/some-token")
        assert response.status_code == 401
