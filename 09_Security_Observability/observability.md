# SALESTORM - 09 Telemetry & Observability Framework

## 1. Metrics & Monitoring (Prometheus / Grafana)

| Metric Name | Type | Target SLA / Threshold | Alerting Threshold |
|---|---|---|---|
| `salestorm_inventory_stock_count` | Gauge | >= 0 always | **ALERT P0**: `< 0` (Instant inventory breach alarm) |
| `salestorm_reservation_duration_seconds` | Histogram | p99 < 5 ms | `p99 > 50 ms` for 1 minute |
| `salestorm_payment_failure_rate` | Counter | < 5% | `> 15%` over 2-minute rolling window |
| `salestorm_kafka_consumer_lag` | Gauge | < 100 messages | `> 5,000` messages (Order Service falling behind) |
| `salestorm_http_requests_total` | Counter | Up to 500,000 req/s | Unexpected drop to 0 req/s |

---

## 2. Structured JSON Log Standard

All microservices output JSON-formatted logs to stdout for aggregation into Elasticsearch / Grafana Loki:

```json
{
  "timestamp": "2026-10-05T10:00:00.123Z",
  "level": "INFO",
  "service": "inventory-service",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "customerId": "usr_102",
  "idempotencyKey": "idemp_usr_102_sale_1",
  "productId": "prod_100",
  "action": "STOCK_RESERVED",
  "stockRemaining": 99,
  "durationMs": 1.2
}
```

---

## 3. Distributed Tracing (OpenTelemetry & Jaeger)
- **Trace Context Propagation**: W3C `traceparent` headers forwarded across HTTP REST, gRPC, and Kafka message headers.
- **Span Tracking**: End-to-end trace from client button click -> Gateway -> Redis Lua execution -> Payment PSP call -> Kafka Event -> Postgres DB Insert.
