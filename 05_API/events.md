# SALESTORM - 05 Kafka Domain Event Catalog

## 1. Asynchronous Domain Event Specifications

### Event 1: `PaymentSucceededEvent`
- **Topic**: `salestorm.payments.succeeded`
- **Owner**: Payment Service
- **Consumers**: Order Service, Email Notification Service, Analytics Warehouse
- **Idempotency Key**: `transaction_ref`
- **Partition Key**: `reservation_id` (Ensures ordered execution per reservation)

```json
{
  "eventId": "evt_99887766-4433-2211-1100-998877665544",
  "eventType": "PaymentSucceededEvent",
  "timestamp": "2026-10-05T10:00:00Z",
  "transactionRef": "tx_stripe_99228811",
  "idempotencyKey": "idemp_usr_102_sale_1",
  "reservationId": "res_a1b2c3d4",
  "customerId": "usr_102",
  "amount": 299.99,
  "currency": "USD"
}
```

#### Idempotent Consumer Handling (Order Service)
Before inserting the order into PostgreSQL, the Order Service executes:
```sql
INSERT INTO consumed_events (event_id, event_type) VALUES ('evt_99887766...', 'PaymentSucceededEvent');
```
If a duplicate event arrives (due to network retries), PostgreSQL throws a `PRIMARY KEY UNIQUE` violation, causing the consumer to log a duplicate warning and safely commit the Kafka offset without generating a second order.

---

### Event 2: `PaymentFailedEvent`
- **Topic**: `salestorm.payments.failed`
- **Owner**: Payment Service
- **Consumers**: Inventory Service
- **Partition Key**: `reservation_id`

```json
{
  "eventId": "evt_33221144-5566-7788-9900-112233445566",
  "eventType": "PaymentFailedEvent",
  "timestamp": "2026-10-05T10:00:02Z",
  "reservationId": "res_a1b2c3d4",
  "reason": "CARD_DECLINED_INSUFFICIENT_FUNDS"
}
```

#### Consumer Action (Inventory Service)
Upon receiving `PaymentFailedEvent`, the Inventory Service executes:
1. Marks reservation status = `PAYMENT_FAILED` -> `RELEASED` in DB.
2. Restores +1 available stock to the Redis cache atomically via `INCR stock:prod_100`.

---

### Event 3: `OrderConfirmedEvent`
- **Topic**: `salestorm.orders.confirmed`
- **Owner**: Order Service
- **Consumers**: Shipment Service, Notification Service
- **Partition Key**: `order_id`

```json
{
  "eventId": "evt_55443322-1100-9988-7766-554433221100",
  "eventType": "OrderConfirmedEvent",
  "timestamp": "2026-10-05T10:00:05Z",
  "orderId": "ord_88776655",
  "orderNumber": "ORD-20261005-001",
  "customerId": "usr_102",
  "totalAmount": 299.99
}
```
