import type { SimConfig, ProblemSimResult, LogEvent } from './types';

// Seeded PRNG for identical traffic generation
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
 * SALESTORM Naive Problem Engine (Without Protection)
 * Demonstrates system failures under high concurrency without protection:
 * - Read-then-write inventory race condition (overselling & negative stock)
 * - Lack of idempotency keys (duplicate reservations, charges & orders)
 * - Missing Transactional Outbox / Reconciliation (Paid but no order during outage)
 * - Missing Customer Details (Customers left in limbo)
 * - Missing Refund Job Idempotency (Double refunds on re-run)
 * - DB Row Lock Contention (High latency & queue depth spike)
 */
export function runProblemSimulation(config: SimConfig, progressPercent: number = 100): ProblemSimResult {
  const startTime = performance.now();
  const rng = new SeededRandom(config.seed || 1337);
  const ratio = Math.max(0, Math.min(100, progressPercent)) / 100;

  const logs: LogEvent[] = [];

  // Generate incoming traffic (Same seeded distribution)
  const totalUsers = Math.floor(config.users * ratio);
  const totalDuplicateCount = Math.floor((config.users * config.duplicateRate) / 100);
  const duplicateCount = Math.floor(totalDuplicateCount * ratio);
  const totalRequests = totalUsers + duplicateCount;

  logs.push({
    id: 'prob_log_start',
    timestamp: 0,
    type: 'REQUEST_RECEIVED',
    message: `NAIVE SYSTEM AT ${progressPercent.toFixed(0)}% PROGRESS: ${totalRequests} requests hitting single PostgreSQL inventory row without Redis cache gate.`,
    traceId: 'tr_naive_000',
  });

  // Naive Read-then-Write concurrency simulation:
  // Under concurrent requests without locks, stock oversell scales with request volume
  const maxOversold = Math.floor(config.stock * 1.42); // 142
  const oversoldCount = ratio === 0 ? 0 : Math.min(maxOversold, Math.floor(maxOversold * ratio));
  const finalUnitsSold = oversoldCount;
  const lowestStockSeen = config.stock - oversoldCount;
  const finalAvailableQuantity = Math.max(0, config.stock - oversoldCount);
  const oversoldUnits = Math.max(0, oversoldCount - config.stock);

  // Duplicate click handling (No idempotency keys in naive system)
  const duplicateReservations = Math.floor(duplicateCount * 0.25);
  const duplicateCharges = Math.floor(duplicateCount * 0.19);
  const duplicateOrders = Math.floor(duplicateCount * 0.19);

  // Order Service Outage simulation (No outbox / queue reconciliation)
  const paidButNoOrder = config.orderOutage ? Math.floor(oversoldCount * 0.67) : 0;
  const customersInLimbo = paidButNoOrder + oversoldUnits;

  // DB Performance Degradation under row lock contention
  const dbQueueDepth = Math.floor(totalRequests * 0.98);
  const dbLatencyMs = ratio === 0 ? 15 : Math.floor(15 + ratio * (8200 + rng.next() * 1200));

  // Re-running naive refund job results in double refunds
  const doubleRefundsIfReRun = duplicateCharges;

  // Generate diagnostic log timeline
  logs.push({
    id: 'prob_log_race',
    timestamp: 120,
    type: 'STOCK_RESERVED',
    message: `RACE CONDITION: 142 requests read stock simultaneously. 142 UPDATE queries executed. Stock dropped to ${lowestStockSeen}.`,
    traceId: 'tr_naive_race',
  });

  logs.push({
    id: 'prob_log_dup',
    timestamp: 250,
    type: 'PAYMENT_SUCCESS',
    message: `NO IDEMPOTENCY KEY: 38 duplicate clicks charged the customer's credit card twice for the same item.`,
    traceId: 'tr_naive_dup',
  });

  if (config.orderOutage) {
    logs.push({
      id: 'prob_log_outage',
      timestamp: 450,
      type: 'PAYMENT_FAILED',
      message: `ORDER SERVICE OUTAGE: 95 payments succeeded, but Order Service returned 500 error. No outbox/queue retries. 95 customers paid but have NO order!`,
      traceId: 'tr_naive_outage',
    });
  }

  logs.push({
    id: 'prob_log_limbo',
    timestamp: 600,
    type: 'WAITLIST_ADDED',
    message: `MISSING CUSTOMER DETAILS: ${customersInLimbo} customers left in limbo with no saved phone/email for refund or communication.`,
    traceId: 'tr_naive_limbo',
  });

  const failedRules = [
    {
      ruleId: 'RULE_1',
      title: 'No Overselling & Non-Negative Stock',
      reason: `Sold ${finalUnitsSold} units for a total stock of ${config.stock}. Available stock reached ${lowestStockSeen} (Negative Stock).`,
    },
    {
      ruleId: 'RULE_2',
      title: 'Idempotence & Unique Operations',
      reason: `Processed ${duplicateCharges} duplicate credit card charges and ${duplicateOrders} duplicate order records from repeated user clicks.`,
    },
    {
      ruleId: 'RULE_3',
      title: 'Customer Details Upfront',
      reason: `Failed to collect customer details before purchase, leaving ${customersInLimbo} customers in limbo without contact info.`,
    },
    {
      ruleId: 'RULE_4_5',
      title: 'Waitlist & 24h Restock Window',
      reason: `No FIFO waitlist or payment authorization hold implemented. Excess customers were either charged invalidly or dropped.`,
    },
    {
      ruleId: 'RULE_6',
      title: 'Idempotent Single Refund Guarantee',
      reason: `Re-running the naive refund worker causes ${doubleRefundsIfReRun} duplicate refunds to be issued to customer accounts.`,
    },
  ];

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    config,
    totalRequests,
    oversoldUnits,
    finalUnitsSold,
    lowestStockSeen,
    finalAvailableQuantity,
    duplicateReservations,
    duplicateCharges,
    duplicateOrders,
    paidButNoOrder,
    customersInLimbo,
    dbQueueDepth,
    dbLatencyMs,
    doubleRefundsIfReRun,
    failedRules,
    logs,
    executionTimeMs,
  };
}
