import type {
  SimConfig,
  SimRequest,
  SimReservation,
  SimPayment,
  SimOrder,
  LogEvent,
  DesignCheck,
  SimResult,
  CustomerDetails,
  WaitlistEntry,
} from './types';

// Seeded PRNG for 100% repeatable simulation runs
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    this.state = (this.state * 9301 + 49297) % 233280;
    return this.state / 233280;
  }
}

/**
 * SALESTORM Simulation Engine
 * Models high-concurrency flash sale with atomic Redis Lua gate,
 * payment execution, idempotency filters, FIFO waitlist, customer validation,
 * and Order Service recovery.
 */
export function runSimulation(config: SimConfig, progressPercent: number = 100): SimResult {
  const startTime = performance.now();
  const rng = new SeededRandom(config.seed || 1337);
  const ratio = Math.max(0, Math.min(100, progressPercent)) / 100;

  // Initial State
  let currentAvailableStock = config.stock;
  let lowestStockSeen = config.stock;
  let reservedQuantity = 0;
  let soldQuantity = 0;
  let inventoryVersion = 1;

  const idempotencyMap = new Map<string, SimReservation>();
  const paymentMap = new Map<string, SimPayment>();
  const orders: SimOrder[] = [];
  const reservations: SimReservation[] = [];
  const payments: SimPayment[] = [];
  const logs: LogEvent[] = [];
  const savedCustomers: CustomerDetails[] = [];
  const waitlist: WaitlistEntry[] = [];

  let duplicatesAnswered = 0;
  let soldOutReplies = 0;
  let firstWaveReservations = 0;
  let paymentsSucceeded = 0;
  let paymentsFailed = 0;
  let releasedAndReserved = 0;
  let ordersQueuedDuringOutage = 0;
  let ordersReconciledFromDLQ = 0;

  // Step 1: Generate Primary Requests & Validated Customer Details
  const primaryRequests: SimRequest[] = [];
  const uniqueKeys: string[] = [];

  const targetUsers = Math.floor(config.users * ratio);

  const firstNames = ['Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Neha', 'Kabir', 'Diya', 'Aditya', 'Isha'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Rao', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Mehta', 'Joshi'];

  for (let i = 0; i < targetUsers; i++) {
    const key = `idemp_usr_${i + 1}_sale_1`;
    uniqueKeys.push(key);

    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const customer: CustomerDetails = {
      id: `cust_${i + 1}`,
      fullName: `${firstName} ${lastName}`,
      mobile: `9876${String(100000 + i).slice(-6)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@example.com`,
      pinCode: `5600${String(10 + (i % 90))}`,
      address: `${101 + (i % 500)}, SysCrafters Ave, Tech Park, City`,
      consent: true,
      createdAt: 1000 + i * 2,
    };
    savedCustomers.push(customer);

    primaryRequests.push({
      id: `req_${i + 1}`,
      userId: customer.id,
      idempotencyKey: key,
      isDuplicate: false,
      timestamp: 1000 + i * 2,
      customer,
    });
  }

  // Inject duplicate requests that reuse an existing idempotency key
  const totalDuplicateCount = Math.floor((config.users * config.duplicateRate) / 100);
  const duplicateCount = Math.floor(totalDuplicateCount * ratio);
  const duplicateRequests: SimRequest[] = [];
  for (let d = 0; d < duplicateCount; d++) {
    if (uniqueKeys.length === 0) break;
    const randomExistingIndex = Math.floor(rng.next() * uniqueKeys.length);
    const reusedKey = uniqueKeys[randomExistingIndex];
    const existingReq = primaryRequests[randomExistingIndex];

    duplicateRequests.push({
      id: `req_dup_${d + 1}`,
      userId: existingReq.userId,
      idempotencyKey: reusedKey,
      isDuplicate: true,
      timestamp: 1050 + d * 2,
      customer: existingReq.customer,
    });
  }

  const allRequests = [...primaryRequests, ...duplicateRequests];

  logs.push({
    id: 'log_start',
    timestamp: 0,
    type: 'REQUEST_RECEIVED',
    message: `Flash sale simulation at ${progressPercent.toFixed(0)}% progress with ${allRequests.length} active requests, ${config.stock} initial stock.`,
    traceId: 'tr_init_000',
  });

  // Step 2: Process Requests via Atomic Redis Lua Gate & FIFO Waitlist
  let waitlistPositionCounter = 1;

  for (const req of allRequests) {
    const traceId = `tr_${req.idempotencyKey.slice(-8)}`;

    // 2a. Check Idempotency Key in Redis Cache (Returns cached response)
    if (idempotencyMap.has(req.idempotencyKey)) {
      duplicatesAnswered++;
      logs.push({
        id: `log_dup_${req.id}`,
        timestamp: req.timestamp,
        type: 'DUPLICATE_BLOCKED',
        message: `Idempotency key ${req.idempotencyKey} hit cache. Returned cached reservation/response without re-checking stock.`,
        traceId,
        details: { idempotencyKey: req.idempotencyKey },
      });
      continue;
    }

    // 2b. Atomic Stock Decrement Gate (Lua Script Execution)
    if (currentAvailableStock > 0) {
      currentAvailableStock--;
      reservedQuantity++;
      inventoryVersion++;
      if (currentAvailableStock < lowestStockSeen) {
        lowestStockSeen = currentAvailableStock;
      }

      const reservation: SimReservation = {
        id: `res_${reservations.length + 1}`,
        userId: req.userId,
        customerName: req.customer?.fullName,
        customerEmail: req.customer?.email,
        customerMobile: req.customer?.mobile,
        idempotencyKey: req.idempotencyKey,
        status: 'RESERVED',
        createdAt: req.timestamp,
        expiresAt: req.timestamp + 600000, // 10 min TTL
      };

      idempotencyMap.set(req.idempotencyKey, reservation);
      reservations.push(reservation);
      firstWaveReservations++;

      logs.push({
        id: `log_res_${reservation.id}`,
        timestamp: req.timestamp,
        type: 'STOCK_RESERVED',
        message: `Atomic Redis decrement successful. Stock remaining: ${currentAvailableStock}. Reservation ${reservation.id} issued with 10m TTL.`,
        traceId,
        details: { reservationId: reservation.id, stockRemaining: currentAvailableStock },
      });
    } else {
      soldOutReplies++;

      // Rule 4: Excess customers join FIFO waitlist with payment HELD (authorise now, capture on allocation)
      if (req.customer && waitlist.length < 50) {
        const waitEntry: WaitlistEntry = {
          id: `wait_${waitlistPositionCounter}`,
          position: waitlistPositionCounter,
          userId: req.userId,
          customerName: req.customer.fullName,
          email: req.customer.email,
          mobile: req.customer.mobile,
          timestamp: req.timestamp,
          heldAmount: 299.99,
          status: 'WAITING',
          notified: false,
        };
        waitlist.push(waitEntry);
        waitlistPositionCounter++;

        logs.push({
          id: `log_wait_${waitEntry.id}`,
          timestamp: req.timestamp,
          type: 'WAITLIST_ADDED',
          message: `Stock empty. Customer ${req.customer.fullName} added to FIFO Waitlist (Pos #${waitEntry.position}) with $299.99 HELD payment.`,
          traceId,
        });
      }

      // Cache SOLD_OUT / WAITLISTED result under idempotency key
      const soldOutReservation: SimReservation = {
        id: `res_wait_${req.id}`,
        userId: req.userId,
        customerName: req.customer?.fullName,
        customerEmail: req.customer?.email,
        customerMobile: req.customer?.mobile,
        idempotencyKey: req.idempotencyKey,
        status: 'WAITLISTED',
        createdAt: req.timestamp,
        expiresAt: req.timestamp + 86400000, // 24h restock window
      };
      idempotencyMap.set(req.idempotencyKey, soldOutReservation);
    }
  }

  // Step 3: Payment Processing Phase
  const activeReservations = [...reservations];
  for (const res of activeReservations) {
    const traceId = `tr_${res.idempotencyKey.slice(-8)}`;
    res.status = 'PAYMENT_PENDING';

    const isPaymentFailure = rng.next() * 100 < config.paymentFailRate;

    if (isPaymentFailure) {
      paymentsFailed++;

      // Release stock back to Redis pool
      res.status = 'RELEASED';
      reservedQuantity--;
      currentAvailableStock++;
      inventoryVersion++;

      logs.push({
        id: `log_pay_fail_${res.id}`,
        timestamp: res.createdAt + 100,
        type: 'PAYMENT_FAILED',
        message: `Payment failed for ${res.id}. Released 1 unit back to stock pool. Stock available now: ${currentAvailableStock}.`,
        traceId,
        details: { reservationId: res.id, newAvailableStock: currentAvailableStock },
      });

      // Rule 6: Released unit goes to first waiting customer in FIFO waitlist
      const nextWaitEntry = waitlist.find((w) => w.status === 'WAITING');

      if (nextWaitEntry && currentAvailableStock > 0) {
        currentAvailableStock--;
        reservedQuantity++;
        inventoryVersion++;
        releasedAndReserved++;

        nextWaitEntry.status = 'ALLOCATED';

        const reReserved: SimReservation = {
          id: `res_re_${reservations.length + 1}`,
          userId: nextWaitEntry.userId,
          customerName: nextWaitEntry.customerName,
          customerEmail: nextWaitEntry.email,
          customerMobile: nextWaitEntry.mobile,
          idempotencyKey: `idemp_waitlist_${nextWaitEntry.id}`,
          status: 'CONFIRMED',
          createdAt: res.createdAt + 150,
          expiresAt: res.createdAt + 600150,
        };

        idempotencyMap.set(reReserved.idempotencyKey, reReserved);
        reservations.push(reReserved);
        paymentsSucceeded++;
        soldQuantity++;
        reservedQuantity--;

        const txRef = `tx_re_pay_${reReserved.id}`;
        const payment: SimPayment = {
          id: `pay_${payments.length + 1}`,
          reservationId: reReserved.id,
          idempotencyKey: reReserved.idempotencyKey,
          transactionRef: txRef,
          amount: 299.99,
          state: 'SUCCESS',
          createdAt: reReserved.createdAt,
        };
        payments.push(payment);
        paymentMap.set(txRef, payment);

        logs.push({
          id: `log_re_res_${reReserved.id}`,
          timestamp: reReserved.createdAt,
          type: 'WAITLIST_SERVED',
          message: `Released stock unit allocated to FIFO Waitlist #${nextWaitEntry.position} (${nextWaitEntry.customerName}). Payment captured.`,
          traceId: `tr_${reReserved.idempotencyKey.slice(-8)}`,
        });
      }
    } else {
      paymentsSucceeded++;
      res.status = 'CONFIRMED';
      soldQuantity++;
      reservedQuantity--;

      const txRef = `tx_pay_${res.id}`;
      const payment: SimPayment = {
        id: `pay_${payments.length + 1}`,
        reservationId: res.id,
        idempotencyKey: res.idempotencyKey,
        transactionRef: txRef,
        amount: 299.99,
        state: 'SUCCESS',
        createdAt: res.createdAt + 100,
      };
      payments.push(payment);
      paymentMap.set(txRef, payment);

      logs.push({
        id: `log_pay_succ_${res.id}`,
        timestamp: res.createdAt + 100,
        type: 'PAYMENT_SUCCESS',
        message: `Payment authorized for ${res.id}. Transaction ref: ${txRef}. Emitted PaymentSucceededEvent.`,
        traceId,
      });
    }
  }

  // Step 4: Order Creation Phase & Outage Recovery
  const paidReservations = reservations.filter((r) => r.status === 'CONFIRMED');

  for (const res of paidReservations) {
    const traceId = `tr_${res.idempotencyKey.slice(-8)}`;
    const txRef = `tx_pay_${res.id}`;

    if (config.orderOutage) {
      ordersQueuedDuringOutage++;
      ordersReconciledFromDLQ++;

      logs.push({
        id: `log_ord_outage_${res.id}`,
        timestamp: res.createdAt + 200,
        type: 'ORDER_OUTAGE_QUEUED',
        message: `Order Service DOWN. PaymentSucceeded event for ${txRef} queued in Kafka outbox partition. Retrying with exponential backoff...`,
        traceId,
      });

      // Background Reconciler recovers order after outage
      const order: SimOrder = {
        id: `ord_${orders.length + 1}`,
        orderNumber: `ORD-20261005-${String(orders.length + 1).padStart(3, '0')}`,
        reservationId: res.id,
        transactionRef: txRef,
        idempotencyKey: res.idempotencyKey,
        userId: res.userId,
        totalAmount: 299.99,
        state: 'CONFIRMED',
        createdAt: res.createdAt + 30000, // 30s recovery
        isReconciled: true,
      };
      orders.push(order);

      logs.push({
        id: `log_ord_recon_${res.id}`,
        timestamp: order.createdAt,
        type: 'RECONCILED',
        message: `Background Reconciler recovered unfulfilled payment ${txRef}. Order ${order.orderNumber} created successfully.`,
        traceId,
      });
    } else {
      const order: SimOrder = {
        id: `ord_${orders.length + 1}`,
        orderNumber: `ORD-20261005-${String(orders.length + 1).padStart(3, '0')}`,
        reservationId: res.id,
        transactionRef: txRef,
        idempotencyKey: res.idempotencyKey,
        userId: res.userId,
        totalAmount: 299.99,
        state: 'CONFIRMED',
        createdAt: res.createdAt + 200,
        isReconciled: false,
      };
      orders.push(order);

      logs.push({
        id: `log_ord_succ_${res.id}`,
        timestamp: order.createdAt,
        type: 'ORDER_CREATED',
        message: `Order ${order.orderNumber} persisted in PostgreSQL. Order state: CONFIRMED.`,
        traceId,
      });
    }
  }

  const finalUnitsSold = orders.length;

  // Step 5: Evaluate Design Checks
  const checks: DesignCheck[] = [
    {
      name: 'Zero Overselling Guarantee',
      passed: finalUnitsSold <= config.stock,
      measured: `${finalUnitsSold} units sold`,
      expected: `<= ${config.stock} initial stock`,
      description: 'Total confirmed orders must never exceed initial inventory stock.',
    },
    {
      name: 'Inventory Non-Negative Boundary',
      passed: lowestStockSeen >= 0 && currentAvailableStock >= 0,
      measured: `Lowest stock seen = ${lowestStockSeen}`,
      expected: `>= 0`,
      description: 'Available inventory stock count must never drop below 0.',
    },
    {
      name: 'Exact Idempotency Safeguard',
      passed: duplicatesAnswered === duplicateCount,
      measured: `${duplicatesAnswered} duplicate requests deduplicated`,
      expected: `${duplicateCount} duplicate requests`,
      description: 'Duplicate client requests with identical idempotency keys reuse state without creating extra reservations.',
    },
    {
      name: 'Payment Failure Release & Re-reservation',
      passed: currentAvailableStock + soldQuantity === config.stock,
      measured: `Available (${currentAvailableStock}) + Sold (${soldQuantity}) = ${config.stock}`,
      expected: `= ${config.stock}`,
      description: 'Every failed payment releases stock back to the pool for waiting customers to purchase.',
    },
    {
      name: 'Order Service Outage Convergence',
      passed: paidReservations.length === orders.length,
      measured: `${orders.length} orders created from ${paidReservations.length} paid reservations`,
      expected: `${paidReservations.length} paid reservations`,
      description: 'Every paid reservation converges to exactly one confirmed order record, even during service outages.',
    },
  ];

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    config,
    totalRequests: allRequests.length,
    duplicatesAnswered,
    admittedRequests: firstWaveReservations + soldOutReplies,
    soldOutReplies,
    firstWaveReservations,
    paymentsSucceeded,
    paymentsFailed,
    releasedAndReserved,
    ordersCreatedDirectly: config.orderOutage ? 0 : orders.length,
    ordersQueuedDuringOutage,
    ordersReconciledFromDLQ,
    finalUnitsSold,
    lowestStockSeen,
    finalAvailableQuantity: currentAvailableStock,
    finalReservedQuantity: reservedQuantity,
    finalSoldQuantity: soldQuantity,
    inventoryVersion,
    savedCustomers,
    waitlist,
    refundsProcessed: 0,
    circuitBreakerState: 'CLOSED',
    reservations,
    payments,
    orders,
    logs,
    checks,
    executionTimeMs,
  };
}

