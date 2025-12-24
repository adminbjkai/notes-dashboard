from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.schemas.note import NoteCreate, NoteReorder
from app.services.note_service import NoteService


def make_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)()


def test_reorder_within_same_parent():
    """Test moving notes up and down within the same parent."""
    db = make_session()
    service = NoteService(db)

    # Create parent with 3 children
    parent = service.create(NoteCreate(title="Parent"))
    child1 = service.create(NoteCreate(title="Child 1", parent_id=parent.id))
    _child2 = service.create(NoteCreate(title="Child 2", parent_id=parent.id))
    child3 = service.create(NoteCreate(title="Child 3", parent_id=parent.id))

    # Initial positions should be 0, 1, 2 (0-indexed after normalization fix)
    children = service.get_children(parent.id)
    assert [c.title for c in children] == ["Child 1", "Child 2", "Child 3"]
    assert [c.position for c in children] == [0, 1, 2]

    # Move Child 1 to position 1 (between Child 2 and Child 3)
    # Position 1 means: in the sibling array [Child2, Child3], insert at index 1
    service.reorder(child1.id, NoteReorder(parent_id=parent.id, position=1))

    # Should be normalized to 0, 1, 2
    children = service.get_children(parent.id)
    assert [c.title for c in children] == ["Child 2", "Child 1", "Child 3"]
    assert [c.position for c in children] == [0, 1, 2]

    # Move Child 3 to position 0 (first)
    service.reorder(child3.id, NoteReorder(parent_id=parent.id, position=0))

    children = service.get_children(parent.id)
    assert [c.title for c in children] == ["Child 3", "Child 2", "Child 1"]
    assert [c.position for c in children] == [0, 1, 2]


def test_reorder_to_different_parent():
    """Test moving notes between different parents."""
    db = make_session()
    service = NoteService(db)

    # Create two parents with children
    parent1 = service.create(NoteCreate(title="Parent 1"))
    child1a = service.create(NoteCreate(title="Child 1A", parent_id=parent1.id))
    _child1b = service.create(NoteCreate(title="Child 1B", parent_id=parent1.id))

    parent2 = service.create(NoteCreate(title="Parent 2"))
    _child2a = service.create(NoteCreate(title="Child 2A", parent_id=parent2.id))
    _child2b = service.create(NoteCreate(title="Child 2B", parent_id=parent2.id))

    # Move Child 1A to Parent 2 at position 1
    service.reorder(child1a.id, NoteReorder(parent_id=parent2.id, position=1))

    # Parent 1 should have normalized positions
    children1 = service.get_children(parent1.id)
    assert [c.title for c in children1] == ["Child 1B"]
    assert [c.position for c in children1] == [0]

    # Parent 2 should have normalized positions
    children2 = service.get_children(parent2.id)
    assert [c.title for c in children2] == ["Child 2A", "Child 1A", "Child 2B"]
    assert [c.position for c in children2] == [0, 1, 2]


def test_reorder_to_position_beyond_count():
    """Test moving to a position beyond the sibling count."""
    db = make_session()
    service = NoteService(db)

    parent = service.create(NoteCreate(title="Parent"))
    child1 = service.create(NoteCreate(title="Child 1", parent_id=parent.id))
    _child2 = service.create(NoteCreate(title="Child 2", parent_id=parent.id))

    # Try to move Child 1 to position 999 (way beyond count)
    service.reorder(child1.id, NoteReorder(parent_id=parent.id, position=999))

    # Should be normalized - Child 1 should be at the end
    children = service.get_children(parent.id)
    assert [c.title for c in children] == ["Child 2", "Child 1"]
    assert [c.position for c in children] == [0, 1]


def test_reorder_no_change():
    """Test that reordering to same position is a no-op."""
    db = make_session()
    service = NoteService(db)

    parent = service.create(NoteCreate(title="Parent"))
    child1 = service.create(NoteCreate(title="Child 1", parent_id=parent.id))
    _child2 = service.create(NoteCreate(title="Child 2", parent_id=parent.id))

    # Initial state: Child1 is at index 0, Child2 is at index 1
    children = service.get_children(parent.id)
    assert [c.title for c in children] == ["Child 1", "Child 2"]

    # Move child1 to position 0 (first position, where it already is)
    # Position 0 means: in sibling array [Child2], insert at index 0 (before Child2)
    result = service.reorder(child1.id, NoteReorder(parent_id=parent.id, position=0))

    # Should return early without changes (or perform minimal work)
    assert result.id == child1.id

    # Should still be in the same order
    children = service.get_children(parent.id)
    assert [c.title for c in children] == ["Child 1", "Child 2"]


def test_move_to_root():
    """Test moving a note from a parent to root level."""
    db = make_session()
    service = NoteService(db)

    parent = service.create(NoteCreate(title="Parent"))
    child = service.create(NoteCreate(title="Child", parent_id=parent.id))
    _root = service.create(NoteCreate(title="Root"))

    # Move child to root
    service.reorder(child.id, NoteReorder(parent_id=None, position=0))

    # Parent should have no children
    assert len(service.get_children(parent.id)) == 0

    # Root level should have normalized positions
    roots = service.get_children(None)
    assert len(roots) == 3
    assert [n.position for n in roots] == [0, 1, 2]
