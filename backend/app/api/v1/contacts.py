from fastapi import APIRouter
from typing import Optional
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.contact_service import ContactService
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ContactResponse])
def list_contacts(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = 1,
    page_size: int = 20,
    sort: str = "id",
    order: str = "asc",
    search: Optional[str] = None
):
    service = ContactService(db)
    return service.list_contacts(page, page_size, sort, order, search)


@router.post("", response_model=ContactResponse)
def create_contact(
    data: ContactCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = ContactService(db)
    return service.create_contact(data, current_user.id)


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = ContactService(db)
    return service.get_contact(contact_id)


@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: int,
    data: ContactUpdate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = ContactService(db)
    return service.update_contact(contact_id, data, current_user.id)


@router.delete("/{contact_id}")
def delete_contact(
    contact_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = ContactService(db)
    service.delete_contact(contact_id)
    return {"message": "Contact deleted successfully"}
