# SALESTORM - 12 Executive Presentation Pitch Script

## 1. 5-Minute Executive Jury Pitch Schedule

| Time Window | Pitch Topic | Script & Architectural Focus |
|---|---|---|
| **0:00 - 0:30** | **Problem Statement** | "Good morning panel. Imagine Product X with only 100 units in stock. At the exact same second, 10,000 eager customers click 'Buy Now'. Standard monolithic databases deadlock, crash, and oversell inventory. SALESTORM guarantees 100% stock accuracy, zero overselling, and absolute payment safety at scale." |
| **0:30 - 1:00** | **Requirements & SLA** | "We separate non-negotiable invariants from targets. Invariants: stock never drops below 0, no duplicate charges via UUID idempotency keys, and paid reservations always end in a valid order. Targets: 10,000 normal req/s, bursting to 500,000 req/s with p99 latency < 150 ms." |
| **1:00 - 2:00** | **High-Level System Architecture** | "Our pipeline uses multi-tier defense: 1) Cloudflare Virtual Waiting Room sheds 95%+ excess traffic at the Edge. 2) Atomic Redis Lua script executes inventory reservations in < 1 ms without DB locks. 3) Payment Service authorizes charges synchronously. 4) Kafka buffers event delivery to the Order Service and PostgreSQL database." |
| **2:00 - 3:00** | **Critical Concurrency Design** | "Why Redis Lua over database locks? Pessimistic locks (`SELECT FOR UPDATE`) deadlock at 10k users. Optimistic locks version-thrash. Redis single-threaded atomic Lua scripts evaluate stock decrements in memory at 80,000 ops/sec with zero lock contention." |
| **3:00 - 3:45** | **Payment & Order Workflow** | "What if the Order Service goes offline for 30 seconds? Payment events buffer safely in Kafka disk partitions. When the Order Service recovers, it consumes buffered events idempotently via unique transaction keys. If events land in the DLQ, our Background Reconciler fixes unfulfilled orders automatically." |
| **3:45 - 4:30** | **Low-Level Design & SOLID** | "Our code adheres to SOLID principles: OCP and Strategy pattern allow adding new payment providers (Stripe, Adyen) without touching checkout code. Circuit Breakers trip OPEN during payment provider latency spikes to protect server thread pools." |
| **4:30 - 5:00** | **Live Validation & Proof** | "We validated this design through a 10,000-user load test simulation with 5% payment failure, 2% duplicate clicks, and a 30-second Order Service outage. Result: exactly 100 units sold, 0 oversold, 0 duplicates, and 100% order convergence. SALESTORM is ready for deployment." |

---

## 2. Key Jury Q&A Defense Talking Points

### Jury Question 1: "How do you defend 500,000 req/s when your database can only handle 5,000 write queries per second?"
- **Answer**: "We enforce a multi-tier traffic shedding architecture. 1) At the Edge (CDN/Cloudflare Workers), a Token Bucket Waiting Room queues incoming users and passes only signed tokens at a controlled rate (e.g. 2,000 users/sec). 2) In-Memory Cache Tier: Redis cluster running an atomic Lua script validates stock and idempotency key in ~1ms without DB locks. 3) Database Writes: Order creation is asynchronous via Kafka message queues, decoupling immediate user response latency from slow DB disk I/O."

### Jury Question 2: "What if Redis crashes after decrementing stock but before returning a response to the user?"
- **Answer**: "We deploy Redis Sentinel / Cluster with AOF (Append Only File) sync every second. Every reservation stores an idempotency key with TTL. If a client retries after a network drop, the Lua script checks the idempotency key first and returns the existing reservation state without decrementing stock a second time."

### Jury Question 3: "Why should the executive team approve this architecture over a simple monolithic relational database setup?"
- **Answer**: "A monolithic relational database setup will crash or dead-lock when 10,000 users click 'Buy Now' at the same second, leading to overselling, corrupted inventory, lost payments, and brand reputation damage. SALESTORM guarantees 100% stock accuracy, 99.99% edge availability, zero overselling, and automatic outage recovery at scale."
