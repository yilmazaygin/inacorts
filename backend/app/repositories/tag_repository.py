from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models import Tag, TagLink, TagEntityType
from app.schemas.tag import TagCreate


class TagRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, tag_id: int) -> Optional[Tag]:
        return self.db.query(Tag).filter(Tag.id == tag_id).first()
    
    def get_by_name(self, name: str) -> Optional[Tag]:
        return self.db.query(Tag).filter(Tag.name == name).first()
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Tag], int]:
        query = self.db.query(Tag)
        total = query.count()
        
        query = query.order_by(Tag.name.asc())
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(self, data: TagCreate, user_id: int) -> Tag:
        tag = Tag(
            **data.model_dump(),
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag
    
    def delete(self, tag: Tag) -> None:
        self.db.delete(tag)
        self.db.commit()
    
    def link_to_entity(
        self,
        tag_id: int,
        entity_type: TagEntityType,
        entity_id: int,
        user_id: int
    ) -> TagLink:
        existing = self.db.query(TagLink).filter(
            TagLink.tag_id == tag_id,
            TagLink.entity_type == entity_type,
            TagLink.entity_id == entity_id
        ).first()
        
        if existing:
            return existing
        
        link = TagLink(
            tag_id=tag_id,
            entity_type=entity_type,
            entity_id=entity_id,
            created_by=user_id
        )
        self.db.add(link)
        self.db.commit()
        self.db.refresh(link)
        return link
    
    def unlink_from_entity(
        self,
        tag_id: int,
        entity_type: TagEntityType,
        entity_id: int
    ) -> bool:
        link = self.db.query(TagLink).filter(
            TagLink.tag_id == tag_id,
            TagLink.entity_type == entity_type,
            TagLink.entity_id == entity_id
        ).first()
        
        if link:
            self.db.delete(link)
            self.db.commit()
            return True
        return False
