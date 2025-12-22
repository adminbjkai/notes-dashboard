from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.note import NoteCreate, NoteReorder, NoteResponse, NoteUpdate
from app.services.note_service import NoteService

router = APIRouter()


def get_note_service(db: Session = Depends(get_db)) -> NoteService:
    return NoteService(db)


@router.get("", response_model=list[NoteResponse])
def list_notes(service: NoteService = Depends(get_note_service)):
    return service.get_all()


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: str, service: NoteService = Depends(get_note_service)):
    note = service.get_by_id(note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.post("", response_model=NoteResponse, status_code=201)
def create_note(data: NoteCreate, service: NoteService = Depends(get_note_service)):
    try:
        return service.create(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, data: NoteUpdate, service: NoteService = Depends(get_note_service)):
    try:
        note = service.update(note_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.patch("/{note_id}/reorder", response_model=NoteResponse)
def reorder_note(note_id: str, data: NoteReorder, service: NoteService = Depends(get_note_service)):
    """Move a note to a new position, optionally under a new parent."""
    try:
        note = service.reorder(note_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: str, service: NoteService = Depends(get_note_service)):
    if not service.delete(note_id):
        raise HTTPException(status_code=404, detail="Note not found")


@router.delete("/reset/all", status_code=204)
def reset_notes(service: NoteService = Depends(get_note_service)):
    # TODO: Restrict to admin-only access.
    service.delete_all_notes()
