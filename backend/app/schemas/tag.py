from pydantic import BaseModel
from datetime import datetime
from app.models import TagEntityType


class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    
    class Config:
        from_attributes = True


class TagLinkRequest(BaseModel):
    tag_id: int
    entity_type: TagEntityType
    entity_id: int


class TagUnlinkRequest(BaseModel):
    tag_id: int
    entity_type: TagEntityType
    entity_id: int
