from datetime import datetime

from pydantic import BaseModel


class NoteBase(BaseModel):
    title: str
    content: str | None = None
    sidenote: str | None = None
    parent_id: str | None = None


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    sidenote: str | None = None
    parent_id: str | None = None
    position: int | None = None


class NoteReorder(BaseModel):
    """Payload for reordering/moving a note"""
    parent_id: str | None = None  # New parent (null for root)
    position: int  # New position within parent


class NoteResponse(NoteBase):
    id: str
    position: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
