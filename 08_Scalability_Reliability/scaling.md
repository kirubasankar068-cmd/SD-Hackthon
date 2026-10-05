# SALESTORM - 08 Scalability & Reliability Architecture

## 1. 50x Traffic Burst Scaling Plan (500,000 req/sec)

| Architecture Layer | Baseline (10,000 req/s) | 50x Burst (500,000 req/s) | Scaling & Bottleneck Elimination Strategy |
|---|---|---|---|
| **Edge CDN & WAF** | 10k req/s | 500k req/s | Cloudflare Workers execute Edge Virtual Waiting Room, absorbing 490,000+ requests at CDN edge before reaching origin. |
| **API Gateway** | 2 Kong Pods | 20 Kong Pods (HPA) | Kubernetes Horizontal Pod Autoscaler scales on CPU > 60% and HTTP request rate spikes. |
| **Redis Cache Tier** | 1 Master / 1 Replica | 6-Node Sharded Cluster | Key sharding by `product_id`. Redis Lua execution scales to 400,000+ ops/sec across cluster shards. |
| **Payment Gateway** | 50 req/s | Rate-Limited to 500 req/s | PSP rate limits buffer payment processing; client gets instant token response while payment queues asynchronously. |
| **PostgreSQL Database** | 1 Primary / 1 Replica | 1 Primary / 4 Read Replicas | PgBouncer connection pooling caps active DB connections to 200, preventing connection crash under burst load. |

---

## 2. Failure Recovery & Outage Resiliency Protocols

### Scenario 1: Downstream Order Service Outage (30 Seconds)
1. **Event Buffering**: Payment Service emits `PaymentSucceededEvent` to Kafka partition disk.
2. **Exponential Backoff Retry**: Order Service consumer retries with jitter (`1s`, `2s`, `4s`, `8s`, `16s`).
3. **Dead-Letter Queue (DLQ)**: Events exceeding 5 retry attempts route to `salestorm.orders.dlq`.
4. **Reconciler Sweeper**: Background worker polls DLQ every 60s, verifies payment validity, and generates missing orders in PostgreSQL.

### Scenario 2: Payment Gateway Degradation / High Latency
1. **Circuit Breaker Rule**: If payment API response time exceeds 2,000 ms or failure rate > 50% over 10 seconds, Circuit Breaker trips **OPEN**.
2. **Fail Fast Response**: Gateway immediately returns HTTP 503 ("Payment Gateway Busy") in < 1 ms, protecting backend thread pools from hanging.
3. **Half-Open Probe**: After 30s cool-down, circuit allows 5 trial requests to probe payment gateway recovery.

---

## 3. Background Reconciler Worker Logic

```python
# Pseudo-code for Background Reconciler Worker
def reconcile_unfulfilled_payments():
    # Find payments older than 2 minutes with status = 'SUCCESS' but missing order record
    unfulfilled = db.query("""
        SELECT p.* FROM payments p
        LEFT JOIN orders o ON p.idempotency_key = o.idempotency_key
        WHERE p.status = 'SUCCESS' 
          AND o.id IS NULL 
          AND p.created_at < NOW() - INTERVAL '2 minutes'
    """)
    
    for payment in unfulfilled:
        try:
            # Re-attempt order creation in transaction
            with db.transaction():
                order = create_order_record(payment)
                db.insert(order)
                log.info(f"Reconciled order for transaction {payment.transaction_ref}")
        except Exception as err:
            # If unresolvable after 3 attempts, trigger automatic gateway refund
            if payment.retry_count >= 3:
                payment_gateway.refund(payment.transaction_ref)
                payment.status = 'REFUNDED'
                db.update(payment)
```
