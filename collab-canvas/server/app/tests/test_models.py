"""
Tests for SQLAlchemy ORM models: User, Canvas, Element.

Validates schema correctness, field defaults, constraints, and relationships.
Uses an in-memory SQLite database via the db_session fixture.
"""
import uuid

from app.models.user import User
from app.models.canvas import Canvas
from app.models.element import Element


# ---------------------------------------------------------------------------
# User model
# ---------------------------------------------------------------------------

class TestUserModel:
    def test_create_user(self, db_session):
        user = User(
            email="alice@example.com",
            hashed_password="fakehash123",
            display_name="Alice",
        )
        db_session.add(user)
        db_session.flush()

        assert user.id is not None
        assert isinstance(user.id, uuid.UUID)
        assert user.email == "alice@example.com"
        assert user.display_name == "Alice"
        assert user.created_at is not None
        assert user.updated_at is not None

    def test_user_email_is_unique(self, db_session):
        user1 = User(
            email="dup@example.com",
            hashed_password="hash1",
            display_name="User1",
        )
        user2 = User(
            email="dup@example.com",
            hashed_password="hash2",
            display_name="User2",
        )
        db_session.add(user1)
        db_session.flush()
        db_session.add(user2)
        try:
            db_session.flush()
            assert False, "Expected IntegrityError for duplicate email"
        except Exception:
            db_session.rollback()

    def test_user_requires_email(self, db_session):
        user = User(hashed_password="hash", display_name="NoEmail")
        db_session.add(user)
        try:
            db_session.flush()
            assert False, "Expected IntegrityError for null email"
        except Exception:
            db_session.rollback()

    def test_user_requires_hashed_password(self, db_session):
        user = User(email="nopass@example.com", display_name="NoPass")
        db_session.add(user)
        try:
            db_session.flush()
            assert False, "Expected IntegrityError for null hashed_password"
        except Exception:
            db_session.rollback()


# ---------------------------------------------------------------------------
# Canvas model
# ---------------------------------------------------------------------------

class TestCanvasModel:
    def test_create_canvas(self, db_session):
        owner = User(
            email="owner@example.com",
            hashed_password="hash",
            display_name="Owner",
        )
        db_session.add(owner)
        db_session.flush()

        canvas = Canvas(title="My Design", owner_id=owner.id)
        db_session.add(canvas)
        db_session.flush()

        assert canvas.id is not None
        assert isinstance(canvas.id, uuid.UUID)
        assert canvas.title == "My Design"
        assert canvas.owner_id == owner.id
        assert canvas.share_token is not None
        assert canvas.created_at is not None
        assert canvas.updated_at is not None

    def test_canvas_share_token_is_unique(self, db_session):
        owner = User(
            email="owner2@example.com",
            hashed_password="hash",
            display_name="Owner2",
        )
        db_session.add(owner)
        db_session.flush()

        canvas1 = Canvas(
            title="Canvas 1", owner_id=owner.id, share_token="same-token"
        )
        canvas2 = Canvas(
            title="Canvas 2", owner_id=owner.id, share_token="same-token"
        )
        db_session.add(canvas1)
        db_session.flush()
        db_session.add(canvas2)
        try:
            db_session.flush()
            assert False, "Expected IntegrityError for duplicate share_token"
        except Exception:
            db_session.rollback()

    def test_canvas_owner_relationship(self, db_session):
        owner = User(
            email="relowner@example.com",
            hashed_password="hash",
            display_name="RelOwner",
        )
        db_session.add(owner)
        db_session.flush()

        canvas = Canvas(title="Rel Canvas", owner_id=owner.id)
        db_session.add(canvas)
        db_session.flush()

        assert canvas.owner.id == owner.id
        assert canvas in owner.canvases

    def test_canvas_requires_owner(self, db_session):
        canvas = Canvas(title="Orphan")
        db_session.add(canvas)
        try:
            db_session.flush()
            assert False, "Expected IntegrityError for null owner_id"
        except Exception:
            db_session.rollback()


# ---------------------------------------------------------------------------
# Element model
# ---------------------------------------------------------------------------

class TestElementModel:
    def _make_canvas(self, db_session):
        owner = User(
            email=f"elem-owner-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hash",
            display_name="ElemOwner",
        )
        db_session.add(owner)
        db_session.flush()
        canvas = Canvas(title="Element Canvas", owner_id=owner.id)
        db_session.add(canvas)
        db_session.flush()
        return canvas

    def test_create_rectangle_element(self, db_session):
        canvas = self._make_canvas(db_session)

        element = Element(
            canvas_id=canvas.id,
            element_type="rectangle",
            x=10.0,
            y=20.0,
            width=100.0,
            height=50.0,
        )
        db_session.add(element)
        db_session.flush()

        assert element.id is not None
        assert isinstance(element.id, uuid.UUID)
        assert element.element_type == "rectangle"
        assert element.x == 10.0
        assert element.y == 20.0
        assert element.width == 100.0
        assert element.height == 50.0
        assert element.created_at is not None
        assert element.updated_at is not None

    def test_element_defaults(self, db_session):
        """Verify sensible defaults for styling properties."""
        canvas = self._make_canvas(db_session)

        element = Element(
            canvas_id=canvas.id,
            element_type="circle",
            x=0.0,
            y=0.0,
            width=50.0,
            height=50.0,
        )
        db_session.add(element)
        db_session.flush()

        assert element.fill == "#FFFFFF"
        assert element.stroke == "#000000"
        assert element.stroke_width == 1.0
        assert element.opacity == 1.0
        assert element.rotation == 0.0
        assert element.z_index == 0

    def test_element_text_properties(self, db_session):
        canvas = self._make_canvas(db_session)

        element = Element(
            canvas_id=canvas.id,
            element_type="text",
            x=50.0,
            y=50.0,
            width=200.0,
            height=40.0,
            text_content="Hello World",
            font_size=24.0,
            text_color="#FF0000",
        )
        db_session.add(element)
        db_session.flush()

        assert element.text_content == "Hello World"
        assert element.font_size == 24.0
        assert element.text_color == "#FF0000"

    def test_element_canvas_relationship(self, db_session):
        canvas = self._make_canvas(db_session)

        element = Element(
            canvas_id=canvas.id,
            element_type="line",
            x=0.0,
            y=0.0,
            width=100.0,
            height=0.0,
        )
        db_session.add(element)
        db_session.flush()

        assert element.canvas.id == canvas.id
        assert element in canvas.elements

    def test_element_requires_canvas(self, db_session):
        element = Element(
            element_type="rectangle",
            x=0.0,
            y=0.0,
            width=50.0,
            height=50.0,
        )
        db_session.add(element)
        try:
            db_session.flush()
            assert False, "Expected IntegrityError for null canvas_id"
        except Exception:
            db_session.rollback()

    def test_element_requires_type(self, db_session):
        canvas = self._make_canvas(db_session)
        element = Element(
            canvas_id=canvas.id,
            x=0.0,
            y=0.0,
            width=50.0,
            height=50.0,
        )
        db_session.add(element)
        try:
            db_session.flush()
            assert False, "Expected IntegrityError for null element_type"
        except Exception:
            db_session.rollback()

    def test_cascade_delete_canvas_removes_elements(self, db_session):
        canvas = self._make_canvas(db_session)
        element = Element(
            canvas_id=canvas.id,
            element_type="rectangle",
            x=0.0,
            y=0.0,
            width=50.0,
            height=50.0,
        )
        db_session.add(element)
        db_session.flush()

        element_id = element.id
        db_session.delete(canvas)
        db_session.flush()

        assert db_session.get(Element, element_id) is None

    def test_all_element_types(self, db_session):
        """Ensure all five supported shape types can be persisted."""
        canvas = self._make_canvas(db_session)
        for etype in ("rectangle", "circle", "line", "triangle", "text"):
            elem = Element(
                canvas_id=canvas.id,
                element_type=etype,
                x=0.0,
                y=0.0,
                width=50.0,
                height=50.0,
            )
            db_session.add(elem)
        db_session.flush()

        elements = (
            db_session.query(Element)
            .filter(Element.canvas_id == canvas.id)
            .all()
        )
        types = {e.element_type for e in elements}
        assert types == {"rectangle", "circle", "line", "triangle", "text"}
