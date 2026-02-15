from fastapi import APIRouter
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
    page: int = 1,
    page_size: int = 20,
    sort: str = "id",
    order: str = "asc",
    search: Optional[str] = None
):
    service = CustomerService(db)
    return service.list_customers(page, page_size, sort, order, search)


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
