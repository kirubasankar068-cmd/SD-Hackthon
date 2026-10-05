# SALESTORM - 10 Architectural Decision Records (ADR)

## ADR-01: Storage Technology Selection (PostgreSQL vs MongoDB/NoSQL)
- **Status**: APPROVED
- **Context**: Need durable persistence for orders, payments, and financial audit logs with strong ACID properties and strict integrity constraints.
- **Decision**: Use **PostgreSQL (Relational)** as the primary source of truth for Orders and Payments, combined with **Redis** for volatile in-memory stock reservations.
- **Consequences**: Provides strict `CHECK` constraints and `UNIQUE` idempotency keys. Sacrifices arbitrary horizontal DB sharding simplicity in exchange for absolute ACID financial reliability.

---

## ADR-02: Synchronous vs Asynchronous Order Processing
- **Status**: APPROVED
- **Context**: Processing payment and order creation synchronously in a single HTTP request causes high latency and DB lock contention during flash sales.
- **Decision**: Adopt **Asynchronous Event-Driven Architecture via Kafka**. Payment authorization completes synchronously (fast token response), while order creation runs asynchronously upon consuming `PaymentSucceededEvent`.
- **Consequences**: Decouples fast frontend checkout from slow database disk persistence. Downstream order status is eventually consistent (1-3 second delay).

---

## ADR-03: Inventory Concurrency & Reservation Mechanism
- **Status**: APPROVED
- **Context**: 10,000 concurrent requests competing for 100 stock units. Relational DB locks (`SELECT FOR UPDATE` or version updates) cause severe lock contention and DB crashes.
- **Decision**: Use **Atomic Redis Lua Scripting** as the primary reservation engine.
- **Consequences**: Executes 80,000+ reservation operations per second in memory with zero DB locks. Requires periodic asynchronous synchronization to PostgreSQL.

---

## ADR-04: Edge Traffic Shedding & Virtual Waiting Room
- **Status**: APPROVED
- **Context**: Flash sale launch creates 500,000 req/s bursts that exceed origin server capacity.
- **Decision**: Deploy an **Edge Virtual Waiting Room** on Cloudflare Workers using a Token Bucket algorithm.
- **Consequences**: Protects origin infrastructure from crashing. Users spend 5-15 seconds in dynamic queue during peak spikes.

---

## 5. Explicit System Design Sacrifices

1. **Sacrifice 1: Immediate Downstream Consistency**
   - *Trade-off*: Users receive an immediate "Payment Confirmed" response, but the relational order record in PostgreSQL is created 1-3 seconds later via Kafka event processing.
   - *Mitigation*: Polling or WebSocket subscription updates the client UI once order status flips to `CONFIRMED`.

2. **Sacrifice 2: System Complexity & Infrastructure Footprint**
   - *Trade-off*: Managing Redis clusters, Kafka event brokers, PostgreSQL databases, and Reconciler cron workers increases operational overhead compared to a simple monolith.
   - *Mitigation*: Infrastructure-as-Code (Terraform & Kubernetes manifests) automates cluster provisioning and healing.

3. **Sacrifice 3: Waiting Room Queue Latency**
   - *Trade-off*: Customers above the origin rate limit experience a 5 to 15-second wait in the Virtual Waiting Room before reaching checkout.
   - *Mitigation*: Dynamic queue position reporting and visual progress UI keep users engaged during waiting periods.
