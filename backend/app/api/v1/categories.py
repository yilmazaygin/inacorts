from fastapi import APIRouter
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
