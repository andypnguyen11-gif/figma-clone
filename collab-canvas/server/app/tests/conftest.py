"""
Shared test fixtures for the Collab Canvas backend test suite.

Provides an isolated in-memory SQLite database per test session so model
and endpoint tests run fast without requiring a running PostgreSQL instance.
The `client` fixture wires FastAPI's DB dependency to the test session.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture(scope="session")
def engine():
    """Create a single in-memory SQLite engine shared across all tests.

    check_same_thread=False is required because FastAPI's TestClient
    dispatches requests on a background thread while the test itself
    runs on the main thread.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture()
def db_session(engine):
    """Yield a transactional session that is rolled back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(bind=connection)
    session = session_factory()

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """FastAPI TestClient with the DB dependency overridden to use the test session."""

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
