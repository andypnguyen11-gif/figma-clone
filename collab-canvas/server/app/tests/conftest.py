"""
Shared test fixtures for the Collab Canvas backend test suite.

Provides an isolated in-memory SQLite database per test session so model
tests run fast without requiring a running PostgreSQL instance.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base


@pytest.fixture(scope="session")
def engine():
    """Create a single in-memory SQLite engine shared across all tests."""
    engine = create_engine("sqlite:///:memory:")
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
