import React, { useState } from 'react';
import { Network, Layers, Database, ShieldCheck, FileText, Cpu, Lock, HelpCircle, CheckCircle2, AlertOctagon, Play, RotateCcw, RefreshCw } from 'lucide-react';
import { MermaidDiagram } from '../components/MermaidDiagram';
import { DataTable } from '../components/DataTable';

export const ArchitectureTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'flow' | 'hld' | 'lld' | 'database' | 'patterns' | 'api' | 'adr' | 'system-tasks'>('flow');
  const [currentFlowStep, setCurrentFlowStep] = useState<number>(0);
  const [isFlowPlaying, setIsFlowPlaying] = useState<boolean>(false);

  // 8-Step Purchase Flow Architecture Details
  const purchaseFlowSteps = [
    {
      step: 1,
      name: '1. Ingestion & Upfront Customer Validation',
      component: 'API Gateway / Cloudflare WAF Edge',
      action: 'Validates customer Name, Mobile, Email, Pincode & Address before entering rate-limited queue.',
      endpoint: 'POST /api/v1/flash-sale/checkout',
      payload: `{\n  "userId": "cust_1042",\n  "fullName": "Aarav Sharma",\n  "mobile": "9876543210",\n  "email": "aarav.sharma@example.com",\n  "pinCode": "560001",\n  "idempotencyKey": "idemp_usr_1042_sale_1"\n}`,
      invariantFix: 'Prevents 10,000 unvalidated burst requests from hitting single DB inventory row.',
      technologies: ['Cloudflare WAF', 'Envoy Gateway', 'Token Bucket Limiter'],
    },
    {
      step: 2,
      name: '2. Atomic Redis Lua Stock Gate',
      component: 'Redis Enterprise Cluster (In-Memory)',
      action: 'Executes single-threaded Lua script (EVAL script.lua) to atomically decrement stock counter in sub-milliseconds.',
      endpoint: 'Redis EVAL "if redis.call(\'get\', KEYS[1]) > \'0\' then return redis.call(\'decr\', KEYS[1]) else return -1 end"',
      payload: `KEYS[1] = "inv:prod_flash_x:stock"\nRETURNS: 99 (Stock Decremented Atomically from 100 -> 99)`,
      invariantFix: 'Guarantees sold (100) <= initial stock (100). Prevents naive read-then-write race condition overselling to 142 units.',
      technologies: ['Redis Enterprise', 'Lua Engine', 'Atomic DECRBY'],
    },
    {
      step: 3,
      name: '3. Idempotency Key Deduplication',
      component: 'Redis Cache State Index',
      action: 'Checks if idempotency_key (idemp_usr_X) already exists in cache. If duplicate click occurs, returns cached response instantly.',
      endpoint: 'GET /cache/idempotency/idemp_usr_1042_sale_1',
      payload: `HTTP 200 OK (CACHED RESPONSE)\n{\n  "reservationId": "res_1042",\n  "status": "RESERVED",\n  "isDuplicate": true\n}`,
      invariantFix: 'Stops 38 duplicate credit card charges and 38 duplicate orders from repeated user clicks.',
      technologies: ['Redis Key Index', 'UUID v4', 'TTL Cache'],
    },
    {
      step: 4,
      name: '4. PSP Payment Execution & Authorization Hold',
      component: 'Stripe / Adyen Payment Service Adapter',
      action: 'Executes 95% successful payment charge. If 5% payment failure occurs, stock unit releases back to pool & re-allocates to FIFO waitlist #1 customer.',
      endpoint: 'POST /v1/payments/charge (Idempotency-Key: idemp_usr_1042_sale_1)',
      payload: `{\n  "reservationId": "res_1042",\n  "amount": 299.99,\n  "currency": "USD"\n}\nRESPONSE: 200 SUCCESS (tx_ref: "tx_pay_res_1042")`,
      invariantFix: 'Every failed payment releases stock back to pool for waiting customers.',
      technologies: ['Stripe PSP API', 'Resilience4j Circuit Breaker', 'Payment Hold'],
    },
    {
      step: 5,
      name: '5. Transactional Outbox Event Publishing',
      component: 'Transactional Outbox & Kafka Event Bus',
      action: 'Persists PaymentSucceededEvent into outbox_events DB table in same transaction. CDC engine streams event to Kafka partition.',
      endpoint: 'INSERT INTO outbox_events (id, event_type, payload, status) VALUES (...)',
      payload: `Topic: "flash-sale-orders"\nEvent: "PaymentSucceededEvent"\n{\n  "transactionRef": "tx_pay_res_1042",\n  "userId": "cust_1042",\n  "amount": 299.99\n}`,
      invariantFix: 'Decouples frontend checkout latency from disk persistence and survives service outages.',
      technologies: ['Transactional Outbox', 'Apache Kafka', 'Debezium CDC'],
    },
    {
      step: 6,
      name: '6. Order Service & PostgreSQL Persistence',
      component: 'Order Service & PostgreSQL Primary DB',
      action: 'Consumes PaymentSucceededEvent, enforces UNIQUE constraint ON orders(idempotency_key), persists confirmed order record.',
      endpoint: 'INSERT INTO orders (id, order_number, idempotency_key, status) VALUES (...)',
      payload: `{\n  "orderId": "ord_1042",\n  "orderNumber": "ORD-20261005-042",\n  "status": "CONFIRMED"\n}`,
      invariantFix: 'Guarantees 1:1 convergence between paid payments and confirmed order records.',
      technologies: ['PostgreSQL 16', 'READ COMMITTED Isolation', 'B-Tree Unique Index'],
    },
    {
      step: 7,
      name: '7. Outage Recovery via DLQ & Reconciler',
      component: 'Background Order Reconciler Job',
      action: 'During 30s Order Service outage, outbox events queue safely. Upon recovery, Reconciler processes DLQ and reconstructs missing orders.',
      endpoint: 'CRON /job/reconcile-outbox-dlq',
      payload: `RECONCILER METRICS:\nQueued Events: 95\nReconciled Orders: 95\nFailed Drops: 0`,
      invariantFix: 'Recovers 100% of unfulfilled orders after outage (0 paid customers left in limbo).',
      technologies: ['Kafka DLQ', 'Spring Batch', 'Outbox Reconciler'],
    },
    {
      step: 8,
      name: '8. FIFO Waitlist & Idempotent Single Refund',
      component: 'FIFO Waitlist Engine & Refund Worker',
      action: 'Unserved waitlist customers receive single refund after 24h restock window. Re-running refund worker checks refund_id index.',
      endpoint: 'POST /job/refund-void-unallocated-waitlist',
      payload: `REFUND WORKER LOG:\nChecked idempotency_key index.\n0 NEW REFUNDS ISSUED (All refunds completed).`,
      invariantFix: 'Guarantees single idempotent refund (0 double refunds on re-runs).',
      technologies: ['FIFO Linked List', 'Payment Void API', 'Idempotent Refund Index'],
    },
  ];

  const handlePlayFlow = () => {
    setIsFlowPlaying(true);
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % purchaseFlowSteps.length;
      setCurrentFlowStep(step);
      if (step === purchaseFlowSteps.length - 1) {
        clearInterval(interval);
        setIsFlowPlaying(false);
      }
    }, 1500);
  };

  const activeStepObj = purchaseFlowSteps[currentFlowStep];

  const hldDiagram = `graph TD
  Customer([Customer App / Web]) -->|1. Submit Order| CDN[CDN / Cloudflare WAF]
  CDN -->|2. Throttled Traffic| ALB[Application Load Balancer]
  ALB -->|3. Route / Auth| Gateway[API Gateway]

  subgraph Edge Protection
    Gateway -->|4. Check Token Queue| WaitingRoom[Virtual Waiting Room]
  end

  subgraph Core Microservices
    WaitingRoom -->|5. Reserve Stock| InvSvc[Inventory Service]
    InvSvc -->|6. Atomic Lua| Redis[(Redis Cluster)]
    InvSvc -->|7. Authorize Payment| PaySvc[Payment Service]
  end

  subgraph Async Event Persistence
    PaySvc -->|8. Publish PaymentSucceeded| Kafka{{Kafka Bus}}
    Kafka -->|9. Consume Event| OrderSvc[Order Service]
    OrderSvc -->|10. Persist Order| Postgres[(PostgreSQL Primary DB)]
  end

  subgraph Recovery
    Kafka -->|11. DLQ Retry| DLQ{{Dead Letter Queue}}
    DLQ -->|12. Audit & Recover| Reconciler[Background Reconciler]
    Reconciler -->|Fix Missing Orders| Postgres
  end`;

  const erDiagram = `erDiagram
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

  INVENTORY {
    uuid id PK
    uuid product_id FK
    int available_quantity "CHECK >= 0"
    int reserved_quantity
    int version
  }
  INVENTORY_RESERVATION {
    uuid id PK
    string idempotency_key UK
    uuid customer_id FK
    string status
    timestamp expires_at
  }
  ORDERS {
    uuid id PK
    string order_number UK
    string idempotency_key UK
    decimal total_amount
    string status
  }
  PAYMENT {
    uuid id PK
    string transaction_ref UK
    string idempotency_key UK
    decimal amount
    string status
  }`;

  const classDiagram = `classDiagram
  class InventoryRepository {
    <<interface>>
    +reserveStockAtomic(productId, userId, idempotencyKey) ReservationResult
  }
  class PaymentGatewayStrategy {
    <<interface>>
    +processCharge(amount, token, idempotencyKey) PaymentResult
  }
  class OrderService {
    +createOrderFromEvent(paymentEvent) Order
    +reconcileOrphanedOrder(paymentRef) Order
  }
  class CircuitBreakerAspect {
    +invokeWithCircuitBreaker(targetCall) Response
  }
  InventoryRepository <|.. RedisInventoryRepository
  PaymentGatewayStrategy <|.. StripePaymentAdapter
  OrderService --> CircuitBreakerAspect`;

  const sequenceDiagram = `sequenceDiagram
  autonumber
  actor User
  participant Gate as API Gateway
  participant Inv as Inventory Service
  participant Redis as Redis Cache
  participant Pay as Payment Service
  participant Kafka as Kafka Bus
  participant Order as Order Service

  User->>Gate: POST /checkout (idempotencyKey)
  Gate->>Inv: reserveStock()
  Inv->>Redis: EVAL script.lua
  alt Stock Available
    Redis-->>Inv: RESERVED
    Inv->>Pay: executePayment()
    Pay-->>User: 200 PAYMENT_SUCCESS
    Pay->>Kafka: Publish PaymentSucceeded
    opt Order Service Down (30s Outage)
      Kafka--xOrder: Connection Failed (Retry & DLQ)
    end
    Order->>Kafka: Consume PaymentSucceeded (after recovery)
  else Stock Empty
    Redis-->>Inv: SOLD_OUT
    Inv-->>User: 200 SOLD_OUT
  end`;

  const orderStateDiagram = `stateDiagram-v2
  [*] --> CREATED
  CREATED --> PAYMENT_PENDING
  PAYMENT_PENDING --> CONFIRMED: Payment Succeeded
  PAYMENT_PENDING --> CANCELLED: Payment Failed
  CONFIRMED --> PROCESSING
  PROCESSING --> SHIPPED
  SHIPPED --> OUT_FOR_DELIVERY
  OUT_FOR_DELIVERY --> DELIVERED
  DELIVERED --> [*]
  CANCELLED --> [*]`;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header with Official Logo */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-1 bg-[#C58AF9]/15 border border-[#C58AF9]/30 rounded-full shrink-0">
            <img src="/logo.png" alt="SALESTORM Logo" className="w-10 h-10 rounded-full object-contain" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#F8FAFC] font-mono flex items-center gap-2.5">
              <Network className="w-5 h-5 text-[#C58AF9]" /> SALESTORM Purchase Flow Architecture Blueprint
            </h1>
            <p className="text-[13px] text-[#94A3B8] mt-0.5 font-sans">
              Interactive 8-stage architectural pipeline solving concurrency race conditions, outage recovery, and duplicate click failures (SYSCRAFTERS 2026).
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap gap-2 border-b border-[#334155] pb-3 font-mono text-[12px]">
        {[
          { id: 'flow', label: '★ Interactive Purchase Flow' },
          { id: 'hld', label: 'System Context & HLD' },
          { id: 'lld', label: 'LLD Class & Sequence' },
          { id: 'database', label: 'ER Schema & Database' },
          { id: 'patterns', label: 'SOLID & Patterns' },
          { id: 'api', label: 'API & Domain Events' },
          { id: 'adr', label: 'ADRs & Trade-offs' },
          { id: 'system-tasks', label: '★ Hackathon Brief (Stages 1-8)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-[#C58AF9] text-[#1A1C21] font-bold shadow-xs'
                : 'bg-[#0F172A] text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] border border-[#334155]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-Tab 0: Interactive Purchase Flow Visualizer */}
      {activeSubTab === 'flow' && (
        <div className="space-y-6">
          {/* Controls & Pipeline Stepper */}
          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[15px] font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <span>8-STAGE END-TO-END PURCHASE FLOW PIPELINE</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30 font-mono">
                    STEP {activeStepObj.step} / 8
                  </span>
                </div>
                <div className="text-[12px] text-[#94A3B8] mt-0.5">
                  Click any stage below to inspect the architecture, API payload, state mutation, and guarantee fix.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayFlow}
                  disabled={isFlowPlaying}
                  className="px-4 py-1.5 rounded-full bg-[#C58AF9] hover:opacity-90 text-[#1A1C21] font-mono font-semibold text-[12px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isFlowPlaying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isFlowPlaying ? 'Simulating Pipeline Flow...' : 'Play Purchase Flow'}</span>
                </button>
                <button
                  onClick={() => setCurrentFlowStep(0)}
                  className="px-3 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] text-[#F8FAFC] hover:border-[#C58AF9] font-mono text-[12px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Reset Step 1</span>
                </button>
              </div>
            </div>

            {/* Stepper Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 font-mono text-[11px]">
              {purchaseFlowSteps.map((st, idx) => (
                <button
                  key={st.step}
                  onClick={() => setCurrentFlowStep(idx)}
                  className={`p-2.5 rounded-[12px] border transition-all cursor-pointer text-left flex flex-col justify-between h-16 ${
                    currentFlowStep === idx
                      ? 'bg-[#C58AF9] text-[#1A1C21] font-bold border-[#C58AF9] shadow-xs'
                      : idx < currentFlowStep
                      ? 'bg-[#38BDF8]/10 border-[#38BDF8]/40 text-[#38BDF8]'
                      : 'bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <div className="text-[10px] font-semibold opacity-80">STEP 0{st.step}</div>
                  <div className="text-[11px] leading-tight truncate">{st.name.split('. ')[1]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Step Deep-Dive Card */}
          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-6 space-y-4 font-mono text-[13px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#334155] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30 font-bold text-[14px]">
                  #{activeStepObj.step}
                </div>
                <div>
                  <div className="text-[16px] font-semibold text-[#F8FAFC]">{activeStepObj.name}</div>
                  <div className="text-[12px] text-[#38BDF8] mt-0.5">Component: {activeStepObj.component}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {activeStepObj.technologies.map((tech) => (
                  <span key={tech} className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#1E293B] text-[#F8FAFC] border border-[#334155]">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans pt-1">
              {/* Left Column: Action & Invariant Fix */}
              <div className="space-y-3 font-mono text-[12px]">
                <div className="bg-[#1E293B] border border-[#334155] rounded-[12px] p-4 space-y-1.5">
                  <div className="text-[11px] uppercase font-semibold text-[#38BDF8]">ARCHITECTURAL ACTION</div>
                  <div className="text-[#F8FAFC] leading-relaxed text-[12px]">{activeStepObj.action}</div>
                </div>

                <div className="bg-[#1E293B] border border-[#22C55E]/40 rounded-[12px] p-4 space-y-1.5">
                  <div className="text-[11px] uppercase font-semibold text-[#22C55E] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> INVARIANT & FAILURE FIX GUARANTEE
                  </div>
                  <div className="text-[#F8FAFC] leading-relaxed text-[12px]">{activeStepObj.invariantFix}</div>
                </div>
              </div>

              {/* Right Column: Code Payload / Query Inspection */}
              <div className="bg-[#0B132B] border border-[#334155] rounded-[12px] p-4 space-y-2 font-mono text-[12px]">
                <div className="flex items-center justify-between text-[#94A3B8] text-[11px] border-b border-[#334155] pb-2">
                  <span>API PAYLOAD & SCRIPT EXECUTION</span>
                  <span className="text-[#C58AF9]">{activeStepObj.endpoint}</span>
                </div>
                <pre className="text-[#38BDF8] text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap p-2 bg-[#0F172A] rounded-[8px] border border-[#334155]">
                  {activeStepObj.payload}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 1: HLD & Problem-to-Solution Mapping */}
      {activeSubTab === 'hld' && (
        <div className="space-y-6">
          {/* Problem vs Architecture Solution Matrix */}
          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[13px]">
            <div className="flex items-center gap-2 text-[#C58AF9] font-semibold text-[14px]">
              <ShieldCheck className="w-5 h-5 text-[#C58AF9]" /> PROBLEM STATEMENT VS SALESTORM ARCHITECTURAL FIXES
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-sans">
              <div className="bg-[#1E293B] border border-[#F43F5E]/30 rounded-[12px] p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#F43F5E] font-mono text-[12px] font-bold">
                  <AlertOctagon className="w-4 h-4" /> NAIVE ARCHITECTURE PROBLEMS
                </div>
                <ul className="space-y-2 text-[12px] text-[#94A3B8] list-disc list-inside font-mono">
                  <li><strong>Read-then-Write Race Condition:</strong> Concurrent queries see stock &gt; 0, overselling 142 units (-42 stock).</li>
                  <li><strong>Duplicate Clicks:</strong> Client retries charge credit card 38 times for 1 user.</li>
                  <li><strong>Order Service 30s Outage:</strong> Payments succeed but order events drop with 0 retries.</li>
                  <li><strong>Missing Contact Info:</strong> 42 customers left in limbo with no email/phone for refunds.</li>
                  <li><strong>Non-Idempotent Refund Job:</strong> Re-running refund script issues duplicate refunds.</li>
                </ul>
              </div>

              <div className="bg-[#1E293B] border border-[#38BDF8]/30 rounded-[12px] p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#38BDF8] font-mono text-[12px] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" /> SALESTORM ARCHITECTURE SOLUTIONS
                </div>
                <ul className="space-y-2 text-[12px] text-[#F8FAFC] list-disc list-inside font-mono">
                  <li><strong>Atomic Redis Lua Gate:</strong> Single-threaded EVAL script DECR script. Sold strictly &le; 100 stock.</li>
                  <li><strong>Idempotency Key Index:</strong> Cached reservation under idemp_usr_X; returns duplicate response instantly.</li>
                  <li><strong>Transactional Outbox + DLQ:</strong> PaymentSucceeded events queued in Kafka outbox; 100% orders reconciled.</li>
                  <li><strong>Upfront Customer Validation:</strong> Name, mobile, email, pincode validated before checkout.</li>
                  <li><strong>Idempotent Refund Worker:</strong> Unique refund_id index guarantees 0 double refunds on re-runs.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#38BDF8]" /> High-Level End-to-End System Context Diagram
            </h2>
            <MermaidDiagram chart={hldDiagram} id="hld-context-diagram" />
          </div>
        </div>
      )}

      {/* Sub-Tab 2: LLD */}
      {activeSubTab === 'lld' && (
        <div className="space-y-6 font-mono text-[13px]">
          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono">
              Domain Class Diagram (Interfaces & Modules)
            </h2>
            <MermaidDiagram chart={classDiagram} id="lld-class-diagram" />
          </div>

          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono">
              Sequence Diagram: Purchase & Outage Recovery Flow
            </h2>
            <MermaidDiagram chart={sequenceDiagram} id="lld-sequence-diagram" />
          </div>

          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono">
              Order State Machine Diagram
            </h2>
            <MermaidDiagram chart={orderStateDiagram} id="order-state-diagram" />
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Database */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono flex items-center gap-2">
              <Database className="w-4 h-4 text-[#38BDF8]" /> Relational Entity-Relationship (ER) Schema (13 Entities)
            </h2>
            <MermaidDiagram chart={erDiagram} id="er-schema-diagram" />
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Patterns */}
      {activeSubTab === 'patterns' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[13px]">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono">
              SOLID Principles Mapping Matrix
            </h2>
            <DataTable
              headers={['Principle', 'Application in System', 'Architectural Benefit']}
              rows={[
                ['Single Responsibility (SRP)', 'InventoryService handles stock; PaymentService handles PSPs.', 'Isolated deployments & zero side-effects.'],
                ['Open/Closed (OCP)', 'PaymentGatewayStrategy interface allows adding new providers (Stripe, Adyen).', 'Zero edits to core checkout code.'],
                ['Liskov Substitution (LSP)', 'MockPaymentAdapter behaves identically to StripePaymentAdapter in tests.', 'Deterministic test suite.'],
                ['Interface Segregation (ISP)', 'ReadOnlyInventory vs WriteInventory interfaces.', 'Prevents query services from holding write locks.'],
                ['Dependency Inversion (DIP)', 'CheckoutProcessor depends on PaymentGateway abstraction, not concrete SDKs.', 'Easy mocking & seamless vendor migration.'],
              ]}
            />
          </div>

          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[13px]">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono">
              Design Patterns Matrix
            </h2>
            <DataTable
              headers={['Pattern', 'Implementation Location', 'Problem Solved', 'Trade-off']}
              rows={[
                ['Strategy', 'PaymentGatewayStrategy', 'Supports multiple payment processors dynamically.', 'Slight class abstraction overhead.'],
                ['Circuit Breaker', 'Resilience4j on Payment API', 'Prevents thread pool exhaustion during gateway outages.', 'Requests fail fast during degradation.'],
                ['State', 'OrderState / ReservationState', 'Enforces valid state transition sequences.', 'Requires managing state classes.'],
                ['Observer', 'Kafka Event Publisher', 'Decouples order creation, emails, and warehouse dispatch.', 'Eventual consistency downstream.'],
                ['Adapter', 'StripePaymentAdapter', 'Translates 3rd-party PSP payloads into internal domain models.', 'Maintenance if external vendor API changes.'],
                ['Repository', 'InventoryRepository', 'Abstracts Redis Lua & Postgres queries from domain logic.', 'Mapping overhead.'],
              ]}
            />
          </div>
        </div>
      )}

      {/* Sub-Tab 5: API */}
      {activeSubTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[13px]">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#38BDF8]" /> OpenAPI REST Specification
            </h2>
            <DataTable
              headers={['Method', 'Endpoint', 'Request Payload', 'Response Payload', 'Status Codes', 'Auth / Idempotency']}
              rows={[
                ['POST', '/api/v1/flash-sale/reserve', '{ productId, qty }', '{ reservationId, status, expiresAt }', '200 OK, 429 Throttled', 'Bearer JWT + Idempotency-Key Header'],
                ['POST', '/api/v1/payments/charge', '{ reservationId, cardToken }', '{ transactionRef, status }', '200 OK, 402 Declined, 503 Circuit Open', 'Bearer JWT + Transaction Ref'],
                ['GET', '/api/v1/orders/{orderId}', 'None', '{ orderId, status, items, total }', '200 OK, 404 Not Found', 'Bearer JWT'],
              ]}
            />
          </div>
        </div>
      )}

      {/* Sub-Tab 6: ADR */}
      {activeSubTab === 'adr' && (
        <div className="space-y-6 font-mono text-[13px]">
          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono">
              Architectural Decision Records (ADR)
            </h2>
            <DataTable
              headers={['ADR ID', 'Decision Topic', 'Chosen Option', 'Alternatives Considered', 'Justification & Impact']}
              rows={[
                ['ADR-01', 'Reservation Engine', 'Atomic Redis Lua', 'Pessimistic DB locks, Optimistic DB versioning', 'Provides microsecond throughput for 80k+ ops/s with zero DB locks.'],
                ['ADR-02', 'Order Persistence', 'Asynchronous Kafka Consumer', 'Synchronous DB HTTP checkout', 'Decouples disk persistence latency from frontend payment response.'],
                ['ADR-03', 'Traffic Control', 'Edge Virtual Waiting Room', 'Backend API Gateway Rate Limiting', 'Absorbs 95%+ of flash sale burst at CDN edge.'],
                ['ADR-04', 'Outage Resilience', 'Background Reconciler Worker', 'Immediate synchronous rollback', 'Guarantees 100% order convergence after service recovery.'],
              ]}
            />
          </div>

          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3">
            <h2 className="text-[14px] font-semibold text-[#C58AF9] font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C58AF9]" /> System Design Trade-Offs Section
            </h2>
            <ul className="space-y-2 text-[12px] text-[#94A3B8] font-mono leading-relaxed list-disc list-inside">
              <li><strong>Consistency vs Availability</strong>: Prioritized strong inventory consistency (Zero Oversell) over immediate availability for excess users.</li>
              <li><strong>Redis Speed vs Secondary Source of Truth</strong>: Used Redis for sub-millisecond atomic reservation, backed by PostgreSQL as the durable source of truth.</li>
              <li><strong>Sync Simplicity vs Async Resilience</strong>: Sacrificed simple synchronous HTTP checkout for asynchronous Kafka event streaming to withstand service outages.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Sub-Tab 7: SYSTEM DESIGN TASKS PANEL (Stages 1 to 8 + Security + Scalability) */}
      {activeSubTab === 'system-tasks' && (
        <div className="space-y-6 font-mono text-[13px]">
          <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4">
            <h2 className="text-[14px] font-semibold text-[#38BDF8] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#38BDF8]" /> SYSTEM DESIGN TASKS PANEL (Stages 1 through 8 Brief Requirements)
            </h2>

            {/* Stage 1 */}
            <div className="p-4 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-2">
              <div className="font-bold text-[#F8FAFC] text-[13px]">Stage 1: Requirements & Assumptions</div>
              <div className="text-[#94A3B8] leading-relaxed text-[12px] font-sans">
                <strong>Functional Requirements (FR):</strong> Users view product, submit validated contact details, reserve stock atomically, pay via PSP gateway, receive confirmed order & notifications. Unclaimed units return to FIFO waitlist.<br/>
                <strong>Non-Functional Requirements (NFR):</strong> P95 Latency &lt; 200ms, 99.99% Availability, Zero Overselling (Strict Invariant), Idempotent Payment & Orders.<br/>
                <strong>Assumptions:</strong> 100 stock units, 10,000 burst users, 95% payment success, 30s Order Service outage SLA.
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-2">
              <div className="font-bold text-[#F8FAFC] text-[13px]">Stage 2: High-Level Architecture & Bottleneck Analysis</div>
              <div className="text-[#94A3B8] leading-relaxed text-[12px] font-sans">
                <strong>Sync vs Async Boundaries:</strong> Stock reservation & payment authorization are synchronous for immediate user feedback. Order creation, warehouse notification, and email/SMS alerts are asynchronous via Kafka event bus.<br/>
                <strong>Primary Bottleneck:</strong> Database row lock contention on product inventory row under 10,000 req/s. Solved by moving atomic inventory gate into single-threaded in-memory Redis cluster with Lua scripts.
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-2">
              <div className="font-bold text-[#F8FAFC] text-[13px]">Stage 3: Concurrency Control & Race Condition Prevention</div>
              <div className="text-[#94A3B8] leading-relaxed text-[12px] font-sans">
                Evaluated Pessimistic Locks (SELECT FOR UPDATE - 200 req/s, high deadlock risk), Optimistic Locks (WHERE version=N - high retry rate), and Redis Atomic Decrement Gate (`EVAL lua_script` - 80,000+ req/s with zero DB locks). Selected Redis Lua + SQL conditional update (`WHERE available &gt; 0`).
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-4 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-2">
              <div className="font-bold text-[#F8FAFC] text-[13px]">Stage 4: Payment & Order Outage Recovery (Transactional Outbox)</div>
              <div className="text-[#94A3B8] leading-relaxed text-[12px] font-sans">
                When Order Service is down for 30s, PaymentSucceeded events are written into the local Transactional Outbox table in the same DB transaction as payment completion. A background CDC engine (Debezium/Kafka Connect) pushes outbox events to Kafka partitions. Retries run with exponential backoff; unresolvable events enter Dead-Letter Queue (DLQ) where a Reconciliation Job reconstructs missing orders. Zero lost orders.
              </div>
            </div>

            {/* Stage 5 */}
            <div className="p-4 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-2">
              <div className="font-bold text-[#F8FAFC] text-[13px]">Stage 5: Low-Level Database Schema & Class Design</div>
              <div className="text-[#94A3B8] leading-relaxed text-[12px] font-sans">
                Relational DB schema with 13 tables: `inventory`, `inventory_reservation`, `customers`, `payments`, `orders`, `waitlist`, `refunds`, `outbox_events`. Foreign keys, unique constraints on `idempotency_key` and `transaction_ref`, composite indexes on `(product_id, status)`.
              </div>
            </div>

            {/* Stage 6 & 7 */}
            <div className="p-4 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-2">
              <div className="font-bold text-[#F8FAFC] text-[13px]">Stage 6 & 7: SOLID, Patterns & API Specifications</div>
              <div className="text-[#94A3B8] leading-relaxed text-[12px] font-sans">
                Applies Strategy (PSP Payment Adapters), Circuit Breaker (Resilience4j), State (Order Workflow), Observer (Kafka Event Bus), Repository (Abstract DB access). OpenAPI 3.0 REST endpoints enforce mandatory `Idempotency-Key` header and JWT Bearer tokens.
              </div>
            </div>

            {/* Stage 8: Security & Scalability */}
            <div className="p-4 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-2">
              <div className="font-bold text-[#C58AF9] text-[13px] flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#C58AF9]" /> Security Architecture & 50x Scalability Strategy
              </div>
              <div className="text-[#94A3B8] leading-relaxed text-[12px] font-sans space-y-1">
                <p><strong>Security Architecture:</strong> Token bucket rate-limiting at CDN/WAF edge. HTTPS TLS 1.3 encryption in transit, AES-256 for saved contact details. PCI-DSS compliant payment tokenization (no raw credit cards stored). Strict audit logging with trace IDs.</p>
                <p><strong>50x Burst Scalability (500,000 req/s):</strong> At 500k req/s, edge Cloudflare Virtual Waiting Room issues HMAC token passkeys to throttle traffic to 10k req/s backend capacity. Redis Enterprise Cluster sharding distributes inventory key slots. Kafka partition count scales horizontally with Horizontal Pod Autoscaling (HPA) on Kubernetes nodes.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory AI Use Note Section */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[13px]">
        <h2 className="text-[14px] font-semibold text-[#C58AF9] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#C58AF9]" /> AI Use Note & System Verification Statement
        </h2>
        <div className="p-4 rounded-[12px] bg-[#1E293B] border border-[#C58AF9]/30 text-[#F8FAFC] leading-relaxed font-sans text-[12px] space-y-2">
          <p>
            <strong>Tool Used:</strong> Antigravity AI Coding Assistant (Google DeepMind Agentic IDE with Gemini 3.6 Flash model).
          </p>
          <p>
            <strong>Purpose:</strong> Designed and implemented high-concurrency simulation models, mathematical state invariants, interactive UI dashboards, C4 &amp; Mermaid architectural diagrams, and side-by-side verification tests.
          </p>
          <p>
            <strong>Validation Process:</strong> Output was systematically validated against all 6 hackathon business rules:
            (1) Verified zero oversell (sold &le; stock) and non-negative available stock using seeded pseudo-random engine;
            (2) Verified 100% deduplication of idempotency keys across duplicate clicks;
            (3) Verified upfront form validation blocking invalid checkouts;
            (4) Verified FIFO waitlist holding payments ($299.99 HELD);
            (5) Verified 24h restock window serving FIFO order and single-refund voiding with customer notifications;
            (6) Verified refund job idempotency returning 0 new refunds on re-runs.
          </p>
        </div>
      </div>
    </div>
  );
};
