import { create } from 'zustand';
import type { SimConfig, SimResult, ProblemSimResult, CustomerDetails, OrderState } from '../sim/types';
import { runSimulation } from '../sim/engine';
import { runProblemSimulation } from '../sim/problemEngine';

export type DashboardView = 'main' | 'problem' | 'compare';

export type TabId =
  | 'flash-sale'
  | 'customer-details'
  | 'inventory'
  | 'reservations'
  | 'payments'
  | 'orders'
  | 'waitlist-refunds'
  | 'failures'
  | 'architecture'
  | 'observability';

export type WorkflowStage =
  | 'INGESTION'
  | 'LUA_GATE'
  | 'IDEMPOTENCY'
  | 'PAYMENTS'
  | 'OUTBOX'
  | 'WAITLIST';

interface SimulationStore {
  activeView: DashboardView;
  activeTab: TabId;
  config: SimConfig;
  result: SimResult;
  problemResult: ProblemSimResult;
  isSimulating: boolean;
  isPaused: boolean;
  simProgress: number; // 0 to 100
  simSpeed: number; // 1, 2, 5, 100
  currentStageName: string;
  restockInput: number;
  refundJobRunCount: number;

  setActiveView: (view: DashboardView) => void;
  setActiveTab: (tab: TabId) => void;
  updateConfig: (newConfig: Partial<SimConfig>) => void;
  setRestockInput: (count: number) => void;
  startDynamicSimulation: (targetView?: DashboardView) => void;
  pauseDynamicSimulation: () => void;
  resumeDynamicSimulation: () => void;
  stepDynamicSimulation: () => void;
  resetDynamicSimulation: () => void;
  setSimSpeed: (speed: number) => void;
  jumpToProgress: (progress: number) => void;
  executeSimulation: () => void;
  runProblem: () => void;
  fastForward24Hours: () => void;
  runRefundJobAgain: () => void;
  toggleCircuitBreaker: (state: 'CLOSED' | 'OPEN' | 'HALF_OPEN') => void;
  runScenario: (scenarioName: string, overrides: Partial<SimConfig>) => void;
  resetSimulation: () => void;

  // Interactive Dynamic Methods
  addCustomerRecord: (customer: CustomerDetails) => void;
  manuallyReleaseReservation: (reservationId: string) => void;
  manuallyProcessPayment: (reservationId: string) => void;
  manuallyTransitionOrderState: (orderId: string, newState: OrderState) => { success: boolean; message: string };
  triggerOrderOutageReconciliation: () => void;
}

const defaultConfig: SimConfig = {
  users: 10000,
  stock: 100,
  paymentFailRate: 5,
  duplicateRate: 2,
  orderOutage: false,
  seed: 1337,
  ttlMinutes: 10,
  restockWindowHours: 24,
};

let simTimer: any = null;

export const useSimulationStore = create<SimulationStore>()((set, get) => {
  const initialMainResult = runSimulation(defaultConfig, 100);
  const initialProblemResult = runProblemSimulation(defaultConfig, 100);

  const getStageName = (prog: number, res: SimResult, probRes: ProblemSimResult): string => {
    const unitNum = Math.min(100, Math.floor(prog));
    if (prog < 20) return `Stage 1: Ingesting Requests (${Math.floor((defaultConfig.users * prog) / 100)} / 10,000) | Unit #${unitNum} Processing`;
    if (prog < 40) return `Stage 2: Redis Atomic Lua Gate (Stock: ${res.finalAvailableQuantity}) vs Naive DB Check (Stock: ${probRes.lowestStockSeen})`;
    if (prog < 60) return `Stage 3: Idempotency Key Deduplication (${res.duplicatesAnswered} duplicates blocked vs ${probRes.duplicateCharges} duplicate charges)`;
    if (prog < 75) return `Stage 4: PSP Payment Execution (${res.paymentsSucceeded} Succeeded, ${res.paymentsFailed} Failed/Released)`;
    if (prog < 90) return `Stage 5: Transactional Outbox & Order State Machine (${res.orders.length} Confirmed Orders)`;
    return `Stage 6: FIFO Waitlist Allocation (${res.waitlist.length} Waiting with $299.99 Held Payment)`;
  };

  const stopTimer = () => {
    if (simTimer) {
      clearInterval(simTimer);
      simTimer = null;
    }
  };

  return {
    activeView: 'main',
    activeTab: 'flash-sale',
    config: defaultConfig,
    result: initialMainResult,
    problemResult: initialProblemResult,
    isSimulating: false,
    isPaused: false,
    simProgress: 100,
    simSpeed: 0.5, // Default to slow unit-by-unit speed
    currentStageName: 'Simulation Ready (100% Completed)',
    restockInput: 0,
    refundJobRunCount: 0,

    setActiveView: (view: DashboardView) => set({ activeView: view }),
    setActiveTab: (tab: TabId) => set({ activeTab: tab }),

    updateConfig: (newConfig: Partial<SimConfig>) => {
      const updated = { ...get().config, ...newConfig };
      const prog = get().simProgress;
      const res = runSimulation(updated, prog);
      const probRes = runProblemSimulation(updated, prog);
      set({ config: updated, result: res, problemResult: probRes });
    },

    setRestockInput: (count: number) => set({ restockInput: count }),
    setSimSpeed: (speed: number) => set({ simSpeed: speed }),

    jumpToProgress: (prog: number) => {
      stopTimer();
      const currentCfg = get().config;
      const cleanProg = Math.max(0, Math.min(100, prog));
      const res = runSimulation(currentCfg, cleanProg);
      const probRes = runProblemSimulation(currentCfg, cleanProg);
      set({
        simProgress: cleanProg,
        result: res,
        problemResult: probRes,
        currentStageName: cleanProg === 100 ? 'Simulation Completed' : getStageName(cleanProg, res, probRes),
        isSimulating: false,
        isPaused: false,
      });
    },

    resetDynamicSimulation: () => {
      stopTimer();
      const currentCfg = get().config;
      const res = runSimulation(currentCfg, 0);
      const probRes = runProblemSimulation(currentCfg, 0);
      set({
        simProgress: 0,
        result: res,
        problemResult: probRes,
        currentStageName: 'Reset (0% - Ready to Start Unit #1)',
        isSimulating: false,
        isPaused: false,
      });
    },

    pauseDynamicSimulation: () => {
      stopTimer();
      set({ isPaused: true });
    },

    resumeDynamicSimulation: () => {
      if (!get().isSimulating) {
        get().startDynamicSimulation();
        return;
      }
      set({ isPaused: false });
      const speed = get().simSpeed;
      stopTimer();

      simTimer = setInterval(() => {
        const currentProg = get().simProgress;
        const speedDelta = speed >= 100 ? 100 : speed <= 0.25 ? 0.5 : speed <= 0.5 ? 1 : speed * 2;
        const nextProg = Math.min(100, currentProg + speedDelta);
        const currentCfg = get().config;

        const res = runSimulation(currentCfg, nextProg);
        const probRes = runProblemSimulation(currentCfg, nextProg);

        if (nextProg >= 100) {
          stopTimer();
          set({
            simProgress: 100,
            result: res,
            problemResult: probRes,
            currentStageName: 'Simulation Completed (100%)',
            isSimulating: false,
            isPaused: false,
          });
        } else {
          set({
            simProgress: nextProg,
            result: res,
            problemResult: probRes,
            currentStageName: getStageName(nextProg, res, probRes),
          });
        }
      }, 30);
    },

    stepDynamicSimulation: () => {
      stopTimer();
      const currentProg = get().simProgress;
      const nextProg = Math.min(100, currentProg + 1); // Exact +1 unit step!
      const currentCfg = get().config;
      const res = runSimulation(currentCfg, nextProg);
      const probRes = runProblemSimulation(currentCfg, nextProg);
      set({
        simProgress: nextProg,
        result: res,
        problemResult: probRes,
        currentStageName: nextProg === 100 ? 'Simulation Completed' : getStageName(nextProg, res, probRes),
        isSimulating: nextProg < 100,
        isPaused: true,
      });
    },

    startDynamicSimulation: (targetView?: DashboardView) => {
      stopTimer();
      if (targetView) {
        set({ activeView: targetView });
      }

      const currentCfg = get().config;
      const res0 = runSimulation(currentCfg, 0);
      const probRes0 = runProblemSimulation(currentCfg, 0);
      set({
        simProgress: 0,
        isSimulating: true,
        isPaused: false,
        currentStageName: getStageName(0, res0, probRes0),
        result: res0,
        problemResult: probRes0,
      });

      simTimer = setInterval(() => {
        const currentProg = get().simProgress;
        const speed = get().simSpeed;
        const speedDelta = speed >= 100 ? 100 : speed <= 0.25 ? 0.5 : speed <= 0.5 ? 1 : speed * 2;
        const nextProg = Math.min(100, currentProg + speedDelta);

        const res = runSimulation(currentCfg, nextProg);
        const probRes = runProblemSimulation(currentCfg, nextProg);

        if (nextProg >= 100) {
          stopTimer();
          set({
            simProgress: 100,
            result: res,
            problemResult: probRes,
            currentStageName: 'Simulation Completed (100%)',
            isSimulating: false,
            isPaused: false,
          });
        } else {
          set({
            simProgress: nextProg,
            result: res,
            problemResult: probRes,
            currentStageName: getStageName(nextProg, res, probRes),
          });
        }
      }, 30);
    },

    executeSimulation: () => {
      get().startDynamicSimulation('main');
    },

    runProblem: () => {
      get().startDynamicSimulation('problem');
    },

    fastForward24Hours: () => {
      const { result, restockInput } = get();
      const newWaitlist = result.waitlist.map((w) => ({ ...w }));
      let newAvailable = result.finalAvailableQuantity;
      let newSold = result.finalSoldQuantity;
      let newRefunds = result.refundsProcessed;

      const waitingEntries = newWaitlist.filter((w) => w.status === 'WAITING');

      if (restockInput > 0) {
        const toAllocate = Math.min(restockInput, waitingEntries.length);
        for (let i = 0; i < toAllocate; i++) {
          waitingEntries[i].status = 'ALLOCATED';
          newSold++;
        }
        for (let i = toAllocate; i < waitingEntries.length; i++) {
          waitingEntries[i].status = 'REFUNDED_VOIDED';
          waitingEntries[i].refundTxId = `ref_void_${waitingEntries[i].id}`;
          waitingEntries[i].notified = true;
          newRefunds++;
        }
      } else {
        for (const w of waitingEntries) {
          w.status = 'REFUNDED_VOIDED';
          w.refundTxId = `ref_void_${w.id}`;
          w.notified = true;
          newRefunds++;
        }
      }

      const updatedResult: SimResult = {
        ...result,
        waitlist: newWaitlist,
        finalAvailableQuantity: newAvailable,
        finalSoldQuantity: newSold,
        refundsProcessed: newRefunds,
        logs: [
          ...result.logs,
          {
            id: `log_ff24h_${Date.now()}`,
            timestamp: 86400000,
            type: 'REFUND_PROCESSED',
            message: `24-HOUR RESTOCK WINDOW EXPIRED. Restock stock = ${restockInput}. Processed single refunds & notified customer emails/SMS.`,
            traceId: 'tr_24h_job',
          },
        ],
      };

      set({ result: updatedResult });
    },

    runRefundJobAgain: () => {
      const { result, refundJobRunCount } = get();
      const newRunCount = refundJobRunCount + 1;

      const updatedResult: SimResult = {
        ...result,
        logs: [
          ...result.logs,
          {
            id: `log_rerun_refund_${Date.now()}`,
            timestamp: Date.now(),
            type: 'REFUND_PROCESSED',
            message: `IDEMPOTENT REFUND JOB (Run #${newRunCount + 1}): Checked idempotency_key index. 0 NEW REFUNDS ISSUED (All ${result.refundsProcessed} refunds already completed).`,
            traceId: 'tr_refund_idempotent',
          },
        ],
      };

      set({ result: updatedResult, refundJobRunCount: newRunCount });
    },

    toggleCircuitBreaker: (cbState: 'CLOSED' | 'OPEN' | 'HALF_OPEN') => {
      const { result } = get();
      const updatedResult: SimResult = {
        ...result,
        circuitBreakerState: cbState,
        logs: [
          ...result.logs,
          {
            id: `log_cb_${Date.now()}`,
            timestamp: Date.now(),
            type: 'CIRCUIT_BREAKER',
            message: `Circuit Breaker state manually transitioned to ${cbState}. Gateway requests ${cbState === 'OPEN' ? 'SHORT-CIRCUITED (Fast Fallback)' : 'NORMAL'}.`,
            traceId: 'tr_cb_state',
          },
        ],
      };
      set({ result: updatedResult });
    },

    addCustomerRecord: (customer: CustomerDetails) => {
      const { result } = get();
      const exists = result.savedCustomers.some((c) => c.email === customer.email || c.mobile === customer.mobile);
      if (!exists) {
        set({
          result: {
            ...result,
            savedCustomers: [customer, ...result.savedCustomers],
          },
        });
      }
    },

    manuallyReleaseReservation: (resId: string) => {
      const { result } = get();
      const resIndex = result.reservations.findIndex((r) => r.id === resId);
      if (resIndex === -1) return;

      const targetRes = result.reservations[resIndex];

      // Idempotent check: if already RELEASED, do not increment stock twice!
      if (targetRes.status === 'RELEASED') {
        const updatedLogs = [
          ...result.logs,
          {
            id: `log_idemp_rel_${Date.now()}`,
            timestamp: Date.now(),
            type: 'STOCK_RELEASED' as const,
            message: `IDEMPOTENT RELEASE SAFEGARD: Reservation ${resId} was ALREADY released. Zero extra stock added.`,
            traceId: `tr_${targetRes.idempotencyKey.slice(-8)}`,
          },
        ];
        set({ result: { ...result, logs: updatedLogs } });
        return;
      }

      const newReservations = [...result.reservations];
      newReservations[resIndex] = { ...targetRes, status: 'RELEASED' };

      let newAvailable = result.finalAvailableQuantity + 1;
      let newReserved = result.finalReservedQuantity - 1;
      const newWaitlist = [...result.waitlist];

      // FIFO Waitlist allocation
      const nextWaitingIndex = newWaitlist.findIndex((w) => w.status === 'WAITING');
      if (nextWaitingIndex !== -1 && newAvailable > 0) {
        newWaitlist[nextWaitingIndex] = { ...newWaitlist[nextWaitingIndex], status: 'ALLOCATED' };
        newAvailable--;
        newReserved++;
      }

      set({
        result: {
          ...result,
          reservations: newReservations,
          finalAvailableQuantity: newAvailable,
          finalReservedQuantity: Math.max(0, newReserved),
          waitlist: newWaitlist,
          logs: [
            ...result.logs,
            {
              id: `log_man_rel_${Date.now()}`,
              timestamp: Date.now(),
              type: 'STOCK_RELEASED' as const,
              message: `Manually released reservation ${resId}. Idempotent stock release executed.`,
              traceId: `tr_${targetRes.idempotencyKey.slice(-8)}`,
            },
          ],
        },
      });
    },

    manuallyProcessPayment: (resId: string) => {
      const { result } = get();
      const res = result.reservations.find((r) => r.id === resId);
      if (!res || res.status === 'CONFIRMED' || res.status === 'SOLD') return;

      const newReservations = result.reservations.map((r) =>
        r.id === resId ? ({ ...r, status: 'CONFIRMED' as const }) : r
      );

      const txRef = `tx_manual_${resId}`;
      const newPayment = {
        id: `pay_${result.payments.length + 1}`,
        reservationId: resId,
        idempotencyKey: res.idempotencyKey,
        transactionRef: txRef,
        amount: 299.99,
        state: 'SUCCESS' as const,
        createdAt: Date.now(),
      };

      const newOrder = {
        id: `ord_${result.orders.length + 1}`,
        orderNumber: `ORD-20261005-${String(result.orders.length + 1).padStart(3, '0')}`,
        reservationId: resId,
        transactionRef: txRef,
        idempotencyKey: res.idempotencyKey,
        userId: res.userId,
        totalAmount: 299.99,
        state: 'CONFIRMED' as OrderState,
        createdAt: Date.now(),
        isReconciled: false,
      };

      set({
        result: {
          ...result,
          reservations: newReservations,
          payments: [newPayment, ...result.payments],
          orders: [newOrder, ...result.orders],
          finalSoldQuantity: result.finalSoldQuantity + 1,
          finalReservedQuantity: Math.max(0, result.finalReservedQuantity - 1),
          logs: [
            ...result.logs,
            {
              id: `log_man_pay_${Date.now()}`,
              timestamp: Date.now(),
              type: 'PAYMENT_SUCCESS' as const,
              message: `Manual payment authorized for ${resId}. Transaction ${txRef} -> Order ${newOrder.orderNumber} created.`,
              traceId: `tr_${res.idempotencyKey.slice(-8)}`,
            },
          ],
        },
      });
    },

    manuallyTransitionOrderState: (orderId: string, newState: OrderState) => {
      const { result } = get();
      const targetOrder = result.orders.find((o) => o.id === orderId);
      if (!targetOrder) return { success: false, message: 'Order not found' };

      // State pattern validation matrix
      const validTransitions: Record<OrderState, OrderState[]> = {
        CREATED: ['PAYMENT_PENDING', 'CANCELLED'],
        PAYMENT_PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['OUT_FOR_DELIVERY'],
        OUT_FOR_DELIVERY: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
      };

      const allowed = validTransitions[targetOrder.state]?.includes(newState);

      if (!allowed) {
        return {
          success: false,
          message: `STATE PATTERN REJECTED: Cannot transition order from ${targetOrder.state} directly to ${newState}.`,
        };
      }

      const updatedOrders = result.orders.map((o) =>
        o.id === orderId ? { ...o, state: newState } : o
      );

      set({
        result: {
          ...result,
          orders: updatedOrders,
          logs: [
            ...result.logs,
            {
              id: `log_state_trans_${Date.now()}`,
              timestamp: Date.now(),
              type: 'ORDER_CREATED' as const,
              message: `State pattern transition for Order ${targetOrder.orderNumber}: ${targetOrder.state} -> ${newState}.`,
              traceId: `tr_${targetOrder.idempotencyKey.slice(-8)}`,
            },
          ],
        },
      });

      return {
        success: true,
        message: `Order ${targetOrder.orderNumber} state transitioned to ${newState}`,
      };
    },

    triggerOrderOutageReconciliation: () => {
      const { result } = get();
      const updatedOrders = result.orders.map((o) => ({
        ...o,
        isReconciled: true,
        state: 'CONFIRMED' as OrderState,
      }));

      set({
        result: {
          ...result,
          ordersQueuedDuringOutage: 0,
          ordersReconciledFromDLQ: result.orders.length,
          orders: updatedOrders,
          logs: [
            ...result.logs,
            {
              id: `log_recon_trigger_${Date.now()}`,
              timestamp: Date.now(),
              type: 'RECONCILED' as const,
              message: `Background Reconciler Worker executed: Reconciled 100% of outbox events from Kafka DLQ into PostgreSQL orders table.`,
              traceId: 'tr_reconciler_dlq',
            },
          ],
        },
      });
    },

    runScenario: (scenarioName: string, overrides: Partial<SimConfig>) => {
      set({ isSimulating: true, simProgress: 20 });
      const scenarioConfig = { ...get().config, ...overrides, scenarioName };
      setTimeout(() => {
        const res = runSimulation(scenarioConfig);
        const probRes = runProblemSimulation(scenarioConfig);
        set({
          config: scenarioConfig,
          result: res,
          problemResult: probRes,
          isSimulating: false,
          simProgress: 100,
          activeTab: 'failures',
        });
      }, 500);
    },

    resetSimulation: () => {
      const res = runSimulation(defaultConfig);
      const probRes = runProblemSimulation(defaultConfig);
      set({
        activeView: 'main',
        config: defaultConfig,
        result: res,
        problemResult: probRes,
        activeTab: 'flash-sale',
        refundJobRunCount: 0,
        restockInput: 0,
        simProgress: 100,
      });
    },
  };
});
