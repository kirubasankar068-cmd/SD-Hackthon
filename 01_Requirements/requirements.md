# SALESTORM - 01 Requirements & SLA Specification

## 1. Executive Problem Statement
Product X has **100 units** in stock. At T=0 seconds, **10,000 customers** click "Buy Now" simultaneously.
Normal traffic is 10,000 requests/sec, with spikes bursting up to 500,000 requests/sec.

### Baseline Benchmark Test Scenario
- **Initial Inventory**: 100 units
- **Concurrent Users**: 10,000 requests submitted in parallel
- **Payment Gateway**: 95% success rate, 5% failure rate
- **Duplicate Requests**: 2% duplicate client clicks / network retries
- **Service Outage**: Downstream Order Service unavailable for 30 seconds
- **Expected Convergence**: Exactly 100 units sold, 0 oversold, 0 duplicate orders, 100% downstream order convergence.

---

## 2. Functional Requirements

### 2.1 Core Flash-Sale Workflow
1. **Stock Reservation**: A customer requesting to buy a unit receives an immediate reservation if stock is available.
2. **Idempotency Safeguard**: Every reservation, payment, and order creation request must include a unique `Idempotency-Key` (UUIDv4) header. Duplicate submissions must return the existing state without mutating state.
3. **Payment Execution**: Customers with valid reservations are directed to process payment within a 5-minute Time-To-Live (TTL) window.
4. **Order Fulfillment**: Successful payments emit an asynchronous `PaymentSucceededEvent` to trigger order generation.
5. **Inventory Release**: Failed or expired payments automatically release reserved inventory back to available stock.

---

## 3. Strict Invariant Guarantees (Non-Negotiable)

| Invariant | Description | Enforcement Mechanism |
|---|---|---|
| **Zero Overselling** | `available_quantity >= 0` always. At most 100 units can ever reach `CONFIRMED` status. | Atomic Redis Lua script + DB `CHECK (available_quantity >= 0)` constraint. |
| **No Duplicate Operations** | A user click cannot result in multiple reservations, charges, or order records. | `UNIQUE (idempotency_key)` constraints on reservations, orders, and payments. |
| **Payment Timeout Safety** | If a payment fails or times out, reserved stock MUST be returned to the pool. | Redis TTL key expiration + background sweeper process. |
| **Traceable Order Convergence** | Every paid reservation MUST result in exactly one valid order record. | Transactional Outbox Pattern + Kafka retry backoff + Background Reconciler. |

---

## 4. Non-Functional SLA Targets

| Target Metric | Normal Traffic | Peak Flash-Sale Spike | SLA SLA Target & Boundary |
|---|---|---|---|
| **Throughput (TPS)** | 10,000 req/s | 500,000 req/s | Edge Virtual Waiting Room sheds 95%+ excess traffic. Core Lua script executes up to 80,000 ops/s per Redis node. |
| **p99 Latency** | < 150 ms | < 250 ms | Stock reservation completes in < 5 ms in memory; payment and order processing run asynchronously. |
| **System Availability** | 99.95% | 99.99% (Edge Gate) | Multi-region CDN and API Gateway redundancy shields origin core. |
| **Stock Accuracy** | 100% | 100% Strict | In-memory atomic cache backed by PostgreSQL transactional source of truth. |

---

## 5. Architectural Assumptions & Scoping
- **Product Scope**: Single high-demand item (Product X) flash-sale event.
- **Client Protocol**: RESTful API over HTTPS with JWT bearer tokens.
- **Clock Synchronization**: Network Time Protocol (NTP) synchronized nodes (< 5ms drift across cluster).
- **Payment Provider**: 3rd-party Payment Service Provider (PSP) accessible via REST webhooks.
