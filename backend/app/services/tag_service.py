from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.tag_repository import TagRepository
from app.schemas.tag import TagCreate, TagResponse, TagLinkRequest, TagUnlinkRequest
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException, BadRequestException
from math import ceil
from loguru import logger


class TagService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = TagRepository(db)
    
    def get_tag(self, tag_id: int) -> TagResponse:
        tag = self.repo.get_by_id(tag_id)
        if not tag:
            raise NotFoundException("Tag not found")
        return TagResponse.model_validate(tag)
    
    def list_tags(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> PaginatedResponse[TagResponse]:
        items, total = self.repo.list_all(page, page_size)
        return PaginatedResponse(
            items=[TagResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_tag(self, data: TagCreate, user_id: int) -> TagResponse:
        existing = self.repo.get_by_name(data.name)
        if existing:
            logger.warning(f"Tag creation failed - Tag '{data.name}' already exists (ID: {existing.id})")
            raise BadRequestException("Tag with this name already exists")
        
        logger.info(f"Creating tag: {data.name} (by user {user_id})")
        tag = self.repo.create(data, user_id)
        logger.info(f"Tag created successfully - ID: {tag.id}, Name: {tag.name}")
        return TagResponse.model_validate(tag)
    
    def delete_tag(self, tag_id: int) -> None:
        tag = self.repo.get_by_id(tag_id)
        if not tag:
            logger.warning(f"Delete failed - Tag not found: ID {tag_id}")
            raise NotFoundException("Tag not found")
        logger.info(f"Deleting tag - ID: {tag_id}, Name: {tag.name}")
        self.repo.delete(tag)
        logger.info(f"Tag deleted successfully - ID: {tag_id}")
    
    def link_tag(self, data: TagLinkRequest, user_id: int) -> dict:
        tag = self.repo.get_by_id(data.tag_id)
        if not tag:
            logger.warning(f"Tag link failed - Tag not found: ID {data.tag_id}")
            raise NotFoundException("Tag not found")
        
        logger.info(f"Linking tag {data.tag_id} ('{tag.name}') to {data.entity_type}:{data.entity_id} (by user {user_id})")
        link = self.repo.link_to_entity(data.tag_id, data.entity_type, data.entity_id, user_id)
        logger.info(f"Tag linked successfully")
        return {"message": "Tag linked successfully"}
    
    def unlink_tag(self, data: TagUnlinkRequest) -> dict:
        logger.info(f"Unlinking tag {data.tag_id} from {data.entity_type}:{data.entity_id}")
        success = self.repo.unlink_from_entity(data.tag_id, data.entity_type, data.entity_id)
        if not success:
            logger.warning(f"Tag unlink failed - Link not found")
            raise NotFoundException("Tag link not found")
        logger.info(f"Tag unlinked successfully")
        return {"message": "Tag unlinked successfully"}
