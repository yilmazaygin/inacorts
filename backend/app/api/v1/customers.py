from datetime import datetime
from fastapi import APIRouter, Query
from typing import Optional
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.customer_service import CustomerService
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[CustomerResponse])
def list_customers(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = "id",
    order: str = "asc",
    search: Optional[str] = None,
    created_by: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    tag_id: Optional[int] = None,
):
    if end_date and end_date.hour == 0 and end_date.minute == 0 and end_date.second == 0:
        end_date = end_date.replace(hour=23, minute=59, second=59)
    service = CustomerService(db)
    return service.list_customers(page, page_size, sort, order, search, created_by, start_date, end_date, tag_id)


@router.post("", response_model=CustomerResponse)
def create_customer(
    data: CustomerCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = CustomerService(db)
    return service.create_customer(data, current_user.id)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = CustomerService(db)
    return service.get_customer(customer_id)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = CustomerService(db)
    return service.update_customer(customer_id, data, current_user.id)


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = CustomerService(db)
    service.delete_customer(customer_id)
    return {"message": "Customer deleted successfully"}
