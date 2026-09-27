from fastapi import APIRouter, File, UploadFile
from app.core.exceptions import BadRequestException
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.category_service import CategoryService
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[CategoryResponse])
def list_categories(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = 1,
    page_size: int = 20,
    sort: str = "id",
    order: str = "asc"
):
    service = CategoryService(db)
    return service.list_categories(page, page_size, sort, order)


@router.post("", response_model=CategoryResponse)
def create_category(
    data: CategoryCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = CategoryService(db)
    return service.create_category(data, current_user.id)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = CategoryService(db)
    return service.get_category(category_id)


@router.post("/{category_id}/image", response_model=CategoryResponse)
def upload_category_image(
    category_id: int,
    current_user: CurrentUser,
    db: DatabaseSession,
    file: UploadFile = File(...),
):
    data = file.file.read(5 * 1024 * 1024 + 1)
    if not data:
        raise BadRequestException("Empty file")
    return CategoryService(db).set_image(category_id, data)


@router.delete("/{category_id}/image", response_model=CategoryResponse)
def delete_category_image(category_id: int, current_user: CurrentUser, db: DatabaseSession):
    return CategoryService(db).clear_image(category_id)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = CategoryService(db)
    return service.update_category(category_id, data, current_user.id)


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = CategoryService(db)
    service.delete_category(category_id)
    return {"message": "Category deleted successfully"}
