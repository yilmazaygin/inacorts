from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Enum as SQLEnum, Table
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


customer_contact_association = Table(
    'customer_contact',
    Base.metadata,
    Column('customer_id', Integer, ForeignKey('customers.id', ondelete='CASCADE'), primary_key=True),
    Column('contact_id', Integer, ForeignKey('contacts.id', ondelete='CASCADE'), primary_key=True)
)


class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    contacts = relationship("Contact", secondary=customer_contact_association, back_populates="customers")
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    created_by_user = relationship("User", foreign_keys=[created_by])


class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    customers = relationship("Customer", secondary=customer_contact_association, back_populates="contacts")
    created_by_user = relationship("User", foreign_keys=[created_by])


class EntityType(str, enum.Enum):
    CUSTOMER = "customer"
    CONTACT = "contact"
    PRODUCT = "product"
    ORDER = "order"


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(SQLEnum(EntityType), nullable=False)
    entity_id = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    created_by_user = relationship("User", foreign_keys=[created_by])


class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)


class TagEntityType(str, enum.Enum):
    CUSTOMER = "customer"
    CONTACT = "contact"
    PRODUCT = "product"


class TagLink(Base):
    __tablename__ = "tag_links"
    
    id = Column(Integer, primary_key=True, index=True)
    tag_id = Column(Integer, ForeignKey('tags.id', ondelete='CASCADE'), nullable=False)
    entity_type = Column(SQLEnum(TagEntityType), nullable=False)
    entity_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    tag = relationship("Tag")


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    products = relationship("Product", back_populates="category")
    created_by_user = relationship("User", foreign_keys=[created_by])


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    barcode = Column(String(100), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    list_price = Column(Float, default=0.0, nullable=False)
    current_stock = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    category = relationship("Category", back_populates="products")
    stock_movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")
    created_by_user = relationship("User", foreign_keys=[created_by])


class StockMovementType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"


class StockMovement(Base):
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    type = Column(SQLEnum(StockMovementType), nullable=False)
    reason = Column(Text, nullable=True)  # Why this movement happened (for audit trail)
    related_order_id = Column(Integer, ForeignKey('orders.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    product = relationship("Product", back_populates="stock_movements")
    performed_by_user = relationship("User", foreign_keys=[created_by])


class PaymentStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"


class DeliveryStatus(str, enum.Enum):
    NOT_DELIVERED = "NOT_DELIVERED"
    PARTIALLY_DELIVERED = "PARTIALLY_DELIVERED"
    DELIVERED = "DELIVERED"


class OrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"
    CANCELED = "CANCELED"


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.UNPAID, nullable=False)
    delivery_status = Column(SQLEnum(DeliveryStatus), default=DeliveryStatus.NOT_DELIVERED, nullable=False)
    order_status = Column(SQLEnum(OrderStatus), default=OrderStatus.OPEN, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    deliveries = relationship("OrderDelivery", back_populates="order", cascade="all, delete-orphan")
    created_by_user = relationship("User", foreign_keys=[created_by])


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    delivered_quantity = Column(Integer, default=0, nullable=False)
    unit_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class OrderDelivery(Base):
    """
    Tracks delivery events for orders. Multiple deliveries per order are supported.
    Each delivery records who performed it and when.
    """
    __tablename__ = "order_deliveries"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    delivered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    delivered_by_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    order = relationship("Order", back_populates="deliveries")
    delivered_by_user = relationship("User", foreign_keys=[delivered_by_user_id])


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    CREDIT_CARD = "CREDIT_CARD"
    OTHER = "OTHER"


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(SQLEnum(PaymentMethod), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)  # This is "received_by" semantically
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    order = relationship("Order", back_populates="payments")
    received_by_user = relationship("User", foreign_keys=[created_by])


class ExpenseCategory(Base):
    """
    Categories for expense tracking (masraf kategorileri).
    Examples: Fuel, Product Purchase, Gifts/Samples, Logistics, etc.
    """
    __tablename__ = "expense_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    expenses = relationship("Expense", back_populates="category")


class Expense(Base):
    """
    Expense tracking system (Masraf sistemi).
    Records all business expenses with full audit trail.
    Expenses are NOT payments - they are separate business costs.
    """
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey('expense_categories.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    category = relationship("ExpenseCategory", back_populates="expenses")
    created_by_user = relationship("User", foreign_keys=[created_by])
    history = relationship("ExpenseHistory", back_populates="expense", cascade="all, delete-orphan", order_by="ExpenseHistory.changed_at.desc()")


class ExpenseHistory(Base):
    """
    Tracks changes to expenses for audit trail.
    Records who changed what and when.
    """
    __tablename__ = "expense_history"
    
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey('expenses.id', ondelete='CASCADE'), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    changed_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    
    expense = relationship("Expense", back_populates="history")
    changed_by_user = relationship("User", foreign_keys=[changed_by])
