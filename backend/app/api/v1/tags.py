from fastapi import APIRouter
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.tag_service import TagService
from app.schemas.tag import TagCreate, TagResponse, TagLinkRequest, TagUnlinkRequest
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[TagResponse])
def list_tags(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = 1,
    page_size: int = 20
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
