from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.note_repository import NoteRepository
from app.schemas.note import NoteCreate, NoteResponse
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException
from app.models import EntityType
from math import ceil
from loguru import logger


class NoteService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NoteRepository(db)
    
    def get_note(self, note_id: int) -> NoteResponse:
        note = self.repo.get_by_id(note_id)
        if not note:
            raise NotFoundException("Note not found")
        return NoteResponse.model_validate(note)
    
    def list_notes(
        self,
        page: int = 1,
        page_size: int = 20,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[int] = None
    ) -> PaginatedResponse[NoteResponse]:
        items, total = self.repo.list_all(page, page_size, entity_type, entity_id)
        
        responses = []
        for item in items:
            response = NoteResponse.model_validate(item)
            if item.created_by_user:
                response.created_by_username = item.created_by_user.username
            responses.append(response)
        
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_note(self, data: NoteCreate, user_id: int) -> NoteResponse:
        logger.info(f"Creating note for {data.entity_type}:{data.entity_id} (by user {user_id})")
        note = self.repo.create(data, user_id)
        logger.info(f"Note created successfully - ID: {note.id}")
        
        response = NoteResponse.model_validate(note)
        if note.created_by_user:
            response.created_by_username = note.created_by_user.username
        
        return response
    
    def delete_note(self, note_id: int) -> None:
        note = self.repo.get_by_id(note_id)
        if not note:
            logger.warning(f"Delete failed - Note not found: ID {note_id}")
            raise NotFoundException("Note not found")
        logger.info(f"Deleting note - ID: {note_id}, Entity: {note.entity_type}:{note.entity_id}")
        self.repo.delete(note)
        logger.info(f"Note deleted successfully - ID: {note_id}")
