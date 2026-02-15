from typing import Optional
from sqlalchemy.orm import Session
from app.models import OrderItem


class OrderItemRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, item_id: int) -> Optional[OrderItem]:
        return self.db.query(OrderItem).filter(OrderItem.id == item_id).first()
    
    def update_delivered_quantity(self, item: OrderItem, quantity: int, user_id: int) -> OrderItem:
        item.delivered_quantity += quantity
        item.updated_by = user_id
        self.db.commit()
        self.db.refresh(item)
        return item
