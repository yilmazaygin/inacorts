from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from app.models import Payment
from app.schemas.payment import PaymentCreate


class PaymentRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, payment_id: int) -> Optional[Payment]:
        return (
            self.db.query(Payment)
            .options(joinedload(Payment.received_by_user))
            .filter(Payment.id == payment_id)
            .first()
        )
    
    def list_by_order(self, order_id: int) -> List[Payment]:
        return (
            self.db.query(Payment)
            .options(joinedload(Payment.received_by_user), joinedload(Payment.order))
            .filter(Payment.order_id == order_id)
            .all()
        )
    
    def _filtered(
        self,
        order_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ):
        query = self.db.query(Payment).options(
            joinedload(Payment.received_by_user),
            joinedload(Payment.order),
        )
        if order_id:
            query = query.filter(Payment.order_id == order_id)
        if start_date:
            query = query.filter(Payment.created_at >= start_date)
        if end_date:
            query = query.filter(Payment.created_at <= end_date)
        return query

    def list_all(
        self,
        page: int = 1,
        page_size: int = 20,
        order_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Tuple[List[Payment], int]:
        query = self._filtered(order_id, start_date, end_date)
        total = query.count()
        
        query = query.order_by(Payment.created_at.desc())
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total

    def list_for_export(
        self,
        order_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Payment]:
        return self._filtered(order_id, start_date, end_date).order_by(Payment.created_at.desc()).all()
    
    def create(self, data: PaymentCreate, user_id: int) -> Payment:
        payment = Payment(
            **data.model_dump(),
            created_by=user_id,
            updated_by=user_id
        )
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment
    
    def delete(self, payment: Payment) -> None:
        self.db.delete(payment)
        self.db.commit()
