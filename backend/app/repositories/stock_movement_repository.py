from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from app.models import StockMovement, StockMovementType
from app.schemas.stock_movement import StockMovementCreate


class StockMovementRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, movement_id: int) -> Optional[StockMovement]:
        return (
            self.db.query(StockMovement)
            .options(joinedload(StockMovement.performed_by_user))
            .filter(StockMovement.id == movement_id)
            .first()
        )
    
    def list_by_product(
        self,
        product_id: int,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[StockMovement], int]:
        query = (
            self.db.query(StockMovement)
            .options(joinedload(StockMovement.performed_by_user))
            .filter(StockMovement.product_id == product_id)
        )
        total = query.count()
        
        query = query.order_by(StockMovement.created_at.desc())
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        product_id: Optional[int] = None
    ) -> Tuple[List[StockMovement], int]:
        query = self.db.query(StockMovement).options(joinedload(StockMovement.performed_by_user))
        
        if product_id:
            query = query.filter(StockMovement.product_id == product_id)
        
        total = query.count()
        
        query = query.order_by(StockMovement.created_at.desc())
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(
        self,
        product_id: int,
        quantity: int,
        movement_type: StockMovementType,
        user_id: int,
        related_order_id: Optional[int] = None,
        reason: Optional[str] = None
    ) -> StockMovement:
        movement = StockMovement(
            product_id=product_id,
            quantity=quantity,
            type=movement_type,
            related_order_id=related_order_id,
            reason=reason,
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(movement)
        self.db.commit()
        self.db.refresh(movement)
        
        # Load user relationship
        self.db.refresh(movement, attribute_names=['performed_by_user'])
        return movement
