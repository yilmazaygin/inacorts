from pydantic import BaseModel
from datetime import datetime
from app.models import EntityType


class NoteBase(BaseModel):
    entity_type: EntityType
    entity_id: int
    text: str


class NoteCreate(NoteBase):
    pass


class NoteResponse(NoteBase):
    id: int
    created_at: datetime
    created_by: int
    created_by_username: str | None = None  # WHO created the note
    
    class Config:
        from_attributes = True

