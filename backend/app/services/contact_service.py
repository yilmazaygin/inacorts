from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.contact_repository import ContactRepository
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse, CustomerInfo
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException
from math import ceil
from loguru import logger


class ContactService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ContactRepository(db)
    
    def _build_response(self, contact) -> ContactResponse:
        response = ContactResponse.model_validate(contact)
        if contact.created_by_user:
            response.created_by_username = contact.created_by_user.username
        if hasattr(contact, 'customers') and contact.customers:
            response.customers = [CustomerInfo.model_validate(c) for c in contact.customers]
        return response
    
    def get_contact(self, contact_id: int) -> ContactResponse:
        contact = self.repo.get_by_id(contact_id)
        if not contact:
            raise NotFoundException("Contact not found")
        return self._build_response(contact)
    
    def list_contacts(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "asc",
        search: Optional[str] = None
    ) -> PaginatedResponse[ContactResponse]:
        items, total = self.repo.list_all(page, page_size, sort_by, order, search)
        responses = []
        for item in items:
            responses.append(self._build_response(item))
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_contact(self, data: ContactCreate, user_id: int) -> ContactResponse:
        logger.info(f"Creating contact: {data.name} with {len(data.customer_ids)} customers (by user {user_id})")
        contact = self.repo.create(data, user_id)
        logger.info(f"Contact created successfully - ID: {contact.id}, Name: {contact.name}")
        return self._build_response(contact)
    
    def update_contact(self, contact_id: int, data: ContactUpdate, user_id: int) -> ContactResponse:
        contact = self.repo.get_by_id(contact_id)
        if not contact:
            raise NotFoundException("Contact not found")
        
        contact = self.repo.update(contact, data, user_id)
        return self._build_response(contact)
    
    def delete_contact(self, contact_id: int) -> None:
        contact = self.repo.get_by_id(contact_id)
        if not contact:
            logger.warning(f"Delete failed - Contact not found: ID {contact_id}")
            raise NotFoundException("Contact not found")
        logger.info(f"Deleting contact - ID: {contact_id}, Name: {contact.name}")
        self.repo.delete(contact)
        logger.info(f"Contact deleted successfully - ID: {contact_id}")
