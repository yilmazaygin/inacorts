from fastapi import APIRouter, File, UploadFile

from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.core.exceptions import BadRequestException
from app.services.site_service import SiteService
from app.schemas.site import SiteContent

router = APIRouter()


@router.get("", response_model=SiteContent)
def get_site_settings(current_user: CurrentUser, db: DatabaseSession):
    return SiteService(db).get_content()


@router.post("/favicon", response_model=SiteContent)
def upload_favicon(
    current_user: CurrentUser,
    db: DatabaseSession,
    file: UploadFile = File(...),
):
    data = file.file.read(1024 * 1024 + 1)
    if not data:
        raise BadRequestException("Empty file")
    return SiteService(db).set_favicon(data, current_user)


@router.delete("/favicon", response_model=SiteContent)
def delete_favicon(current_user: CurrentUser, db: DatabaseSession):
    return SiteService(db).clear_favicon(current_user)


@router.put("", response_model=SiteContent)
def update_site_settings(data: SiteContent, current_user: CurrentUser, db: DatabaseSession):
    return SiteService(db).update_content(data, current_user)
