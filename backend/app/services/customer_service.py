from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.customer_repository import CustomerRepository
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException
from math import ceil
from loguru import logger


class CustomerService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CustomerRepository(db)
    
    def get_customer(self, customer_id: int) -> CustomerResponse:
        customer = self.repo.get_by_id(customer_id)
        if not customer:
            raise NotFoundException("Customer not found")
        response = CustomerResponse.model_validate(customer)
        if customer.created_by_user:
            response.created_by_username = customer.created_by_user.username
        return response
    
    def list_customers(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "asc",
        search: Optional[str] = None
    ) -> PaginatedResponse[CustomerResponse]:
        items, total = self.repo.list_all(page, page_size, sort_by, order, search)
        responses = []
        for item in items:
            response = CustomerResponse.model_validate(item)
            if item.created_by_user:
                response.created_by_username = item.created_by_user.username
            responses.append(response)
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_customer(self, data: CustomerCreate, user_id: int) -> CustomerResponse:
        logger.info(f"Creating customer: {data.name} (by user ID: {user_id})")
        customer = self.repo.create(data, user_id)
        logger.info(f"Customer created successfully - ID: {customer.id}, Name: {customer.name}")
        response = CustomerResponse.model_validate(customer)
        if customer.created_by_user:
            response.created_by_username = customer.created_by_user.username
        return response
    
    def update_customer(self, customer_id: int, data: CustomerUpdate, user_id: int) -> CustomerResponse:
        customer = self.repo.get_by_id(customer_id)
        if not customer:
            logger.warning(f"Update failed - Customer not found: ID {customer_id}")
            raise NotFoundException("Customer not found")
        
        logger.info(f"Updating customer ID: {customer_id} (by user ID: {user_id})")
        customer = self.repo.update(customer, data, user_id)
        logger.info(f"Customer updated successfully - ID: {customer.id}")
        response = CustomerResponse.model_validate(customer)
        if customer.created_by_user:
            response.created_by_username = customer.created_by_user.username
        return response
    
    def delete_customer(self, customer_id: int) -> None:
        customer = self.repo.get_by_id(customer_id)
        if not customer:
            logger.warning(f"Delete failed - Customer not found: ID {customer_id}")
            raise NotFoundException("Customer not found")
        logger.info(f"Deleting customer - ID: {customer_id}, Name: {customer.name}")
        self.repo.delete(customer)
        logger.info(f"Customer deleted successfully - ID: {customer_id}")
