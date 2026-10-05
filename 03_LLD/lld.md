# SALESTORM - 03 Low-Level Design (LLD) & State Machines

## 1. Concurrency Model Evaluation & Selection Rationale

| Concurrency Approach | Mechanism | Max Throughput | DB Lock Risk | Selection Decision & Rationale |
|---|---|---|---|---|
| **Pessimistic Locking** | `SELECT ... FOR UPDATE` on DB row | ~200 req/sec | **EXTREME**. Deadlocks and thread pool exhaustion when 10k users hit DB simultaneously. | **REJECTED**: Severe lock contention crashes relational database under flash load. |
| **Optimistic Locking** | `UPDATE ... WHERE version = N` | ~1,500 req/sec | **HIGH RETRY COST**. 99% of requests fail version check and thraash CPU retrying. | **REJECTED**: High abort rate under 100-to-10,000 contention ratio. |
| **Atomic Redis Lua Decrement** | Single-threaded in-memory atomic Lua execution | **80,000+ req/sec** | **ZERO DB LOCKS**. In-memory atomic decrement completes in < 1 ms with zero lock contention. | **SELECTED**: Primary reservation engine guaranteeing zero overselling at microsecond speed. |

---

## 2. Inventory State Machine & Failure Transitions

```mermaid
stateDiagram-v2
  [*] --> AVAILABLE : Initial Stock = 100
  AVAILABLE --> RESERVED : Atomic Lua Decrement (TTL 5m)
  AVAILABLE --> SOLD_OUT : Stock = 0
  
  RESERVED --> PAYMENT_PENDING : User Initiates Checkout
  PAYMENT_PENDING --> CONFIRMED : Payment Gateway Success
  CONFIRMED --> SOLD : Order Persisted in DB

  RESERVED --> PAYMENT_FAILED : Card Declined / Provider Error
  PAYMENT_FAILED --> RELEASED : Stock Restored to Redis
  
  RESERVED --> TIMEOUT : 5 min TTL Expiry
  TIMEOUT --> RELEASED : Stock Restored to Redis
  
  RELEASED --> AVAILABLE : Re-entered into Stock Pool
```

---

## 3. Order Lifecycle State Machine & Outage Recovery

```mermaid
stateDiagram-v2
  [*] --> CREATED : PaymentSucceeded Event Received
  CREATED --> PAYMENT_PENDING : Validating Transaction Ref
  PAYMENT_PENDING --> CONFIRMED : Payment Verified
  CONFIRMED --> PROCESSING : Order Sent to Warehouse
  PROCESSING --> SHIPPED : Carrier Picked Up Package
  SHIPPED --> OUT_FOR_DELIVERY : Last-mile Delivery
  OUT_FOR_DELIVERY --> DELIVERED : Package Delivered

  PAYMENT_PENDING --> CANCELLED : Payment Verification Failed
  CREATED --> CANCELLED : Reconciler Refund Triggered
  CANCELLED --> [*]
```

---

## 4. Low-Level Class Diagram (Modules, Interfaces & Boundaries)

```mermaid
classDiagram
  class InventoryRepository {
    <<interface>>
    +reserveStockAtomic(productId, userId, idempotencyKey, ttl) ReservationResult
    +releaseStock(reservationId) void
    +getStockCount(productId) int
  }

  class RedisInventoryRepository {
    -redisClient RedisCluster
    +reserveStockAtomic(productId, userId, idempotencyKey, ttl) ReservationResult
    +releaseStock(reservationId) void
  }

  class PaymentGatewayStrategy {
    <<interface>>
    +executePayment(request: PaymentRequest) PaymentResponse
    +refundTransaction(transactionRef: string) RefundResult
  }

  class StripePaymentAdapter {
    -stripeClient StripeSDK
    +executePayment(request) PaymentResponse
  }

  class OrderService {
    -orderRepo OrderRepository
    -eventPublisher KafkaPublisher
    +createOrderFromPayment(event: PaymentSucceededEvent) Order
    +reconcileOrphanedOrder(paymentRef: string) Order
  }

  class CircuitBreakerAspect {
    -failureThreshold float
    -state CircuitState
    +invokeWithCircuitBreaker(targetCall) Response
  }

  InventoryRepository <|.. RedisInventoryRepository : Implements
  PaymentGatewayStrategy <|.. StripePaymentAdapter : Implements
  OrderService --> CircuitBreakerAspect : Protected by
```

---

## 5. Sequence Diagram 1: Purchase & Stock Reservation

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Gateway as API Gateway
  participant InvSvc as Inventory Service
  participant Redis as Redis Cluster

  User->>Gateway: POST /api/v1/reserve (Idempotency-Key: UUID)
  Gateway->>InvSvc: reserveStock(productId, userId, idempotencyKey)
  InvSvc->>Redis: EVAL sha_script.lua KEYS[1] ARGV[1,2]
  alt Idempotency Key Exists
    Redis-->>InvSvc: Cached Reservation Result
    InvSvc-->>User: 200 OK (Existing Reservation)
  else Stock > 0
    Redis-->>Redis: DECR stock & SETEX idempotency_key
    Redis-->>InvSvc: { status: "RESERVED", reservationId: "res_123" }
    InvSvc-->>User: 200 OK { status: "RESERVED", expiresAt: T+300s }
  else Stock == 0
    Redis-->>InvSvc: { status: "SOLD_OUT" }
    InvSvc-->>User: 200 OK { status: "SOLD_OUT" }
  end
```

---

## 6. Sequence Diagram 2: Payment Execution & Event Emission

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant PaySvc as Payment Service
  participant Circuit as Circuit Breaker
  participant PSP as Stripe / Adyen PSP
  participant Kafka as Kafka Bus

  User->>PaySvc: POST /api/v1/pay (reservationId, cardToken)
  PaySvc->>Circuit: executeWithCircuitBreaker()
  alt Circuit OPEN
    Circuit-->>User: 503 Service Unavailable (Payment Busy)
  else Circuit CLOSED
    Circuit->>PSP: POST /v1/charges
    alt PSP Success (95%)
      PSP-->>PaySvc: { txRef: "tx_999", status: "SUCCESS" }
      PaySvc->>Kafka: Publish PaymentSucceededEvent (txRef, reservationId)
      PaySvc-->>User: 200 OK { status: "PAYMENT_SUCCESS", txRef: "tx_999" }
    else PSP Failure (5%)
      PSP-->>PaySvc: { status: "CARD_DECLINED" }
      PaySvc->>Kafka: Publish PaymentFailedEvent (reservationId)
      PaySvc-->>User: 402 Payment Required
    end
  end
```

---

## 7. Sequence Diagram 3: Async Order Creation & Outage Recovery

```mermaid
sequenceDiagram
  autonumber
  participant Kafka as Kafka Event Bus
  participant OrderSvc as Order Service
  participant DB as PostgreSQL DB
  participant DLQ as Dead Letter Queue
  participant Reconciler as Background Reconciler

  Kafka->>OrderSvc: Consume PaymentSucceededEvent (txRef)
  alt Order Service Online
    OrderSvc->>DB: INSERT INTO consumed_events (event_id)
    alt First Time Processing
      OrderSvc->>DB: INSERT INTO orders & order_items
      OrderSvc-->>Kafka: Commit Offset
    else Duplicate Event
      DB-->>OrderSvc: UNIQUE Constraint Violation
      OrderSvc-->>Kafka: Skip & Commit Offset
    end
  else Order Service Down (30s Outage)
    Kafka--xOrderSvc: Connection Refused / Timeout
    Note over Kafka: Message retried with exponential backoff
    opt Retry Count Exceeded (Max 5)
      Kafka->>DLQ: Route to Dead Letter Queue
    end
    Note over Reconciler: Sweeper runs every 60 seconds
    Reconciler->>DLQ: Fetch unhandled PaymentSucceeded events
    Reconciler->>DB: Persist Order & Mark Reconciled
  end
```

---

## 8. Failure Scenario Resilience Matrix

| Failure Scenario | Root Cause | System Resilience Action | Recovery Outcome |
|---|---|---|---|
| **Payment Declined (5%)** | Card expired / Insufficient funds | `PaymentFailedEvent` emitted -> Redis stock incremented by 1. | Stock returned to pool; next waiting user purchases unit. |
| **Payment Timeout** | Gateway network drop | 5-minute reservation TTL expires -> Redis key expiry hook triggers release. | Stock returned to available pool. |
| **Duplicate Payment Submit** | Client double-click | `UNIQUE (transaction_ref)` & `idempotency_key` constraint check. | Second call returns cached payment response with zero double-charge. |
| **Order Service Outage (30s)** | Database failover / service restart | Kafka buffers events -> Retries with backoff -> DLQ -> Reconciler worker sweep. | 100% of paid reservations converge to confirmed orders in DB. |
