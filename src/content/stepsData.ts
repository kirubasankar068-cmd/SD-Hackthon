import type { StepData, StepMeta } from './types';

export const stepsList: StepMeta[] = [
  { id: 1, slug: 'requirements', title: 'Requirements & SLA', goal: 'Establish strict non-overselling guarantees and high-throughput targets for 10,000 concurrent buys.' },
  { id: 2, slug: 'system-context', title: 'System Context & HLD', goal: 'Map end-to-end request path from CDN to Async Order processing, identifying throttle and queue points.' },
  { id: 3, slug: 'container-component', title: 'Container, Component & Deployment', goal: 'Diagram C4 containers, internal components, and multi-AZ cloud deployment with sync vs async boundaries.' },
  { id: 4, slug: 'concurrency-inventory', title: 'Concurrency & Inventory State Machine', goal: 'Design inventory state transitions and evaluate pessimistic, optimistic vs Redis Lua atomic reservation.' },
  { id: 5, slug: 'database-design', title: 'Database Schema & Idempotency', goal: 'Define relational ER schema with strict CHECK constraints, versioning, unique idempotency keys, and indexing.' },
  { id: 6, slug: 'payment-order-workflow', title: 'Payment & Order Workflow', goal: 'Specify resilient payment handling, timeout releases, event retries, DLQ, and background reconciliation.' },
  { id: 7, slug: 'low-level-design', title: 'Low-Level Class & Sequence Diagrams', goal: 'Model object structures and dynamic interaction flows with explicit validation and error boundaries.' },
  { id: 8, slug: 'solid-patterns', title: 'SOLID Principles & Design Patterns', goal: 'Apply Strategy, Factory, State, Observer, Circuit Breaker, and Repository patterns for clean maintainability.' },
  { id: 9, slug: 'api-events', title: 'API Specification & Event Catalog', goal: 'Formulate OpenAPI REST contracts and Kafka domain event schema with idempotent consumer rules.' },
  { id: 10, slug: 'scalability-observability', title: 'Scalability & Reliability Architecture', goal: 'Plan 50x traffic bursts (500k req/s), circuit breakers, dead-letter recovery, structured tracing, and metrics.' },
  { id: 11, slug: 'live-simulation', title: 'Live High-Scale Simulation', goal: 'Verify zero-oversell, exact idempotency, and outage recovery via worker-backed simulation engine.' },
  { id: 12, slug: 'tradeoffs-adr-presentation', title: 'Architectural ADR & Executive Pitch', goal: 'Summarize architectural trade-offs, ADR decisions, presentation pitch timeline, and final jury defense.' }
];

export const stepsData: Record<number, StepData> = {
  1: {
    id: 1,
    slug: 'requirements',
    title: 'Requirements & SLA',
    goal: 'Establish strict non-overselling guarantees and high-throughput targets for 10,000 concurrent buys.',
    blocks: [
      {
        id: 'strict-guarantees',
        title: 'Strict Invariant Guarantees (Non-Negotiable)',
        type: 'list',
        listItems: [
          'Zero Overselling Guarantee: Inventory stock count MUST NEVER drop below 0. For 100 available units, at most 100 units can ever reach CONFIRMED status.',
          'Idempotent Processing: No duplicate reservations, charges, or order fulfillments can occur when users click "Buy Now" multiple times or network retries fire.',
          'Payment Failure Safety: A failed or timed-out payment must automatically release reserved stock within a bounded TTL window so waiting customers can purchase.',
          'Traceable Order State: Every completed transaction ends in a deterministic, audit-logged state (CONFIRMED, RELEASED, or CANCELLED), even during downstream service outages.'
        ]
      },
      {
        id: 'target-metrics',
        title: 'Performance & Availability SLA Targets',
        type: 'table',
        tableData: {
          headers: ['Metric Target', 'Normal Traffic', 'Peak Flash-Sale Load', 'Reasoning & SLA Boundary'],
          rows: [
            ['Throughput (TPS)', '10,000 req/s', 'Up to 500,000 req/s', 'API Gateway token bucket throttles peak spikes; core Lua script processes up to 80k/s per Redis cluster node.'],
            ['p99 Latency', '< 150 ms', '< 250 ms', 'In-memory atomic Lua reservation takes < 3ms; payment processing is decoupled via async token response.'],
            ['Availability', '99.95%', '99.99% (Edge Gate)', 'Edge Virtual Waiting Room absorbs 95%+ of excess traffic above stock limit without touching backend DB.'],
            ['Stock Accuracy', '100%', '100% Strict', 'Single atomic source of truth for reservation with DB reconciliation worker as fallback.']
          ]
        }
      },
      {
        id: 'test-case-baseline',
        title: 'Official Flash-Sale Test Case Definition',
        type: 'callout',
        calloutType: 'info',
        content: 'Baseline Benchmark Scenario: Initial Stock = 100 units. Concurrent Customer Requests = 10,000 at T=0. Payment Gateway Success Rate = 95%, Failure Rate = 5%. Duplicate Client Clicks = 2%. Downstream Order Service Outage = 30 seconds. Expected Result: Exactly 100 units sold, 0 oversold, 0 duplicate orders, and 100% downstream order convergence via background reconciliation.'
      }
    ],
    juryQuestion: {
      question: 'How do you defend 500,000 req/s when your database can only handle 5,000 write queries per second?',
      answer: 'We enforce a multi-tier traffic shedding architecture. 1) At the Edge (CDN/Cloudflare Workers), a Token Bucket Waiting Room queues incoming users and passes only signed tokens at a controlled rate (e.g. 5,000 users/sec). 2) In-Memory Cache Tier: Redis cluster running an atomic Lua script validates stock and idempotency key in ~1ms without DB locks. 3) Database Writes: Order creation is asynchronous via Kafka message queues, decoupling immediate user response latency from slow DB disk I/O.',
      keyPoints: [
        'Edge Waiting Room limits upstream pressure to system capacity.',
        'Atomic Redis Lua script prevents DB lock contention.',
        'Asynchronous DB writes via Kafka decouple write throughput.'
      ]
    }
  },

  2: {
    id: 2,
    slug: 'system-context',
    title: 'System Context & High-Level Architecture (HLD)',
    goal: 'Map end-to-end request path from CDN to Async Order processing, identifying throttle and queue points.',
    blocks: [
      {
        id: 'hld-overview',
        title: 'End-to-End High-Level Request Pipeline',
        type: 'text',
        content: 'When 10,000+ users hit "Buy Now" simultaneously, requests traverse edge infrastructure, edge throttling, in-memory reservation, payment execution, and asynchronous event-driven order processing.'
      },
      {
        id: 'hld-diagram',
        title: 'System Context & Request Path Diagram',
        type: 'diagram',
        diagramCode: `graph TD
  Customer([Customer App / Web]) -->|1. HTTP / Checkout| CDN[CDN / WAF / Cloudflare]
  CDN -->|2. Throttled Traffic| LB[API Load Balancer]
  LB -->|3. Route / Auth| Gateway[API Gateway / Kong]
  
  subgraph Edge Protection
    Gateway -->|4. Queue / Pass Token| WR[Virtual Waiting Room]
  end

  subgraph Flash Core Tier
    WR -->|5. Reserve Stock| InventorySvc[Inventory & Sale Service]
    InventorySvc -->|6. Atomic Lua| Redis[(Redis Cluster / Inventory Cache)]
  end

  subgraph Payment & Order Tier
    InventorySvc -->|7. Authorize Payment| PaymentSvc[Payment Gateway / Service]
    PaymentSvc -->|8. Emit Event| Kafka[Kafka Event Bus]
    Kafka -->|9. Consume PaymentSucceeded| OrderSvc[Order Service]
    OrderSvc -->|10. Persist Order| DB[(Primary PostgreSQL DB)]
  end

  subgraph Recovery & Observability
    Kafka -->|11. Retry / DLQ| DLQ[Dead Letter Queue]
    DLQ -->|12. Reconcile| Reconciler[Background Reconciler]
    Reconciler -->|Fix Missing Orders| DB
  end

  classDef throttle fill:#f59e0b,stroke:#b45309,color:#fff;
  classDef queue fill:#8b5cf6,stroke:#6d28d9,color:#fff;
  classDef core fill:#2563eb,stroke:#1d4ed8,color:#fff;
  class WR,CDN throttle;
  class Kafka,DLQ queue;
  class InventorySvc,PaymentSvc,OrderSvc core;`
      },
      {
        id: 'throttling-queueing-points',
        title: 'Traffic Control: Throttling, Queueing, and Rejection Points',
        type: 'table',
        tableData: {
          headers: ['Component', 'Control Mechanism', 'Behavior at 500k req/s', 'Failure / Fallback Action'],
          rows: [
            ['CDN / Virtual Waiting Room', 'Token Bucket & Rate Limiting', 'Passes max 2,000 req/sec to origin; rest wait in browser queue with dynamic heartbeat poll.', 'HTTP 429 Too Many Requests with retry-after header.'],
            ['API Gateway', 'JWT validation & IP Throttling', 'Rejects unauthorized requests and burst bots before hitting internal microservices.', 'Immediate HTTP 401/429 at Edge Gateway.'],
            ['Redis Atomic Lua', 'Single-threaded memory operation', 'Executes 100 inventory decrements in ~10ms total; all remaining requests immediately receive SOLD_OUT.', 'Returns HTTP 200 {"status": "SOLD_OUT"} in < 5ms.'],
            ['Kafka Queue', 'Partitioned Event Log', 'Buffers PaymentSucceeded events during Order Service downtime without dropping a single order.', 'Events persist on disk for 7 days; background reconciler sweeps unfulfilled orders.']
          ]
        }
      }
    ],
    juryQuestion: {
      question: 'What happens if the API Gateway or Virtual Waiting Room crashes during the flash sale launch?',
      answer: 'We deploy multi-region API Gateways with redundant Health Checks. If the Waiting Room service is unreachable, Cloudflare Workers fall back to a local JS Cryptographic Proof-of-Work algorithm at the CDN edge. Requests without valid proof tokens are automatically blocked before entering origin servers.',
      keyPoints: [
        'Multi-region gateway redundancy with automated failover.',
        'Edge CDN fallback script validates proof-of-work tokens.',
        'Prevents single-point-of-failure under massive traffic.'
      ]
    }
  },

  3: {
    id: 3,
    slug: 'container-component',
    title: 'Container, Component & Deployment Diagrams',
    goal: 'Diagram C4 containers, internal components, and multi-AZ cloud deployment with sync vs async boundaries.',
    blocks: [
      {
        id: 'container-diagram',
        title: 'C4 Container Diagram (Sync vs Async Boundaries)',
        type: 'diagram',
        diagramCode: `graph LR
  subgraph Client Container
    WebUI[React Web App]
  end

  subgraph Origin Container Cluster
    Gateway[API Gateway]
    InvSvc[Inventory Microservice]
    PaySvc[Payment Microservice]
    OrdSvc[Order Microservice]
    RecSvc[Reconciler Worker]
  end

  subgraph Datastores & Messaging
    Redis[(Redis Cluster)]
    DB[(PostgreSQL Primary)]
    Kafka{{Kafka Bus}}
  end

  WebUI -->|Sync HTTPS POST| Gateway
  Gateway -->|Sync gRPC| InvSvc
  InvSvc -->|Sync RESP| Redis
  InvSvc -->|Sync HTTPS| PaySvc
  PaySvc -->|Async Produce| Kafka
  Kafka -->|Async Consume| OrdSvc
  OrdSvc -->|Sync SQL| DB
  RecSvc -->|Sync SQL Read/Write| DB
  RecSvc -->|Sync REST| PaySvc`
      },
      {
        id: 'component-diagram',
        title: 'Internal Component Architecture & Service Roles',
        type: 'table',
        tableData: {
          headers: ['Container / Component', 'Communication Type', 'Primary Responsibility', 'Architectural Rationale'],
          rows: [
            ['API Gateway (Kong)', 'Sync REST/gRPC', 'SSL termination, rate limiting, JWT validation, request routing', 'Shields downstream services from raw HTTP protocol overhead and DDoS bursts.'],
            ['Inventory Service', 'Sync internal gRPC', 'Atomic stock reservation via Redis Lua script & idempotency validation', 'Isolation of critical inventory invariants ensures microsecond decision latency.'],
            ['Payment Service', 'Sync HTTPS to Provider', '3rd-party PSP integration (Stripe/PayPal), payment intent creation', 'Encapsulates payment provider rate limits and gateway timeout retries.'],
            ['Order Service', 'Async Kafka Consumer', 'Persists order entity, line items, and shipping records to PostgreSQL', 'Decouples slow DB disk persistence from fast frontend payment confirmation.'],
            ['Background Reconciler', 'Async Cron / Worker', 'Audits paid reservations vs created orders and recovers lost events', 'Guarantees eventual consistency even if Order Service is offline for hours.']
          ]
        }
      },
      {
        id: 'deployment-diagram',
        title: 'Multi-AZ Cloud Infrastructure & Resilience',
        type: 'diagram',
        diagramCode: `graph TD
  subgraph Public Internet
    Users[10,000 Concurrent Users]
  end

  subgraph Edge Layer (Global CDN)
    WAF[Cloudflare WAF / Waiting Room]
  end

  subgraph AWS Region us-east-1
    subgraph Availability Zone A
      ALB_A[Application Load Balancer]
      InvSvc_A[Inventory Pod]
      OrdSvc_A[Order Pod]
      Redis_Master[(Redis Primary)]
    end

    subgraph Availability Zone B
      ALB_B[Application Load Balancer]
      InvSvc_B[Inventory Pod]
      OrdSvc_B[Order Pod]
      Redis_Replica[(Redis Replica)]
      DB_Primary[(Postgres Primary)]
    end
  end

  Users --> WAF
  WAF --> ALB_A
  WAF --> ALB_B
  ALB_A --> InvSvc_A
  ALB_B --> InvSvc_B
  InvSvc_A --> Redis_Master
  InvSvc_B --> Redis_Master
  OrdSvc_A --> DB_Primary
  OrdSvc_B --> DB_Primary`
      }
    ],
    juryQuestion: {
      question: 'Why separate the Inventory Service from the Order Service instead of writing everything in one transaction?',
      answer: 'Separating Inventory from Order processing decouples latency-sensitive reservations from slow relational DB storage. A synchronous database transaction holding locks across Inventory, Order, and Payment tables would cause massive lock contention, blocking 9,900 users while waiting for 100 payments to complete.',
      keyPoints: [
        'Prevents database lock contention under high concurrency.',
        'Inventory reservation completes in < 5ms in memory.',
        'Order persistence is buffered asynchronously via Kafka.'
      ]
    }
  },

  4: {
    id: 4,
    slug: 'concurrency-inventory',
    title: 'Concurrency & Inventory State Machine',
    goal: 'Design inventory state transitions and evaluate pessimistic, optimistic vs Redis Lua atomic reservation.',
    blocks: [
      {
        id: 'inventory-state-chain',
        title: 'Inventory Lifecycle State Machine',
        type: 'state-chain',
        stateChainData: {
          states: [
            { label: 'AVAILABLE', status: 'neutral' },
            { label: 'RESERVED (TTL 5m)', status: 'pending' },
            { label: 'PAYMENT_PENDING', status: 'active' },
            { label: 'CONFIRMED', status: 'success' },
            { label: 'SOLD', status: 'success' }
          ]
        }
      },
      {
        id: 'concurrency-comparison',
        title: 'Concurrency Model Evaluation Matrix',
        type: 'table',
        tableData: {
          headers: ['Strategy', 'Mechanism', 'Throughput Capacity', 'DB Lock Risk', 'Decision & Selection'],
          rows: [
            ['Pessimistic Locking', 'SELECT ... FOR UPDATE on DB row', '~200 req/sec max', 'EXTREME. Deadlocks and thread pool exhaustion at 10k users.', 'REJECTED due to poor scalability.'],
            ['Optimistic Locking', 'UPDATE ... WHERE version = N', '~1,500 req/sec', 'HIGH RETRY COST. 99% of requests fail version check and retry.', 'REJECTED due to CPU retry thrashing.'],
            ['Atomic Redis Lua (CHOSEN)', 'Single-threaded in-memory atomic script', '80,000+ req/sec', 'ZERO DB LOCKS. Memory decrement with instant response.', 'SELECTED as primary reservation engine.']
          ]
        }
      },
      {
        id: 'redis-lua-code',
        title: 'Chosen Redis Lua Reservation Script',
        type: 'code',
        codeSnippet: {
          language: 'lua',
          code: `-- KEYS[1]: Inventory Stock Key (e.g. "stock:prod_100")
-- KEYS[2]: Idempotency Key (e.g. "idemp:usr_123_sale_1")
-- ARGV[1]: Customer ID
-- ARGV[2]: Reservation Expiry TTL (seconds, e.g. 300)

local existing = redis.call('GET', KEYS[2])
if existing then
    return existing -- Return existing reservation status without re-decrementing
end

local stock = tonumber(redis.call('GET', KEYS[1]) or "0")
if stock > 0 then
    redis.call('DECR', KEYS[1])
    local res = cjson.encode({status="RESERVED", user=ARGV[1], time=redis.call('TIME')[1]})
    redis.call('SETEX', KEYS[2], tonumber(ARGV[2]), res)
    return res
else
    return cjson.encode({status="SOLD_OUT"})
end`,
          explanation: 'Executes atomically in Redis single-threaded engine. Guarantees stock is never decremented below zero.'
        }
      }
    ],
    juryQuestion: {
      question: 'What if Redis crashes after decrementing stock but before returning a response to the user?',
      answer: 'We use Redis Sentinel / Cluster with AOF (Append Only File) sync every second. Every reservation stores an idempotency key with TTL. If a client retries after a network drop, the Lua script checks the idempotency key first and returns the existing reservation state without decrementing stock a second time.',
      keyPoints: [
        'Redis AOF persistence preserves reservation state.',
        'Idempotency key check prevents double-decrements on client retry.',
        'Reservations have explicit TTL for automatic expiration cleanup.'
      ]
    }
  },

  5: {
    id: 5,
    slug: 'database-design',
    title: 'Database Schema & Idempotency Constraints',
    goal: 'Define relational ER schema with strict CHECK constraints, versioning, unique idempotency keys, and indexing.',
    blocks: [
      {
        id: 'db-er-diagram',
        title: 'Relational Entity-Relationship (ER) Schema',
        type: 'diagram',
        diagramCode: `erDiagram
  PRODUCT ||--o{ INVENTORY : has
  INVENTORY ||--o{ INVENTORY_RESERVATION : tracks
  CUSTOMER ||--o{ CART : owns
  CUSTOMER ||--o{ ORDERS : places
  ORDERS ||--|{ ORDER_ITEM : contains
  ORDERS ||--|| PAYMENT : has
  ORDERS ||--o{ SHIPMENT : generates

  INVENTORY {
    uuid id PK
    uuid product_id FK
    int available_quantity
    int reserved_quantity
    int version
  }

  INVENTORY_RESERVATION {
    uuid id PK
    string idempotency_key UK
    uuid customer_id FK
    uuid product_id FK
    string status
    timestamp expires_at
  }

  ORDERS {
    uuid id PK
    string order_number UK
    string idempotency_key UK
    uuid customer_id FK
    decimal total_amount
    string status
  }

  PAYMENT {
    uuid id PK
    string transaction_ref UK
    string idempotency_key UK
    uuid order_id FK
    decimal amount
    string status
  }`
      },
      {
        id: 'db-constraints-table',
        title: 'Database Constraints, Keys & Indexing Strategy',
        type: 'table',
        tableData: {
          headers: ['Table', 'Constraint / Index', 'Type', 'Purpose'],
          rows: [
            ['INVENTORY', 'CHECK (available_quantity >= 0)', 'DB Check Constraint', 'Absolute DB-level safeguard preventing negative inventory under any edge case.'],
            ['INVENTORY', 'idx_inventory_prod_ver (product_id, version)', 'Composite Index', 'Fast optimistic locking lookups during background synchronization.'],
            ['INVENTORY_RESERVATION', 'UNIQUE (idempotency_key)', 'Unique Index', 'Guarantees a customer click cannot generate multiple stock reservations.'],
            ['ORDERS', 'UNIQUE (idempotency_key)', 'Unique Index', 'Prevents duplicate order records if payment notification events are delivered twice.'],
            ['PAYMENT', 'UNIQUE (transaction_ref)', 'Unique Index', 'Ensures payment gateway webhooks cannot process duplicate monetary transactions.']
          ]
        }
      }
    ],
    juryQuestion: {
      question: 'Why use relational PostgreSQL for Orders if inventory is managed in Redis?',
      answer: 'Redis is chosen for volatile, high-throughput in-memory state (stock decrement). PostgreSQL is chosen for durable financial records (Orders, Payments, Audit Logs) because it provides ACID compliance, strong relational integrity, and strict UNIQUE constraints needed for financial audits.',
      keyPoints: [
        'Redis provides sub-millisecond execution for transient stock.',
        'PostgreSQL provides ACID persistence and relational auditing.',
        'Combines speed at the edge with safety at the core.'
      ]
    }
  },

  6: {
    id: 6,
    slug: 'payment-order-workflow',
    title: 'Payment & Order Workflow Resilience',
    goal: 'Specify resilient payment handling, timeout releases, event retries, DLQ, and background reconciliation.',
    blocks: [
      {
        id: 'order-state-chain',
        title: 'Order Lifecycle State Machine',
        type: 'state-chain',
        stateChainData: {
          states: [
            { label: 'CREATED', status: 'neutral' },
            { label: 'PAYMENT_PENDING', status: 'pending' },
            { label: 'CONFIRMED', status: 'success' },
            { label: 'PROCESSING', status: 'active' },
            { label: 'SHIPPED', status: 'active' },
            { label: 'DELIVERED', status: 'success' }
          ]
        }
      },
      {
        id: 'workflow-scenarios',
        title: 'Payment & Order Failure Recovery Matrix',
        type: 'table',
        tableData: {
          headers: ['Scenario', 'Failure Mode', 'System Behavior', 'Recovery & Eventual Consistency'],
          rows: [
            ['Happy Path', 'None (Payment Success)', 'Stock reserved -> Payment confirmed -> Kafka event produced -> Order CREATED.', 'Order marked CONFIRMED instantly.'],
            ['Payment Declined', 'Invalid card / Insufficient funds', 'Payment service returns PAYMENT_FAILED -> Stock released back to Redis immediately.', 'Waiting list customer claims released stock unit.'],
            ['Payment Timeout', 'Gateway unresponsive for 30s', 'Reservation TTL expires (5 min) -> Stock released automatically by Redis key expiry.', 'Stock returned to pool for next customer.'],
            ['Order Service Down', 'Order DB offline / network partition', 'Payment succeeds -> Kafka stores PaymentSucceeded event -> Order creation retried.', 'Background Reconciler reads Kafka DLQ / Redis audit log and creates missing orders.']
          ]
        }
      }
    ],
    juryQuestion: {
      question: 'How do you prevent a customer from being charged if the Order Service fails to create the order record?',
      answer: 'We use the Transactional Outbox Pattern combined with an automated Reconciler. When payment succeeds, a PaymentSucceeded record is written atomically alongside an outbox event. If the Order Service drops the event, the Reconciler sweeps unfulfilled payments older than 2 minutes and either creates the order or issues an automatic gateway refund.',
      keyPoints: [
        'Transactional Outbox guarantees event publishing.',
        'Reconciler detects paid orders missing from database.',
        'Automated refund logic handles unresolvable edge cases.'
      ]
    }
  },

  7: {
    id: 7,
    slug: 'low-level-design',
    title: 'Low-Level Class & Sequence Diagrams',
    goal: 'Model object structures and dynamic interaction flows with explicit validation and error boundaries.',
    blocks: [
      {
        id: 'class-diagram',
        title: 'Domain Class Model & Service Interfaces',
        type: 'diagram',
        diagramCode: `classDiagram
  class InventoryService {
    +reserveStock(productId, userId, idempotencyKey) ReservationResult
    +releaseStock(reservationId) void
  }
  class PaymentService {
    +processPayment(paymentRequest) PaymentResult
    +refundPayment(transactionRef) void
  }
  class OrderService {
    +createOrderFromEvent(paymentEvent) Order
    +getOrderStatus(orderId) OrderStatus
  }
  class ReconcilerWorker {
    +sweepOrphanedPayments() void
    +reconcileDLQ() void
  }

  InventoryService ..> PaymentService : Triggers
  PaymentService ..> OrderService : Emits Event
  ReconcilerWorker ..> OrderService : Recovers`
      },
      {
        id: 'sequence-diagram',
        title: 'Sequence Diagram: Purchase & Outage Recovery Flow',
        type: 'diagram',
        diagramCode: `sequenceDiagram
  autonumber
  actor User
  participant Gate as API Gateway
  participant Inv as Inventory Service
  participant Redis as Redis Cache
  participant Pay as Payment Service
  participant Kafka as Kafka Bus
  participant Order as Order Service
  participant DB as Postgres DB

  User->>Gate: POST /checkout (idempotencyKey)
  Gate->>Inv: reserveStock()
  Inv->>Redis: EVAL script.lua
  alt Stock Available
    Redis-->>Inv: RESERVED
    Inv->>Pay: executePayment()
    Pay-->>User: 200 PAYMENT_SUCCESS
    Pay->>Kafka: Publish PaymentSucceeded
    opt Order Service Down (30s outage)
      Kafka--xOrder: Connection Failed (Retry with backoff)
      Note over Kafka,Order: Message queued in Kafka partition
    end
    Order->>Kafka: Consume PaymentSucceeded (after recovery)
    Order->>DB: INSERT INTO orders
  else Stock Empty
    Redis-->>Inv: SOLD_OUT
    Inv-->>User: 200 SOLD_OUT
  end`
      }
    ],
    juryQuestion: {
      question: 'Where is validation performed in this sequence to protect against malicious API payloads?',
      answer: 'Validation is executed at two layers: 1) Gateway Layer: Validates JSON schema, JWT tokens, and rate limit headers. 2) Domain Service Layer: Validates stock bounds, idempotency key UUID format, and price integrity before touching Redis or payment gateways.',
      keyPoints: [
        'API Gateway validates format, signature, and rate limit.',
        'Domain microservice enforces business invariants.',
        'Defends against payload tampering and bot spam.'
      ]
    }
  },

  8: {
    id: 8,
    slug: 'solid-patterns',
    title: 'SOLID Principles & Design Patterns',
    goal: 'Apply Strategy, Factory, State, Observer, Circuit Breaker, and Repository patterns for clean maintainability.',
    blocks: [
      {
        id: 'solid-table',
        title: 'SOLID Principles Mapping to System Architecture',
        type: 'table',
        tableData: {
          headers: ['Principle', 'Application in System', 'Architectural Benefit'],
          rows: [
            ['Single Responsibility (SRP)', 'InventoryService only handles stock operations; PaymentService only handles gateway integrations.', 'Isolated deployment and zero side-effects during updates.'],
            ['Open/Closed (OCP)', 'PaymentGateway interface allows adding new providers (Stripe, Adyen, ApplePay) via plugins.', 'Core checkout pipeline remains unchanged when introducing payment vendors.'],
            ['Liskov Substitution (LSP)', 'MockPaymentProvider used in test simulations behaves identically to ProductionStripeProvider.', 'Deterministic test suite and zero runtime type coercion errors.'],
            ['Interface Segregation (ISP)', 'Separate ReadOnlyInventory interface for frontend search vs WriteInventory interface for checkout.', 'Prevents query services from accessing mutating methods.'],
            ['Dependency Inversion (DIP)', 'High-level OrderService depends on PaymentProcessor abstraction, not concrete Stripe SDK.', 'Easy mocking and seamless vendor migration.']
          ]
        }
      },
      {
        id: 'design-patterns-table',
        title: 'Design Patterns Matrix',
        type: 'table',
        tableData: {
          headers: ['Pattern', 'Implementation Location', 'Problem Solved', 'Trade-off'],
          rows: [
            ['Strategy', 'PaymentGatewayStrategy', 'Supports multiple payment processors dynamically based on card brand or region.', 'Slightly higher class abstraction overhead.'],
            ['Circuit Breaker', 'Resilience4j on Payment API', 'Prevents cascading thread pool exhaustion when payment gateway experiences high latency.', 'Requests fail fast during gateway degradation.'],
            ['State Pattern', 'OrderState / ReservationState', 'Enforces valid state transition sequences (e.g. cannot ship an unpaid order).', 'Requires state class definitions for each phase.'],
            ['Observer', 'Kafka Event Publisher', 'Decouples order creation, email notifications, and inventory accounting.', 'Eventual consistency downstream.']
          ]
        }
      },
      {
        id: 'ocp-code-snippet',
        title: 'Code Example: Adding a New Payment Provider (OCP & Strategy)',
        type: 'code',
        codeSnippet: {
          language: 'typescript',
          code: `interface PaymentProvider {
  name: string;
  charge(amount: number, token: string): Promise<{ success: boolean; txRef: string }>;
}

class StripePaymentProvider implements PaymentProvider {
  name = 'STRIPE';
  async charge(amount: number, token: string) {
    // Stripe SDK call
    return { success: true, txRef: 'ch_stripe_123' };
  }
}

class AdyenPaymentProvider implements PaymentProvider {
  name = 'ADYEN';
  async charge(amount: number, token: string) {
    // Adyen SDK call
    return { success: true, txRef: 'adyen_tx_999' };
  }
}

// Payment Context uses Strategy without modifying core logic
class PaymentContext {
  constructor(private provider: PaymentProvider) {}
  execute(amount: number, token: string) {
    return this.provider.charge(amount, token);
  }
}`,
          explanation: 'Adding AdyenPaymentProvider requires zero edits to existing checkout or inventory code.'
        }
      }
    ],
    juryQuestion: {
      question: 'How does the Circuit Breaker pattern protect your system during a major payment provider outage?',
      answer: 'When payment gateway call failures cross a 50% threshold over 10 seconds, the Circuit Breaker trips to OPEN status. All subsequent requests fail fast immediately (< 1ms) with a friendly "Payment Gateway Busy" message, preventing thousands of threads from hanging and exhausting API Gateway server resources.',
      keyPoints: [
        'Circuit Breaker trips OPEN to fail fast.',
        'Protects server thread pools from latency accumulation.',
        'Automatically attempts HALF-OPEN trial probes after cool-down.'
      ]
    }
  },

  9: {
    id: 9,
    slug: 'api-events',
    title: 'API Specification & Event Catalog',
    goal: 'Formulate OpenAPI REST contracts and Kafka domain event schema with idempotent consumer rules.',
    blocks: [
      {
        id: 'openapi-table',
        title: 'OpenAPI REST Endpoint Specification',
        type: 'table',
        tableData: {
          headers: ['Method', 'Endpoint', 'Request Payload', 'Response Payload', 'Status Codes', 'Auth / Idempotency'],
          rows: [
            ['POST', '/api/v1/flash-sale/reserve', '{ productId, qty, idempotencyKey }', '{ reservationId, status, expiresAt }', '200 OK, 400 Bad Req, 429 Throttled', 'Bearer JWT + Idempotency-Key Header'],
            ['POST', '/api/v1/payments/charge', '{ reservationId, paymentToken }', '{ transactionRef, status }', '200 OK, 402 Payment Required, 504 Timeout', 'Bearer JWT + Transaction Ref'],
            ['GET', '/api/v1/orders/{orderId}', 'None', '{ orderId, status, items, total }', '200 OK, 404 Not Found', 'Bearer JWT']
          ]
        }
      },
      {
        id: 'events-catalog-table',
        title: 'Kafka Domain Events Catalog',
        type: 'table',
        tableData: {
          headers: ['Event Name', 'Publisher', 'Consumers', 'Payload Summary', 'Idempotent Consumer Handling'],
          rows: [
            ['StockReservedEvent', 'Inventory Service', 'Analytics, Notification', 'reservationId, userId, productId, timestamp', 'Deduplicated via reservationId in consumer DB.'],
            ['PaymentSucceededEvent', 'Payment Service', 'Order Service, Email Service', 'transactionRef, orderId, userId, amount', 'Consumer checks UNIQUE(transaction_ref) before persisting order.'],
            ['PaymentFailedEvent', 'Payment Service', 'Inventory Service', 'reservationId, reason, timestamp', 'Triggers Redis stock increment if reservation was active.'],
            ['OrderConfirmedEvent', 'Order Service', 'Shipment Service, Warehouse', 'orderId, userId, items, address', 'Shipment Service verifies order state = CONFIRMED.']
          ]
        }
      }
    ],
    juryQuestion: {
      question: 'What happens if a Kafka consumer receives the exact same PaymentSucceededEvent twice?',
      answer: 'Consumers are designed with Idempotent Receiver logic. Before processing an event, the Order Service executes an atomic INSERT into `consumed_events (event_id, processed_at)`. If a duplicate event_id is received, the database rejects the insertion via UNIQUE constraint and the consumer safely skips processing.',
      keyPoints: [
        'Idempotent consumer table tracks processed event IDs.',
        'Database UNIQUE constraint blocks duplicate execution.',
        'Guarantees exactly-once processing semantics.'
      ]
    }
  },

  10: {
    id: 10,
    slug: 'scalability-observability',
    title: 'Scalability & Reliability Architecture',
    goal: 'Plan 50x traffic bursts (500k req/s), circuit breakers, dead-letter recovery, structured tracing, and metrics.',
    blocks: [
      {
        id: 'traffic-50x-plan',
        title: '50x Traffic Burst Plan (500,000 req/sec Scaling)',
        type: 'table',
        tableData: {
          headers: ['Tier', 'Normal Load (10k req/s)', '50x Burst (500k req/s)', 'Scaling Strategy & Bottleneck Fix'],
          rows: [
            ['CDN & Edge', '10k req/s', '500k req/s', 'Cloudflare Workers auto-scale globally; Virtual Waiting Room absorbs 490k waiting requests.'],
            ['Redis Cluster', '1 Master node', '6-Node Sharded Cluster', 'Key sharding by product_id; Lua execution capacity scales to 400,000 ops/sec.'],
            ['Order Database', '1 Prim / 1 Repl', '1 Prim / 4 Read Replicas', 'Kafka decouples write spikes; DB connection pooling via PgBouncer prevents connection crashes.'],
            ['Network & Compute', '10 K8s Pods', '100 K8s Pods (HPA)', 'Horizontal Pod Autoscaler triggers on CPU > 60% or custom HTTP request rate metric.']
          ]
        }
      },
      {
        id: 'observability-stack',
        title: 'Observability & Telemetry Framework (Metrics, Logs, Tracing)',
        type: 'list',
        listItems: [
          'Metrics (Prometheus/Grafana): Track HTTP request rate, Redis Lua response latency (p99 < 5ms), stock reservation count, payment failure %, and Kafka consumer lag.',
          'Structured Logging (OpenTelemetry/ELK): JSON logs formatted with trace_id, span_id, customer_id, idempotency_key, and transaction_ref across all microservices.',
          'Distributed Tracing (Jaeger/Zipkin): End-to-end trace correlation from HTTP request click through API Gateway, Redis, Payment API, Kafka, and PostgreSQL persistence.',
          'Critical Alerts (PagerDuty): Alert triggered if stock < 0 (P0 critical breach), payment failure > 15%, or Kafka consumer lag > 5,000 messages.'
        ]
      }
    ],
    juryQuestion: {
      question: 'Which component is the bottleneck under 500,000 req/s, and how do you prevent it from crashing?',
      answer: 'The primary bottleneck is the Payment Gateway API due to 3rd-party network latency and rate limits. We prevent system crash by decoupling inventory reservation from payment execution and applying a Token Bucket Rate Limiter + Circuit Breaker on the Payment Service.',
      keyPoints: [
        '3rd-party payment APIs are the external bottleneck.',
        'Rate limiters buffer payment requests to PSP capacity.',
        'Circuit breakers prevent internal thread pool exhaustion.'
      ]
    }
  },

  11: {
    id: 11,
    slug: 'live-simulation',
    title: 'Live High-Scale Simulation',
    goal: 'Verify zero-oversell, exact idempotency, and outage recovery via worker-backed simulation engine.',
    blocks: [
      {
        id: 'sim-intro',
        title: 'Interactive Web Worker Flash-Sale Engine',
        type: 'text',
        content: 'Run a live simulation of 10,000 to 50,000 customer requests hitting a flash-sale inventory of 100 units in real-time. The engine runs inside a dedicated Web Worker thread so the UI remains smooth and 60 FPS.'
      },
      {
        id: 'sim-metrics-note',
        title: 'Automated Invariant Verification Checks',
        type: 'callout',
        calloutType: 'success',
        content: 'The simulation engine evaluates 7 mathematical invariants after every run: 1) Units Sold <= Initial Stock, 2) Lowest Stock Seen >= 0, 3) Reservations per Idempotency Key == 1, 4) Orders per Paid Reservation == 1, 5) Payments per Transaction Ref == 1, 6) Released Reservations Return Stock == 1, 7) Eventual Order Convergence == 100%.'
      }
    ],
    juryQuestion: {
      question: 'How does your live simulation guarantee that the UI thread does not freeze when processing 50,000 events?',
      answer: 'The simulation logic runs inside a dedicated Web Worker thread off the main UI loop. Batch event state snapshots are posted to the React UI using postMessage at 50ms throttled intervals, ensuring silky smooth 60fps rendering even under heavy processing load.',
      keyPoints: [
        'Web Worker decouples computation from DOM rendering.',
        'Throttled state messages prevent React re-render thrashing.',
        'Allows testing 50,000 user bursts directly in the browser.'
      ]
    }
  },

  12: {
    id: 12,
    slug: 'tradeoffs-adr-presentation',
    title: 'Architectural ADR & Executive Pitch',
    goal: 'Summarize architectural trade-offs, ADR decisions, presentation pitch timeline, and final jury defense.',
    blocks: [
      {
        id: 'adr-table',
        title: 'Architectural Decision Records (ADR Summary)',
        type: 'table',
        tableData: {
          headers: ['ADR ID', 'Decision Topic', 'Chosen Option', 'Alternatives Considered', 'Justification & Impact'],
          rows: [
            ['ADR-01', 'Reservation Engine', 'Atomic Redis Lua', 'Pessimistic DB locks, Optimistic DB versioning', 'Provides microsecond throughput for 100k+ req/s with zero DB lock contention.'],
            ['ADR-02', 'Order Persistence', 'Asynchronous Kafka Consumer', 'Synchronous DB HTTP checkout', 'Decouples disk persistence latency from frontend payment response.'],
            ['ADR-03', 'Traffic Control', 'Edge Virtual Waiting Room', 'Backend API Gateway Rate Limiting', 'Absorbs 95%+ of flash sale traffic burst at CDN edge before reaching origin servers.'],
            ['ADR-04', 'Outage Resilience', 'Background Reconciler Worker', 'Immediate synchronous rollback', 'Guarantees eventual consistency even if Order Service is down for 30+ seconds.']
          ]
        }
      },
      {
        id: 'sacrifices-table',
        title: 'System Design Sacrifices & Conscious Trade-Offs',
        type: 'table',
        tableData: {
          headers: ['Sacrificed Property', 'Consequence / Cost', 'Mitigation Strategy'],
          rows: [
            ['Immediate Consistency', 'Downstream order confirmation is delayed by 1-3 seconds.', 'User sees instant "Payment Confirmed" badge while order persists in background.'],
            ['Architecture Simplicity', 'Requires managing Redis, Kafka, Postgres, and Reconciler workers.', 'Strict infrastructure-as-code and container orchestration (Kubernetes).'],
            ['Waiting Room Delay', 'Customers spend 5-15 seconds in virtual queue before checkout.', 'Dynamic queue position updates and rich visual progress UI.']
          ]
        }
      },
      {
        id: 'pitch-timeline',
        title: '5-Minute Executive Jury Pitch Schedule',
        type: 'table',
        tableData: {
          headers: ['Time Window', 'Topic', 'Core Pitch Focus'],
          rows: [
            ['0:00 - 0:30', 'Problem Statement', '10,000 customers buying 100 units simultaneously: Zero oversell & absolute payment safety.'],
            ['0:30 - 1:00', 'Requirements & SLA', 'Strict guarantees (0 oversell, 0 duplicates) vs SLA targets (10k req/s, p99 < 150ms).'],
            ['1:00 - 2:00', 'High-Level System Context', 'Edge Waiting Room -> Redis Atomic Lua -> Payment API -> Async Kafka Order Pipeline.'],
            ['2:00 - 3:00', 'Critical Concurrency Design', 'Redis Lua script comparison vs Pessimistic/Optimistic DB locks.'],
            ['3:00 - 3:45', 'Payment & Order Workflow', 'Handling gateway timeouts, event retries, DLQ, and automated background reconciliation.'],
            ['3:45 - 4:30', 'Low-Level Design & SOLID', 'Strategy pattern for payment providers, Circuit Breaker for outages, and ER database keys.'],
            ['4:30 - 5:00', 'Live Proof & Verification', 'Live simulation proving zero overselling under 10k concurrent users and 30s outage.']
          ]
        }
      }
    ],
    juryQuestion: {
      question: 'Why should the executive team approve this architecture over a simple monolithic relational database setup?',
      answer: 'A monolithic relational database setup will crash or dead-lock when 10,000 users click "Buy Now" at the same second, leading to overselling, corrupted inventory, lost payments, and brand reputation damage. SALESTORM guarantees 100% stock accuracy, 99.99% edge availability, zero overselling, and automatic outage recovery at scale.',
      keyPoints: [
        'Monolith crashes under 10k concurrent write locks.',
        'SALESTORM guarantees zero overselling and 100% accuracy.',
        'Decoupled microservices protect business revenue and brand trust.'
      ]
    }
  }
};
