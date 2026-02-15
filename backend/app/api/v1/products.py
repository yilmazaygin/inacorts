from fastapi import APIRouter
from typing import Optional
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_products(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = 1,
    page_size: int = 20,
    sort: str = "id",
    order: str = "asc",
    search: Optional[str] = None,
    category_id: Optional[int] = None
):
    service = ProductService(db)
    return service.list_products(page, page_size, sort, order, search, category_id)


@router.post("", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = ProductService(db)
    return service.create_product(data, current_user.id)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = ProductService(db)
    return service.get_product(product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = ProductService(db)
    return service.update_product(product_id, data, current_user.id)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = ProductService(db)
    service.delete_product(product_id)
    return {"message": "Product deleted successfully"}
