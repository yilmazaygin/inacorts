from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.product_repository import ProductRepository
from app.repositories.stock_movement_repository import StockMovementRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.stock_movement import StockMovementCreate, StockMovementResponse
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException, BadRequestException
from app.models import StockMovementType
from math import ceil
from loguru import logger


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db)
        self.stock_repo = StockMovementRepository(db)
    
    def get_product(self, product_id: int) -> ProductResponse:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")
        response = ProductResponse.model_validate(product)
        if product.created_by_user:
            response.created_by_username = product.created_by_user.username
        return response
    
    def list_products(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "asc",
        search: Optional[str] = None,
        category_id: Optional[int] = None
    ) -> PaginatedResponse[ProductResponse]:
        items, total = self.product_repo.list_all(page, page_size, sort_by, order, search, category_id)
        responses = []
        for item in items:
            response = ProductResponse.model_validate(item)
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
    
    def create_product(self, data: ProductCreate, user_id: int) -> ProductResponse:
        product = self.product_repo.create(data, user_id)
        logger.info(f"Product {product.id} created by user {user_id}")
        response = ProductResponse.model_validate(product)
        if product.created_by_user:
            response.created_by_username = product.created_by_user.username
        return response
    
    def update_product(self, product_id: int, data: ProductUpdate, user_id: int) -> ProductResponse:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            logger.warning(f"Update failed - Product not found: ID {product_id}")
            raise NotFoundException("Product not found")
        
        logger.info(f"Updating product ID: {product_id} (by user ID: {user_id})")
        product = self.product_repo.update(product, data, user_id)
        logger.info(f"Product updated successfully - ID: {product.id}")
        response = ProductResponse.model_validate(product)
        if product.created_by_user:
            response.created_by_username = product.created_by_user.username
        return response
    
    def delete_product(self, product_id: int) -> None:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            logger.warning(f"Delete failed - Product not found: ID {product_id}")
            raise NotFoundException("Product not found")
        logger.info(f"Deleting product - ID: {product_id}, Name: {product.name}")
        self.product_repo.delete(product)
        logger.info(f"Product deleted successfully - ID: {product_id}")
    
    def adjust_stock(self, data: StockMovementCreate, user_id: int) -> StockMovementResponse:
        product = self.product_repo.get_by_id(data.product_id)
        if not product:
            logger.warning(f"Stock adjustment failed - Product not found: ID {data.product_id}")
            raise NotFoundException("Product not found")
        
        if data.type != StockMovementType.ADJUSTMENT:
            logger.warning(f"Stock adjustment failed - Invalid type: {data.type}")
            raise BadRequestException("Only ADJUSTMENT type is allowed for manual stock changes")
        
        old_stock = product.current_stock
        self.product_repo.update_stock(product, data.quantity)
        movement = self.stock_repo.create(
            product_id=data.product_id,
            quantity=data.quantity,
            movement_type=data.type,
            user_id=user_id
        )
        
        logger.info(f"Stock adjusted for product {data.product_id} ('{product.name}'): {old_stock} -> {product.current_stock} (change: {data.quantity:+d}) by user {user_id}")
        
        return StockMovementResponse.model_validate(movement)
