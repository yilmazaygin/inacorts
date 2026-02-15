from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.stock_movement_repository import StockMovementRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.stock_movement import StockMovementCreate, StockMovementResponse
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException, BadRequestException
from app.models import StockMovementType
from math import ceil
from loguru import logger


class StockMovementService:
    def __init__(self, db: Session):
        self.db = db
        self.stock_repo = StockMovementRepository(db)
        self.product_repo = ProductRepository(db)
    
    def list_stock_movements(
        self,
        page: int = 1,
        page_size: int = 20,
        product_id: Optional[int] = None
    ) -> PaginatedResponse[StockMovementResponse]:
        items, total = self.stock_repo.list_all(page, page_size, product_id)
        
        responses = []
        for item in items:
            response = StockMovementResponse.model_validate(item)
            if item.performed_by_user:
                response.performed_by_username = item.performed_by_user.username
            responses.append(response)
        
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_stock_movement(self, data: StockMovementCreate, user_id: int) -> StockMovementResponse:
        """
        Create a manual stock movement.
        Supports: STOCK IN, STOCK OUT, and ADJUSTMENT types.
        """
        product = self.product_repo.get_by_id(data.product_id)
        if not product:
            raise NotFoundException("Product not found")
        
        # Validate stock movement
        if data.type == StockMovementType.IN:
            # Stock IN: Add to inventory
            if data.quantity <= 0:
                raise BadRequestException("Stock IN quantity must be positive")
            
            product.current_stock += data.quantity
            logger.info(f"Stock IN: Product {product.id} +{data.quantity} (new stock: {product.current_stock})")
        
        elif data.type == StockMovementType.OUT:
            # Stock OUT: Remove from inventory
            if data.quantity <= 0:
                raise BadRequestException("Stock OUT quantity must be positive")
            
            if product.current_stock < data.quantity:
                raise BadRequestException(
                    f"Insufficient stock. Current: {product.current_stock}, Requested: {data.quantity}"
                )
            
            product.current_stock -= data.quantity
            # Store as negative for OUT movements
            data.quantity = -data.quantity
            logger.info(f"Stock OUT: Product {product.id} {data.quantity} (new stock: {product.current_stock})")
        
        elif data.type == StockMovementType.ADJUSTMENT:
            # ADJUSTMENT: Can be positive or negative
            new_stock = product.current_stock + data.quantity
            if new_stock < 0:
                raise BadRequestException(
                    f"Stock cannot be negative. Current: {product.current_stock}, Adjustment: {data.quantity}"
                )
            
            product.current_stock = new_stock
            logger.info(f"Stock ADJUSTMENT: Product {product.id} {data.quantity:+d} (new stock: {product.current_stock})")
        
        # Save product stock change
        self.db.commit()
        
        # Create stock movement record
        movement = self.stock_repo.create(
            product_id=data.product_id,
            quantity=data.quantity,
            movement_type=data.type,
            user_id=user_id,
            reason=data.reason
        )
        
        response = StockMovementResponse.model_validate(movement)
        if movement.performed_by_user:
            response.performed_by_username = movement.performed_by_user.username
        
        return response
