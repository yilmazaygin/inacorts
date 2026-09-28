from datetime import datetime
from fastapi import APIRouter, File, Query, UploadFile
from typing import Optional
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.product_service import ProductService
from app.schemas.product import BulkPriceUpdate, ProductCreate, ProductUpdate, ProductResponse
from app.schemas.common import PaginatedResponse
from app.core.config import settings
from app.core.exceptions import BadRequestException

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_products(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = "id",
    order: str = "asc",
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    created_by: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    tag_id: Optional[int] = None,
    show_on_site: Optional[bool] = None,
):
    service = ProductService(db)
    return service.list_products(
        page, page_size, sort, order, search, category_id,
        created_by, start_date, _end_of_day(end_date), tag_id, show_on_site,
    )


def _end_of_day(value: Optional[datetime]) -> Optional[datetime]:
    if value and value.hour == 0 and value.minute == 0 and value.second == 0 and value.microsecond == 0:
        return value.replace(hour=23, minute=59, second=59)
    return value


@router.post("/bulk-price")
def bulk_update_prices(
    data: BulkPriceUpdate,
    current_user: CurrentUser,
    db: DatabaseSession,
):
    service = ProductService(db)
    return service.bulk_update_prices(data, current_user.id)


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


@router.post("/{product_id}/image", response_model=ProductResponse)
def upload_product_image(
    product_id: int,
    current_user: CurrentUser,
    db: DatabaseSession,
    file: UploadFile = File(...),
):
    data = file.file.read(settings.MAX_PRODUCT_IMAGE_BYTES + 1)
    if not data:
        raise BadRequestException("Empty file")
    service = ProductService(db)
    return service.set_product_image(product_id, data, current_user.id)


@router.delete("/{product_id}/image", response_model=ProductResponse)
def delete_product_image(
    product_id: int,
    current_user: CurrentUser,
    db: DatabaseSession,
    filename: Optional[str] = None,
):
    service = ProductService(db)
    if filename:
        return service.remove_product_image(product_id, filename, current_user.id)
    return service.clear_product_image(product_id, current_user.id)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = ProductService(db)
    service.delete_product(product_id)
    return {"message": "Product deleted successfully"}
