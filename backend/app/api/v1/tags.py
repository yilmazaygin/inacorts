from typing import List
from fastapi import APIRouter, Query
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.tag_service import TagService
from app.schemas.tag import TagCreate, TagResponse, TagLinkRequest, TagUnlinkRequest
from app.schemas.common import PaginatedResponse
from app.models import TagEntityType

router = APIRouter()


@router.get("", response_model=PaginatedResponse[TagResponse])
def list_tags(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = TagService(db)
    return service.list_tags(page, page_size)


@router.post("", response_model=TagResponse)
def create_tag(
    data: TagCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = TagService(db)
    return service.create_tag(data, current_user.id)


@router.get("/links", response_model=List[TagResponse])
def list_entity_tags(
    current_user: CurrentUser,
    db: DatabaseSession,
    entity_type: TagEntityType,
    entity_id: int,
):
    service = TagService(db)
    return service.list_for_entity(entity_type, entity_id)


@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = TagService(db)
    service.delete_tag(tag_id)
    return {"message": "Tag deleted successfully"}


@router.post("/link")
def link_tag(
    data: TagLinkRequest,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = TagService(db)
    return service.link_tag(data, current_user.id)


@router.post("/unlink")
def unlink_tag(
    data: TagUnlinkRequest,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = TagService(db)
    return service.unlink_tag(data)
