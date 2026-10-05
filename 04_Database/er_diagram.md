# SALESTORM - 04 Database ER Schema Specification

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
  CATEGORY ||--o{ PRODUCT : contains
  PRODUCT ||--|| INVENTORY : tracks
  PRODUCT ||--o{ INVENTORY_RESERVATION : reserves
  PRODUCT ||--o{ CART_ITEM : holds
  
  CUSTOMER ||--o{ CART : owns
  CART ||--o{ CART_ITEM : includes
  
  CUSTOMER ||--o{ ORDERS : places
  ORDERS ||--|{ ORDER_ITEM : contains
  ORDERS ||--|| PAYMENT : executes
  ORDERS ||--o{ SHIPMENT : generates
  CUSTOMER ||--o{ NOTIFICATION : receives
  
  SALE ||--|{ PRODUCT : promotes

  CATEGORY {
    uuid id PK
    string name
    string slug UK
  }

  PRODUCT {
    uuid id PK
    uuid category_id FK
    string title
    decimal price
    string sku UK
  }

  INVENTORY {
    uuid id PK
    uuid product_id FK
    int available_quantity "CHECK >= 0"
    int reserved_quantity
    int version "Optimistic Locking"
    timestamp updated_at
  }

  INVENTORY_RESERVATION {
    uuid id PK
    string idempotency_key UK
    uuid customer_id FK
    uuid product_id FK
    string status "RESERVED | PAYMENT_PENDING | CONFIRMED | RELEASED"
    timestamp expires_at
    timestamp created_at
  }

  CART {
    uuid id PK
    uuid customer_id FK
    timestamp created_at
  }

  CART_ITEM {
    uuid id PK
    uuid cart_id FK
    uuid product_id FK
    int quantity
  }

  ORDERS {
    uuid id PK
    string order_number UK
    string idempotency_key UK
    uuid customer_id FK
    decimal total_amount
    string status "CREATED | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED"
    timestamp created_at
  }

  ORDER_ITEM {
    uuid id PK
    uuid order_id FK
    uuid product_id FK
    int quantity
    decimal unit_price
  }

  PAYMENT {
    uuid id PK
    string transaction_ref UK
    string idempotency_key UK
    uuid order_id FK
    uuid reservation_id FK
    decimal amount
    string provider "STRIPE | ADYEN | MOCK"
    string status "PENDING | SUCCESS | FAILED | REFUNDED"
    timestamp created_at
  }

  SALE {
    uuid id PK
    string title
    timestamp start_time
    timestamp end_time
  }

  SHIPMENT {
    uuid id PK
    uuid order_id FK
    string tracking_number UK
    string carrier
    string status "PENDING | DISPATCHED | IN_TRANSIT | DELIVERED"
    timestamp shipped_at
  }

  NOTIFICATION {
    uuid id PK
    uuid customer_id FK
    string channel "EMAIL | SMS | PUSH"
    string message
    timestamp sent_at
  }
```

---

## 2. Integrity Constraints & Indexing Strategy

| Table Name | Constraint / Index Name | Constraint Type | Purpose & Impact |
|---|---|---|---|
| `INVENTORY` | `chk_inventory_available_qty` | `CHECK (available_quantity >= 0)` | DB-level absolute barrier preventing negative inventory. |
| `INVENTORY` | `idx_inventory_product_ver` | `COMPOSITE INDEX (product_id, version)` | Microsecond lookups during background PostgreSQL stock synchronization. |
| `INVENTORY_RESERVATION` | `uk_reservation_idempotency` | `UNIQUE (idempotency_key)` | Blocks duplicate user clicks from creating multiple reservations. |
| `INVENTORY_RESERVATION` | `idx_reservation_expiry` | `INDEX (status, expires_at)` | Accelerates background sweeper finding expired reservations. |
| `ORDERS` | `uk_orders_idempotency` | `UNIQUE (idempotency_key)` | Prevents duplicate order creation during event retry storms. |
| `PAYMENT` | `uk_payment_tx_ref` | `UNIQUE (transaction_ref)` | Eliminates double-charging risks from webhooks. |
