"""
Tests for the auth system: signup, login, JWT validation, and edge cases.

Uses the `client` fixture which overrides the DB dependency with an
in-memory SQLite session, so no running Postgres is required.
"""


class TestSignup:
    def test_signup_success(self, client):
        response = client.post(
            "/api/auth/signup",
            json={
                "email": "alice@example.com",
                "password": "securepass123",
                "display_name": "Alice",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "alice@example.com"
        assert data["display_name"] == "Alice"
        assert "id" in data
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "password" not in data
        assert "hashed_password" not in data

    def test_signup_duplicate_email(self, client):
        client.post(
            "/api/auth/signup",
            json={
                "email": "dup@example.com",
                "password": "pass123",
                "display_name": "First",
            },
        )
        response = client.post(
            "/api/auth/signup",
            json={
                "email": "dup@example.com",
                "password": "pass456",
                "display_name": "Second",
            },
        )
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"].lower()

    def test_signup_missing_fields(self, client):
        response = client.post(
            "/api/auth/signup",
            json={"email": "incomplete@example.com"},
        )
        assert response.status_code == 422

    def test_signup_invalid_email(self, client):
        response = client.post(
            "/api/auth/signup",
            json={
                "email": "not-an-email",
                "password": "pass123",
                "display_name": "Bad Email",
            },
        )
        assert response.status_code == 422

    def test_signup_short_password(self, client):
        response = client.post(
            "/api/auth/signup",
            json={
                "email": "short@example.com",
                "password": "ab",
                "display_name": "Short Pass",
            },
        )
        assert response.status_code == 422


class TestLogin:
    def _create_user(self, client):
        client.post(
            "/api/auth/signup",
            json={
                "email": "login@example.com",
                "password": "correctpass",
                "display_name": "Login User",
            },
        )

    def test_login_success(self, client):
        self._create_user(client)
        response = client.post(
            "/api/auth/login",
            json={
                "email": "login@example.com",
                "password": "correctpass",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["email"] == "login@example.com"

    def test_login_wrong_password(self, client):
        self._create_user(client)
        response = client.post(
            "/api/auth/login",
            json={
                "email": "login@example.com",
                "password": "wrongpass",
            },
        )
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        response = client.post(
            "/api/auth/login",
            json={
                "email": "ghost@example.com",
                "password": "anypass",
            },
        )
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()


class TestGetMe:
    def test_get_current_user(self, client):
        signup_resp = client.post(
            "/api/auth/signup",
            json={
                "email": "me@example.com",
                "password": "mypass123",
                "display_name": "Me User",
            },
        )
        token = signup_resp.json()["access_token"]

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "me@example.com"
        assert data["display_name"] == "Me User"

    def test_get_me_no_token(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer garbage.token.here"},
        )
        assert response.status_code == 401
