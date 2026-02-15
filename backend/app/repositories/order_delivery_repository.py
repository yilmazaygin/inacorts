from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models import OrderDelivery
from app.schemas.order_delivery import OrderDeliveryCreate


class OrderDeliveryRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, delivery_id: int) -> Optional[OrderDelivery]:
        return (
            self.db.query(OrderDelivery)
            .options(joinedload(OrderDelivery.delivered_by_user))
            .filter(OrderDelivery.id == delivery_id)
            .first()
        )
    
    def list_by_order(self, order_id: int) -> List[OrderDelivery]:
        return (
            self.db.query(OrderDelivery)
            .options(joinedload(OrderDelivery.delivered_by_user))
            .filter(OrderDelivery.order_id == order_id)
            .order_by(OrderDelivery.delivered_at.desc())
            .all()
        )
    
    def create(self, data: OrderDeliveryCreate, user_id: int) -> OrderDelivery:
        delivery = OrderDelivery(
            **data.model_dump(),
            delivered_by_user_id=user_id
        )
        self.db.add(delivery)
        self.db.commit()
        self.db.refresh(delivery)
        
        # Load relationships
        self.db.refresh(delivery, attribute_names=['delivered_by_user'])
        return delivery
    
    def delete(self, delivery: OrderDelivery) -> None:
        self.db.delete(delivery)
        self.db.commit()
