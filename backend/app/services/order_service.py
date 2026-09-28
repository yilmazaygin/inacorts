from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.order_repository import OrderRepository
from app.repositories.order_item_repository import OrderItemRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.stock_movement_repository import StockMovementRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.order_delivery_repository import OrderDeliveryRepository
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse, DeliverOrderItemRequest
from app.schemas.order_delivery import OrderDeliveryCreate, OrderDeliveryResponse
from app.schemas.common import PaginatedResponse
from app.core.exceptions import NotFoundException, BadRequestException
from app.models import OrderStatus, PaymentStatus, DeliveryStatus, StockMovementType
from datetime import datetime
from math import ceil
from app.services.spreadsheet import spreadsheet_response
from loguru import logger


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.order_item_repo = OrderItemRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.stock_repo = StockMovementRepository(db)
        self.product_repo = ProductRepository(db)
        self.delivery_repo = OrderDeliveryRepository(db)
    
    def _to_response(self, order, include_paid: bool = False) -> OrderResponse:
        response = OrderResponse.model_validate(order)
        if order.created_by_user:
            response.created_by_username = order.created_by_user.username
        if order.customer:
            response.customer_name = order.customer.name
        names = {item.id: item.product.name for item in order.items if item.product}
        for item in response.items:
            item.product_name = names.get(item.id)
        if include_paid:
            response.amount_paid = sum(payment.amount for payment in order.payments)
        return response

    def get_order(self, order_id: int) -> OrderResponse:
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")
        return self._to_response(order, include_paid=True)
    
    def list_orders(
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
    ) -> PaginatedResponse[OrderResponse]:
        items, total = self.order_repo.list_all(
            page, page_size, sort_by, order,
            customer_id, order_status, payment_status, delivery_status,
            start_date, end_date, created_by, tag_id,
        )
        
        responses = [self._to_response(item) for item in items]
        
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )

    def export_orders(
        self,
        file_format: str,
        lang: str,
        customer_id: Optional[int] = None,
        order_status: Optional[OrderStatus] = None,
        payment_status: Optional[PaymentStatus] = None,
        delivery_status: Optional[DeliveryStatus] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        created_by: Optional[int] = None,
        tag_id: Optional[int] = None,
    ):
        orders = self.order_repo.list_for_export(
            customer_id, order_status, payment_status, delivery_status, start_date, end_date,
            created_by, tag_id,
        )
        turkish = lang != "en"
        headers = (
            ["Sipariş no", "Tarih", "Müşteri", "Durum", "Ödeme", "Teslimat", "Ürün", "Miktar", "Birim fiyat", "Satır tutarı", "Sipariş toplamı", "Oluşturan"]
            if turkish else
            ["Order", "Date", "Customer", "Status", "Payment", "Delivery", "Product", "Quantity", "Unit price", "Line total", "Order total", "Created by"]
        )
        status_labels = {
            OrderStatus.OPEN: "Açık" if turkish else "Open",
            OrderStatus.COMPLETED: "Tamamlandı" if turkish else "Completed",
            OrderStatus.CANCELED: "İptal" if turkish else "Canceled",
            PaymentStatus.UNPAID: "Ödenmedi" if turkish else "Unpaid",
            PaymentStatus.PARTIALLY_PAID: "Kısmi" if turkish else "Partial",
            PaymentStatus.PAID: "Ödendi" if turkish else "Paid",
            DeliveryStatus.NOT_DELIVERED: "Teslim edilmedi" if turkish else "Not delivered",
            DeliveryStatus.PARTIALLY_DELIVERED: "Kısmi teslim" if turkish else "Partial",
            DeliveryStatus.DELIVERED: "Teslim edildi" if turkish else "Delivered",
        }
        rows = []
        for order in orders:
            created = order.created_at.strftime("%Y-%m-%d %H:%M") if order.created_at else ""
            customer = order.customer.name if order.customer else ""
            author = order.created_by_user.username if order.created_by_user else ""
            base = [
                order.id,
                created,
                customer,
                status_labels.get(order.order_status, order.order_status.value),
                status_labels.get(order.payment_status, order.payment_status.value),
                status_labels.get(order.delivery_status, order.delivery_status.value),
            ]
            if not order.items:
                rows.append([*base, "", "", "", "", order.total_amount, author])
                continue
            for item in order.items:
                rows.append([
                    *base,
                    item.product.name if item.product else item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.quantity * item.unit_price,
                    order.total_amount,
                    author,
                ])
        filename = "siparisler" if turkish else "orders"
        return spreadsheet_response(filename, headers, rows, file_format)
    
    def create_order(self, data: OrderCreate, user_id: int) -> OrderResponse:
        order = self.order_repo.create(data, user_id)
        logger.info(f"Order {order.id} created by user {user_id}")
        return self._to_response(self.order_repo.get_by_id(order.id))
    
    def update_order(self, order_id: int, data: OrderUpdate, user_id: int) -> OrderResponse:
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")
        
        if order.order_status == OrderStatus.CANCELED:
            raise BadRequestException("Cannot update a canceled order")
        
        order = self.order_repo.update(order, data, user_id)
        return self._to_response(self.order_repo.get_by_id(order.id))
    
    def cancel_order(self, order_id: int, user_id: int) -> OrderResponse:
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")
        
        if order.order_status == OrderStatus.CANCELED:
            raise BadRequestException("Order is already canceled")
        
        for item in order.items:
            if item.delivered_quantity > 0:
                self.product_repo.update_stock(
                    self.product_repo.get_by_id(item.product_id),
                    item.delivered_quantity
                )
                self.stock_repo.create(
                    product_id=item.product_id,
                    quantity=item.delivered_quantity,
                    movement_type=StockMovementType.IN,
                    user_id=user_id,
                    related_order_id=order.id,
                    reason=f"Canceled Order #{order.id} — stock returned"
                )
        
        order.order_status = OrderStatus.CANCELED
        order = self.order_repo.update_status(order, user_id)
        logger.info(f"Order {order.id} canceled by user {user_id}")
        
        return self._to_response(self.order_repo.get_by_id(order.id), include_paid=True)
    
    def delete_order(self, order_id: int, user_id: int) -> None:
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")
        
        for item in order.items:
            if item.delivered_quantity > 0:
                self.product_repo.update_stock(
                    self.product_repo.get_by_id(item.product_id),
                    item.delivered_quantity
                )
        
        self.order_repo.delete(order)
        logger.info(f"Order {order_id} deleted by user {user_id}")
    
    def deliver_order_item(self, item_id: int, data: DeliverOrderItemRequest, user_id: int) -> OrderResponse:
        item = self.order_item_repo.get_by_id(item_id)
        if not item:
            raise NotFoundException("Order item not found")
        
        if item.order.order_status == OrderStatus.CANCELED:
            raise BadRequestException("Cannot deliver items from a canceled order")
        
        if item.delivered_quantity + data.quantity > item.quantity:
            raise BadRequestException("Delivery quantity exceeds ordered quantity")
        
        if data.quantity <= 0:
            raise BadRequestException("Delivery quantity must be positive")
        
        item = self.order_item_repo.update_delivered_quantity(item, data.quantity, user_id)
        
        product = self.product_repo.get_by_id(item.product_id)
        self.product_repo.update_stock(product, -data.quantity)
        
        self.stock_repo.create(
            product_id=item.product_id,
            quantity=-data.quantity,
            movement_type=StockMovementType.OUT,
            user_id=user_id,
            related_order_id=item.order_id,
            reason=f"Delivered for Order #{item.order_id}"
        )
        
        # Record delivery history entry
        delivery_data = OrderDeliveryCreate(
            order_id=item.order_id,
            note=f"Delivered {data.quantity}x {product.name if product else 'item'}"
        )
        self.delivery_repo.create(delivery_data, user_id)
        
        self._update_order_delivery_status(item.order, user_id)
        self._update_order_completion_status(item.order, user_id)
        
        logger.info(f"Order item {item_id} delivered {data.quantity} units by user {user_id}")
        
        return self._to_response(self.order_repo.get_by_id(item.order_id), include_paid=True)
    
    def _update_order_delivery_status(self, order, user_id: int):
        total_quantity = sum(item.quantity for item in order.items)
        total_delivered = sum(item.delivered_quantity for item in order.items)
        
        if total_delivered == 0:
            order.delivery_status = DeliveryStatus.NOT_DELIVERED
        elif total_delivered < total_quantity:
            order.delivery_status = DeliveryStatus.PARTIALLY_DELIVERED
        else:
            order.delivery_status = DeliveryStatus.DELIVERED
        
        self.order_repo.update_status(order, user_id)
    
    def _update_order_payment_status(self, order, user_id: int):
        payments = self.payment_repo.list_by_order(order.id)
        total_paid = sum(payment.amount for payment in payments)
        
        if total_paid == 0:
            order.payment_status = PaymentStatus.UNPAID
        elif total_paid < order.total_amount:
            order.payment_status = PaymentStatus.PARTIALLY_PAID
        else:
            order.payment_status = PaymentStatus.PAID
        
        self.order_repo.update_status(order, user_id)
    
    def _update_order_completion_status(self, order, user_id: int):
        if (order.payment_status == PaymentStatus.PAID and 
            order.delivery_status == DeliveryStatus.DELIVERED):
            order.order_status = OrderStatus.COMPLETED
            self.order_repo.update_status(order, user_id)
            logger.info(f"Order {order.id} marked as completed")
    
    def recalculate_order_statuses(self, order_id: int, user_id: int):
        order = self.order_repo.get_by_id(order_id)
        if order:
            self._update_order_delivery_status(order, user_id)
            self._update_order_payment_status(order, user_id)
            self._update_order_completion_status(order, user_id)
    
    # Order Delivery Management
    def list_order_deliveries(self, order_id: int) -> List[OrderDeliveryResponse]:
        """
        Get delivery history for an order.
        Shows WHO delivered and WHEN.
        """
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")
        
        deliveries = self.delivery_repo.list_by_order(order_id)
        
        responses = []
        for delivery in deliveries:
            response = OrderDeliveryResponse.model_validate(delivery)
            if delivery.delivered_by_user:
                response.delivered_by_username = delivery.delivered_by_user.username
            responses.append(response)
        
        return responses
    
    def create_order_delivery(self, data: OrderDeliveryCreate, user_id: int) -> OrderDeliveryResponse:
        """
        Record a delivery event for an order.
        Automatically tracks WHO performed the delivery.
        """
        order = self.order_repo.get_by_id(data.order_id)
        if not order:
            raise NotFoundException("Order not found")
        
        if order.order_status == OrderStatus.CANCELED:
            raise BadRequestException("Cannot deliver a canceled order")
        
        delivery = self.delivery_repo.create(data, user_id)
        logger.info(f"Delivery recorded for order {data.order_id} by user {user_id}")
        
        response = OrderDeliveryResponse.model_validate(delivery)
        if delivery.delivered_by_user:
            response.delivered_by_username = delivery.delivered_by_user.username
        
        return response
