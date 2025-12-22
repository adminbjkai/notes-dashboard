import uuid

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate, NoteReorder


class NoteService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> list[Note]:
        """Get all notes ordered by position within their parent groups."""
        return self.db.query(Note).order_by(Note.parent_id.nullsfirst(), Note.position, Note.created_at.desc()).all()

    def get_by_id(self, note_id: str) -> Note | None:
        return self.db.query(Note).filter(Note.id == note_id).first()

    def get_children(self, parent_id: str | None) -> list[Note]:
        """Get direct children of a parent (or root notes if parent_id is None)."""
        query = self.db.query(Note).filter(Note.parent_id == parent_id)
        return query.order_by(Note.position).all()

    def _parent_exists(self, parent_id: str | None) -> bool:
        if parent_id is None:
            return True
        return self.db.query(Note.id).filter(Note.id == parent_id).first() is not None

    def _get_next_position(self, parent_id: str | None) -> int:
        """Get the next available position for a given parent (0-indexed)."""
        count = self.db.query(func.count(Note.id)).filter(
            Note.parent_id == parent_id
        ).scalar()
        return count or 0

    def _normalize_positions(self, parent_id: str | None) -> None:
        notes = (
            self.db.query(Note)
            .filter(Note.parent_id == parent_id)
            .order_by(Note.position, Note.created_at, Note.id)
            .all()
        )
        for index, note in enumerate(notes):
            if note.position != index:
                note.position = index
        self.db.flush()

    def create(self, data: NoteCreate) -> Note:
        note_id = str(uuid.uuid4())
        if data.parent_id == note_id:
            raise ValueError("Note cannot be its own parent")
        if not self._parent_exists(data.parent_id):
            raise ValueError("Parent note does not exist")

        # Auto-assign position at the end of the list
        position = self._get_next_position(data.parent_id)

        note = Note(
            id=note_id,
            title=data.title,
            content=data.content,
            sidenote=data.sidenote,
            parent_id=data.parent_id,
            position=position,
        )
        self.db.add(note)
        self.db.flush()

        # Normalize to ensure clean 0-indexed positions
        self._normalize_positions(data.parent_id)

        self.db.commit()
        self.db.refresh(note)
        return note

    def update(self, note_id: str, data: NoteUpdate) -> Note | None:
        note = self.get_by_id(note_id)
        if not note:
            return None

        # Track old parent_id to normalize positions after parent change
        old_parent_id = note.parent_id

        update_data = data.model_dump(exclude_unset=True)
        if "parent_id" in update_data:
            new_parent_id = update_data["parent_id"]
            if new_parent_id == note_id:
                raise ValueError("Note cannot be its own parent")
            if not self._parent_exists(new_parent_id):
                raise ValueError("Parent note does not exist")
            if new_parent_id and self._is_descendant(new_parent_id, note_id):
                raise ValueError("Cannot move note under its own descendant")
        for field, value in update_data.items():
            setattr(note, field, value)

        self.db.commit()

        # Normalize positions if parent changed
        if "parent_id" in update_data and update_data["parent_id"] != old_parent_id:
            self._normalize_positions(old_parent_id)
            self._normalize_positions(update_data["parent_id"])

        self.db.refresh(note)
        return note

    def reorder(self, note_id: str, data: NoteReorder) -> Note | None:
        """Move a note to a new position, optionally under a new parent.

        The requested position is the target index in the sibling array (0-indexed).
        We update sibling positions minimally to ensure correct sort order, then
        normalize to clean up gaps and ensure sequential 0-indexed positions.
        """
        note = self.get_by_id(note_id)
        if not note:
            return None

        old_parent_id = note.parent_id
        old_position = note.position
        new_parent_id = data.parent_id
        new_position = data.position

        # Prevent circular references
        if new_parent_id:
            if new_parent_id == note_id:
                raise ValueError("Note cannot be its own parent")
            if not self._parent_exists(new_parent_id):
                raise ValueError("Parent note does not exist")
            # Check if new_parent_id is a descendant of note_id
            if self._is_descendant(new_parent_id, note_id):
                raise ValueError("Cannot move note under its own descendant")

        # Get current siblings in the target parent (excluding the moved note)
        siblings = (
            self.db.query(Note)
            .filter(Note.parent_id == new_parent_id, Note.id != note_id)
            .order_by(Note.position, Note.created_at)
            .all()
        )

        # Early return if moving within same parent and already at correct position
        if old_parent_id == new_parent_id:
            current_index = None
            for i, sib in enumerate(siblings):
                if sib.position > old_position:
                    # Note comes before this sibling
                    current_index = i
                    break
            if current_index is None:
                current_index = len(siblings)  # Note is at the end

            if current_index == new_position:
                # Already in the correct position, no reorder needed
                return note

        # Temporarily set position to a large value to avoid conflicts during update
        note.position = 999999
        note.parent_id = new_parent_id
        self.db.flush()

        # Insert the note at the desired position
        # Shift siblings to make room: those at or after new_position move down
        for i, sibling in enumerate(siblings):
            if i >= new_position:
                sibling.position = i + 1
            else:
                sibling.position = i

        # Set the moved note's final position
        note.position = new_position
        self.db.flush()

        # Normalize both parents to ensure clean sequential positions
        self._normalize_positions(old_parent_id)
        if new_parent_id != old_parent_id:
            self._normalize_positions(new_parent_id)

        self.db.commit()
        self.db.refresh(note)
        return note

    def _is_descendant(self, potential_descendant_id: str, ancestor_id: str) -> bool:
        """Check if potential_descendant_id is a descendant of ancestor_id.

        Uses recursive CTE with depth limit to prevent infinite loops.
        """
        query = text(
            """
            WITH RECURSIVE descendants AS (
                SELECT id, 1 AS depth FROM notes WHERE parent_id = :ancestor_id
                UNION ALL
                SELECT n.id, d.depth + 1 FROM notes n
                JOIN descendants d ON n.parent_id = d.id
                WHERE d.depth < 100
            )
            SELECT 1 FROM descendants WHERE id = :descendant_id LIMIT 1
            """
        )
        result = self.db.execute(
            query,
            {"ancestor_id": ancestor_id, "descendant_id": potential_descendant_id},
        ).first()
        return result is not None

    def delete(self, note_id: str) -> bool:
        note = self.get_by_id(note_id)
        if not note:
            return False

        parent_id = note.parent_id

        # Delete the note (cascade will handle children)
        self.db.delete(note)
        self.db.flush()

        # Normalize positions in the parent to close the gap
        self._normalize_positions(parent_id)
        self.db.commit()

        return True

    def delete_all_notes(self) -> None:
        self.db.execute(text("TRUNCATE TABLE notes RESTART IDENTITY CASCADE"))
        self.db.commit()
