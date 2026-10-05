import { describe, it, expect } from 'vitest';
import { runSimulation } from './engine';
import type { SimConfig } from './types';

describe('SALESTORM Simulation Engine Invariants', () => {
  const defaultConfig: SimConfig = {
    users: 10000,
    stock: 100,
    paymentFailRate: 5,
    duplicateRate: 2,
    orderOutage: false,
    seed: 1337,
  };

  it('1. Never oversell (units sold <= initial stock and lowest stock >= 0)', () => {
    const result = runSimulation(defaultConfig);
    expect(result.finalUnitsSold).toBeLessThanOrEqual(defaultConfig.stock);
    expect(result.finalUnitsSold).toBe(100);
    expect(result.lowestStockSeen).toBeGreaterThanOrEqual(0);
    expect(result.finalAvailableQuantity).toBe(0);
  });

  it('2. Handle 2% duplicate requests with exact idempotency (1 reservation per key)', () => {
    const result = runSimulation(defaultConfig);
    const expectedDuplicates = Math.floor((defaultConfig.users * defaultConfig.duplicateRate) / 100);
    expect(result.duplicatesAnswered).toBe(expectedDuplicates);

    // Verify idempotency keys are unique across reservations
    const keys = result.reservations.map((r) => r.idempotencyKey);
    const uniqueKeysSet = new Set(keys);
    expect(keys.length).toBe(uniqueKeysSet.size);
  });

  it('3. Handle 5% payment failures with automatic stock release and full convergence', () => {
    const result = runSimulation({ ...defaultConfig, paymentFailRate: 5 });
    expect(result.paymentsFailed).toBeGreaterThan(0);
    expect(result.releasedAndReserved).toBe(result.paymentsFailed);
    expect(result.finalUnitsSold).toBe(100);
  });

  it('4. Handle Order Service outage for 30 seconds with 100% reconciliation', () => {
    const result = runSimulation({ ...defaultConfig, orderOutage: true });
    expect(result.ordersQueuedDuringOutage).toBeGreaterThan(0);
    expect(result.ordersReconciledFromDLQ).toBe(result.ordersQueuedDuringOutage);
    expect(result.orders.length).toBe(result.paymentsSucceeded);
  });

  it('5. Return fast SOLD_OUT for all requests when stock is 0', () => {
    const result = runSimulation({ ...defaultConfig, stock: 0 });
    expect(result.firstWaveReservations).toBe(0);
    expect(result.finalUnitsSold).toBe(0);
    expect(result.soldOutReplies).toBe(result.totalRequests - result.duplicatesAnswered);
  });

  it('6. Deterministic runs with identical seed produce identical outputs', () => {
    const run1 = runSimulation(defaultConfig);
    const run2 = runSimulation(defaultConfig);
    expect(run1.finalUnitsSold).toBe(run2.finalUnitsSold);
    expect(run1.paymentsSucceeded).toBe(run2.paymentsSucceeded);
    expect(run1.paymentsFailed).toBe(run2.paymentsFailed);
    expect(run1.duplicatesAnswered).toBe(run2.duplicatesAnswered);
  });
});
