from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_
from datetime import datetime
from app.models import Order, OrderItem, OrderStatus, PaymentStatus, DeliveryStatus, TagEntityType
from app.schemas.order import OrderCreate, OrderUpdate, OrderItemCreate
from app.repositories.list_filters import restrict_records


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, order_id: int) -> Optional[Order]:
        return (
            self.db.query(Order)
            .options(
                selectinload(Order.created_by_user),
                selectinload(Order.customer),
                selectinload(Order.payments),
                selectinload(Order.items).selectinload(OrderItem.product),
            )
            .filter(Order.id == order_id)
            .first()
        )
    
    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "id",
        order: str = "desc",
        customer_id: Optional[int] = None,
        order_status: Optional[OrderStatus] = None,
        payment_status: Optional[PaymentStatus] = None,
        delivery_status: Optional[DeliveryStatus] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        created_by: Optional[int] = None,
        tag_id: Optional[int] = None,
    ) -> Tuple[List[Order], int]:
        query = self.db.query(Order)
        
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        
        if order_status:
            query = query.filter(Order.order_status == order_status)
        
        if payment_status:
            query = query.filter(Order.payment_status == payment_status)
        
        if delivery_status:
            query = query.filter(Order.delivery_status == delivery_status)
        
        if start_date:
            query = query.filter(Order.created_at >= start_date)
        
        if end_date:
            query = query.filter(Order.created_at <= end_date)
        query = restrict_records(
            query, Order, created_by=created_by, tag_id=tag_id, tag_type=TagEntityType.ORDER,
        )
        
        total = query.count()
        
        if hasattr(Order, sort_by):
            column = getattr(Order, sort_by)
            if order == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
        
        offset = (page - 1) * page_size
        items = (
            query.options(
                selectinload(Order.created_by_user),
                selectinload(Order.customer),
                selectinload(Order.items).selectinload(OrderItem.product),
            )
            .offset(offset)
            .limit(page_size)
            .all()
        )
        
        return items, total

    def list_for_export(
        self,
        customer_id: Optional[int] = None,
        order_status: Optional[OrderStatus] = None,
        payment_status: Optional[PaymentStatus] = None,
        delivery_status: Optional[DeliveryStatus] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        created_by: Optional[int] = None,
        tag_id: Optional[int] = None,
    ) -> List[Order]:
        query = self.db.query(Order).options(
            selectinload(Order.created_by_user),
            selectinload(Order.customer),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        if order_status:
            query = query.filter(Order.order_status == order_status)
        if payment_status:
            query = query.filter(Order.payment_status == payment_status)
        if delivery_status:
            query = query.filter(Order.delivery_status == delivery_status)
        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)
        query = restrict_records(
            query, Order, created_by=created_by, tag_id=tag_id, tag_type=TagEntityType.ORDER,
        )
        return query.order_by(Order.created_at.desc()).all()
    
    def create(self, data: OrderCreate, user_id: int) -> Order:
        total_amount = sum(item.quantity * item.unit_price for item in data.items)
        
        order = Order(
            customer_id=data.customer_id,
            total_amount=total_amount,
            payment_status=PaymentStatus.UNPAID,
            delivery_status=DeliveryStatus.NOT_DELIVERED,
            order_status=OrderStatus.OPEN,
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(order)
        self.db.flush()
        
        for item_data in data.items:
            item = OrderItem(
                order_id=order.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                delivered_quantity=0,
                created_by=user_id,
                updated_by=user_id
            )
            self.db.add(item)
        
        self.db.commit()
        self.db.refresh(order)
        return order
    
    def update(self, order: Order, data: OrderUpdate, user_id: int) -> Order:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(order, key, value)
        order.updated_by = user_id
        self.db.commit()
        self.db.refresh(order)
        return order
    
    def update_status(self, order: Order, user_id: int) -> Order:
        order.updated_by = user_id
        self.db.commit()
        self.db.refresh(order)
        return order
    
    def delete(self, order: Order) -> None:
        self.db.delete(order)
        self.db.commit()
