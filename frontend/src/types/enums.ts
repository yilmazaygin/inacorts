// Enums matching backend
export enum EntityType {
  CUSTOMER = 'customer',
  CONTACT = 'contact',
  PRODUCT = 'product',
  ORDER = 'order',
}

export enum TagEntityType {
  CUSTOMER = 'customer',
  CONTACT = 'contact',
  PRODUCT = 'product',
}

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export enum DeliveryStatus {
  NOT_DELIVERED = 'NOT_DELIVERED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  DELIVERED = 'DELIVERED',
}

export enum OrderStatus {
  OPEN = 'OPEN',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER',
}
