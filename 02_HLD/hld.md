# SALESTORM - 02 High-Level Architecture (HLD)

## 1. Complete End-to-End Request Path
When 10,000 to 500,000 customers hit "Buy Now" simultaneously, requests traverse a layered architecture designed to protect origin databases while executing sub-millisecond stock reservations.

```
Customer App / Web
       │
       ▼ [1. HTTPS POST /reserve]
  CDN / WAF / Cloudflare Edge ────► [Throttling Point 1: Edge Virtual Waiting Room]
       │
       ▼ [2. Passed Token Traffic]
  Application Load Balancer (ALB)
       │
       ▼ [3. Route & Rate Limit]
  API Gateway (Kong / Envoy) ─────► [Throttling Point 2: Token Bucket & Bot Filter]
       │
       ▼ [4. gRPC / REST]
  Inventory & Sale Service ───────► [EXACT CONCENTION POINT: Atomic Redis Lua Script]
       │                                  │
       ▼ [5. Authorize Payment]           ▼ (Postgres Async Sync)
  Payment Service ───────────────► Primary PostgreSQL DB (Source of Truth)
       │
       ▼ [6. Emit PaymentSucceeded]
  Kafka Event Bus ────────────────► [Queueing Point: Distributed Message Buffer]
       │
       ▼ [7. Consume Event]
  Order Service ──────────────────► [Persist Order & Line Items]
       │
       ├──► Shipment Service
       └──► Notification Service

 [Background Reconciler Worker] ──► Audit Kafka DLQ & Unfulfilled Paid Reservations
```

---

## 2. System Context Diagram (C4 Level 1)

```mermaid
graph TD
  Customer([Customer App / Web Browser]) -->|1. Submit Order Request| CDN[CDN / WAF / Cloudflare Edge]
  CDN -->|2. Filtered Traffic| ALB[Application Load Balancer]
  ALB -->|3. Route / Auth| Gateway[API Gateway]

  subgraph Edge Traffic Control
    Gateway -->|4. Check Token Queue| WaitingRoom[Virtual Waiting Room Service]
  end

  subgraph Core Microservices Tier
    WaitingRoom -->|5. Reserve Stock| InvSvc[Inventory & Sale Service]
    InvSvc -->|6. Atomic Lua Decrement| Redis[(Redis Cluster)]
    InvSvc -->|7. Execute Charge| PaySvc[Payment Service]
  end

  subgraph Async Event Persistence
    PaySvc -->|8. Publish PaymentSucceeded| Kafka{{Kafka Event Broker}}
    Kafka -->|9. Consume Event| OrderSvc[Order Service]
    OrderSvc -->|10. Persist ACID Order| Postgres[(PostgreSQL Primary DB)]
  end

  subgraph Resilience & Recovery
    Kafka -->|11. Event Retry / DLQ| DLQ{{Dead Letter Queue}}
    DLQ -->|12. Audit & Recover| Reconciler[Background Reconciler]
    Reconciler -->|Fix Missing Orders| Postgres
  end

  classDef throttle fill:#f59e0b,stroke:#b45309,color:#fff;
  classDef queue fill:#8b5cf6,stroke:#6d28d9,color:#fff;
  classDef core fill:#2563eb,stroke:#1d4ed8,color:#fff;
  class WaitingRoom,CDN throttle;
  class Kafka,DLQ queue;
  class InvSvc,PaySvc,OrderSvc core;
```

---

## 3. Container Diagram (C4 Level 2)

```mermaid
graph LR
  subgraph Client Container
    WebUI[React 18 SPA]
  end

  subgraph Edge Container
    CDN[Cloudflare Workers / WAF]
  end

  subgraph Backend Container Cluster
    Gateway[Kong API Gateway]
    InvSvc[Inventory Microservice]
    PaySvc[Payment Microservice]
    OrdSvc[Order Microservice]
    RecWorker[Reconciler Cron Worker]
  end

  subgraph Data Stores
    Redis[(Redis Sharded Cluster)]
    Postgres[(PostgreSQL Primary DB)]
    Kafka{{Kafka Bus}}
  end

  WebUI -->|Sync HTTPS| CDN
  CDN -->|Sync HTTPS| Gateway
  Gateway -->|Sync gRPC| InvSvc
  InvSvc -->|Sync RESP| Redis
  InvSvc -->|Sync REST| PaySvc
  PaySvc -->|Async Event| Kafka
  Kafka -->|Async Consumer| OrdSvc
  OrdSvc -->|Sync SQL| Postgres
  RecWorker -->|Sync SQL Read/Write| Postgres
  RecWorker -->|Sync REST| PaySvc
```

---

## 4. Component Diagram (C4 Level 3 - Inventory & Sale Service)

```mermaid
graph TD
  subgraph Inventory Service Container
    Controller[Reservation Controller]
    IdempFilter[Idempotency Filter]
    LuaExecutor[Redis Lua Script Engine]
    ExpiryManager[Reservation Expiry Manager]
    DBWriter[Async DB Synchronization Engine]
  end

  Controller --> IdempFilter
  IdempFilter --> LuaExecutor
  LuaExecutor --> ExpiryManager
  LuaExecutor --> DBWriter
```

---

## 5. Deployment Topology Diagram

```mermaid
graph TD
  subgraph Global CDN Edge
    Cloudflare[Cloudflare WAF / Waiting Room]
  end

  subgraph AWS us-east-1 Region
    subgraph Availability Zone A
      ALB_A[ALB Node A]
      InvPod_A[Inventory Pod 1-5]
      OrdPod_A[Order Pod 1-5]
      Redis_Master[(Redis Primary)]
    end

    subgraph Availability Zone B
      ALB_B[ALB Node B]
      InvPod_B[Inventory Pod 6-10]
      OrdPod_B[Order Pod 6-10]
      Redis_Replica[(Redis Replica)]
      Postgres_Primary[(PostgreSQL Primary DB)]
    end
  end

  Cloudflare --> ALB_A
  Cloudflare --> ALB_B
  ALB_A --> InvPod_A
  ALB_B --> InvPod_B
  InvPod_A --> Redis_Master
  InvPod_B --> Redis_Master
  OrdPod_A --> Postgres_Primary
  OrdPod_B --> Postgres_Primary
```

---

## 6. Traffic Control & Contention Management

### Traffic Throttling, Queueing, and Rejection Points

1. **Edge Virtual Waiting Room (Throttling Point 1)**:
   - **Mechanism**: Token Bucket algorithm running on Cloudflare Workers at the CDN edge.
   - **Behavior at 500,000 req/s**: Admits max 2,000 requests/sec to origin servers; excess 498,000 users wait in browser queue with polling heartbeat.
   - **Rejection**: HTTP 429 Too Many Requests with `Retry-After: 5`.

2. **API Gateway Rate Limiter (Throttling Point 2)**:
   - **Mechanism**: IP-based sliding window rate limiter and JWT authentication signature filter.
   - **Rejection**: HTTP 401 Unauthorized or HTTP 429 for burst bots.

3. **In-Memory Contention Control (Exact Contention Point)**:
   - **Mechanism**: Single-threaded atomic Redis Lua script (`DECR` with boundary check).
   - **Behavior**: Executes 100 stock decrements in ~10 ms; all subsequent 9,900 requests immediately receive `SOLD_OUT` response in < 3 ms.
   - **Source of Truth**: PostgreSQL database updated asynchronously via versioned background writes (`UPDATE inventory SET available_quantity = X WHERE version = Y`).

4. **Kafka Message Broker (Queueing Point)**:
   - **Mechanism**: Multi-partition event queue buffering `PaymentSucceededEvent` messages during downstream Order Service outages.
   - **Durability**: Messages persisted to disk with 7-day retention.
