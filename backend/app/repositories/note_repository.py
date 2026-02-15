from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models import Note, EntityType
from app.schemas.note import NoteCreate


class NoteRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, note_id: int) -> Optional[Note]:
        return self.db.query(Note).filter(Note.id == note_id).first()
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[int] = None
    ) -> Tuple[List[Note], int]:
        query = self.db.query(Note)
        
        if entity_type:
            query = query.filter(Note.entity_type == entity_type)
        
        if entity_id is not None:
            query = query.filter(Note.entity_id == entity_id)
        
        total = query.count()
        
        query = query.order_by(Note.created_at.desc())
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(self, data: NoteCreate, user_id: int) -> Note:
        note = Note(
            **data.model_dump(),
            created_by=user_id
        )
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note
    
    def delete(self, note: Note) -> None:
        self.db.delete(note)
        self.db.commit()
