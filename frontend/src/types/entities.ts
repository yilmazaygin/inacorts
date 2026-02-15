import {
  EntityType,
  TagEntityType,
  StockMovementType,
  PaymentStatus,
  DeliveryStatus,
  OrderStatus,
  PaymentMethod,
} from './enums';

// Base entity with audit fields
export interface BaseEntity {
  id: number;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by: number;
}

// User
export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  is_active: boolean;
}

// Customer
export interface Customer extends BaseEntity {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  created_by_username?: string;
  contacts?: ContactInfo[]; // Contacts associated with this customer
}

export interface CustomerCreate {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_ids?: number[];
}

export interface CustomerUpdate {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_ids?: number[];
}

// Contact
export interface Contact extends BaseEntity {
  name: string;
  phone: string;
  email?: string;
  website?: string;
  created_by_username?: string;
  customers?: CustomerInfo[]; // Customers associated with this contact
}

// Simple customer info (used in Contact.customers)
export interface CustomerInfo {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

// Simple contact info (used in Customer.contacts)
export interface ContactInfo {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

export interface ContactCreate {
  name: string;
  phone: string;
  email?: string;
  website?: string;
}

export interface ContactUpdate {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// Category
export interface Category extends BaseEntity {
  name: string;
  created_by_username?: string;
}

export interface CategoryCreate {
  name: string;
}

export interface CategoryUpdate {
  name?: string;
}

// Product
export interface Product extends BaseEntity {
  name: string;
  description?: string;
  barcode?: string;
  category_id: number;
  list_price: number;
  current_stock: number;
  created_by_username?: string;
}

export interface ProductCreate {
  name: string;
  description?: string;
  barcode?: string;
  category_id: number;
  list_price: number;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  barcode?: string;
  category_id?: number;
  list_price?: number;
}

// Stock Movement
export interface StockMovement extends BaseEntity {
  product_id: number;
  quantity: number;
  type: StockMovementType;
  reason?: string;
  related_order_id?: number;
  performed_by_username?: string; // WHO performed this stock movement
}

export interface StockMovementCreate {
  product_id: number;
  quantity: number;
  type: StockMovementType;
  reason?: string;
  related_order_id?: number;
}

// Order Item
export interface OrderItem extends BaseEntity {
  order_id: number;
  product_id: number;
  quantity: number;
  delivered_quantity: number;
  unit_price: number;
}

export interface OrderItemCreate {
  product_id: number;
  quantity: number;
  unit_price: number;
}

// Order
export interface Order extends BaseEntity {
  customer_id: number;
  total_amount: number;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  order_status: OrderStatus;
  created_by_username?: string; // WHO created this order
  items: OrderItem[];
}

export interface OrderCreate {
  customer_id: number;
  items: OrderItemCreate[];
}

export interface OrderUpdate {
  customer_id?: number;
}

export interface DeliverOrderItemRequest {
  quantity: number;
}

// Order Delivery
export interface OrderDelivery {
  id: number;
  order_id: number;
  received_by_username?: string; // WHO collected/received this payment
  delivered_at: string;
  delivered_by_user_id: number;
  delivered_by_username?: string; // WHO performed the delivery
  note?: string;
  created_at: string;
}

export interface OrderDeliveryCreate {
  order_id: number;
  note?: string;
  delivered_at?: string;
}

// Payment
export interface Payment extends BaseEntity {
  order_id: number;
  amount: number;
  method: PaymentMethod;
  received_by_username?: string; // WHO collected this payment
}

export interface PaymentCreate {
  order_id: number;
  amount: number;
  method: PaymentMethod;
}

// Note
export interface Note {
  id: number;
  entity_type: EntityType;
  entity_id: number;
  text: string;
  created_at: string;
  created_by: number;
  created_by_username?: string; // WHO created the note
}

export interface NoteCreate {
  entity_type: EntityType;
  entity_id: number;
  text: string;
}

// Tag
export interface Tag extends BaseEntity {
  name: string;
}

export interface TagCreate {
  name: string;
}

export interface TagLinkRequest {
  tag_id: number;
  entity_type: TagEntityType;
  entity_id: number;
}

export interface TagUnlinkRequest {
  tag_id: number;
  entity_type: TagEntityType;
  entity_id: number;
}

// Expense Category
export interface ExpenseCategory extends BaseEntity {
  name: string;
  description?: string;
  created_by_username?: string;
}

export interface ExpenseCategoryCreate {
  name: string;
  description?: string;
}

export interface ExpenseCategoryUpdate {
  name?: string;
  description?: string;
}

// Expense
export interface Expense extends BaseEntity {
  amount: number;
  description: string;
  category_id: number;
  date: string;
  created_by_username?: string; // WHO created this expense
  category_name?: string;
}

export interface ExpenseCreate {
  amount: number;
  description: string;
  category_id: number;
  date?: string;
}

export interface ExpenseUpdate {
  amount?: number;
  description?: string;
  category_id?: number;
  date?: string;
}

// Expense History (audit trail)
export interface ExpenseHistory {
  id: number;
  expense_id: number;
  changed_at: string;
  changed_by: number;
  changed_by_username: string;
  field_name: string;
  old_value: string;
  new_value: string;
}
