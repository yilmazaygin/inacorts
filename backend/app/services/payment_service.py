from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.repositories.payment_repository import PaymentRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException, BadRequestException
from app.models import OrderStatus, PaymentMethod
from math import ceil
from loguru import logger
from app.services.spreadsheet import spreadsheet_response


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.payment_repo = PaymentRepository(db)
        self.order_repo = OrderRepository(db)
    
    def get_payment(self, payment_id: int) -> PaymentResponse:
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise NotFoundException("Payment not found")
        
        return self._to_response(payment)
    
    def _to_response(self, payment) -> PaymentResponse:
        response = PaymentResponse.model_validate(payment)
        if payment.received_by_user:
            response.received_by_username = payment.received_by_user.username
        if payment.order:
            response.order_total = payment.order.total_amount
        return response

    def list_payments(
        self,
        page: int = 1,
        page_size: int = 20,
        order_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> PaginatedResponse[PaymentResponse]:
        items, total = self.payment_repo.list_all(page, page_size, order_id, start_date, end_date)
        responses = [self._to_response(item) for item in items]
        
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_payment(self, data: PaymentCreate, user_id: int) -> PaymentResponse:
        order = self.order_repo.get_by_id(data.order_id)
        if not order:
            logger.warning(f"Payment creation failed - Order not found: ID {data.order_id}")
            raise NotFoundException("Order not found")
        
        if order.order_status == OrderStatus.CANCELED:
            logger.warning(f"Payment creation failed - Order {data.order_id} is canceled")
            raise BadRequestException("Cannot add payment to a canceled order")
        
        if data.amount <= 0:
            logger.warning(f"Payment creation failed - Invalid amount: {data.amount}")
            raise BadRequestException("Payment amount must be positive")
        
        logger.info(f"Creating payment for order {data.order_id}: Amount={data.amount}, Method={data.method} (by user {user_id})")
        payment = self.payment_repo.create(data, user_id)
        
        from app.services.order_service import OrderService
        order_service = OrderService(self.db)
        order_service.recalculate_order_statuses(order.id, user_id)
        
        logger.info(f"Payment created successfully - ID: {payment.id}, Amount: {payment.amount}, Order: {order.id}")
        
        return self._to_response(self.payment_repo.get_by_id(payment.id))
    
    def delete_payment(self, payment_id: int, user_id: int) -> None:
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            logger.warning(f"Delete failed - Payment not found: ID {payment_id}")
            raise NotFoundException("Payment not found")
        
        order_id = payment.order_id
        payment_amount = payment.amount
        
        logger.info(f"Deleting payment - ID: {payment_id}, Amount: {payment_amount}, Order: {order_id} (by user {user_id})")
        self.payment_repo.delete(payment)
        
        from app.services.order_service import OrderService
        order_service = OrderService(self.db)
        order_service.recalculate_order_statuses(order_id, user_id)
        
        logger.info(f"Payment deleted successfully - ID: {payment_id}")

    def export_payments(
        self,
        file_format: str,
        lang: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ):
        payments = self.payment_repo.list_for_export(None, start_date, end_date)
        turkish = lang != "en"
        headers = (
            ["No", "Tarih", "Sipariş no", "Tutar", "Yöntem", "Tahsil eden", "Sipariş toplamı"]
            if turkish else
            ["No", "Date", "Order", "Amount", "Method", "Received by", "Order total"]
        )
        methods = {
            PaymentMethod.CASH: "Nakit" if turkish else "Cash",
            PaymentMethod.BANK_TRANSFER: "Havale/EFT" if turkish else "Bank transfer",
            PaymentMethod.CREDIT_CARD: "Kredi kartı" if turkish else "Credit card",
            PaymentMethod.OTHER: "Diğer" if turkish else "Other",
        }
        rows = []
        for payment in payments:
            rows.append([
                payment.id,
                payment.created_at.strftime("%Y-%m-%d %H:%M") if payment.created_at else "",
                payment.order_id,
                payment.amount,
                methods.get(payment.method, payment.method.value),
                payment.received_by_user.username if payment.received_by_user else "",
                payment.order.total_amount if payment.order else "",
            ])
        filename = "tahsilatlar" if turkish else "payments"
        return spreadsheet_response(filename, headers, rows, file_format)
