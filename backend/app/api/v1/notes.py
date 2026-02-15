from fastapi import APIRouter
from typing import Optional
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.note_service import NoteService
from app.schemas.note import NoteCreate, NoteResponse
from app.schemas.common import PaginatedResponse
from app.models import EntityType

router = APIRouter()


@router.get("", response_model=PaginatedResponse[NoteResponse])
def list_notes(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = 1,
    page_size: int = 20,
    entity_type: Optional[EntityType] = None,
    entity_id: Optional[int] = None
):
    service = NoteService(db)
    return service.list_notes(page, page_size, entity_type, entity_id)


@router.post("", response_model=NoteResponse)
def create_note(
    data: NoteCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = NoteService(db)
    return service.create_note(data, current_user.id)


@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = NoteService(db)
    service.delete_note(note_id)
    return {"message": "Note deleted successfully"}
