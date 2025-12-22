from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest

from app.database import Base
from app.schemas.note import NoteCreate, NoteReorder, NoteUpdate
from app.services.note_service import NoteService


def make_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)()


def test_update_rejects_self_parenting():
    db = make_session()
    service = NoteService(db)

    note = service.create(NoteCreate(title="Root"))

    with pytest.raises(ValueError, match="own parent"):
        service.update(note.id, NoteUpdate(parent_id=note.id))


def test_reorder_rejects_descendant_cycle():
    db = make_session()
    service = NoteService(db)

    parent = service.create(NoteCreate(title="Parent"))
    child = service.create(NoteCreate(title="Child", parent_id=parent.id))

    with pytest.raises(ValueError, match="descendant"):
        service.reorder(parent.id, NoteReorder(parent_id=child.id, position=0))
