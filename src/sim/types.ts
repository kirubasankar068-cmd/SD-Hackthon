export interface SimConfig {
  users: number;
  stock: number;
  paymentFailRate: number; // e.g. 5 for 5%
  duplicateRate: number; // e.g. 2 for 2%
  orderOutage: boolean; // Order Service down for 30s
  seed: number;
  scenarioName?: string;
  ttlMinutes?: number;
  restockWindowHours?: number;
}

export interface CustomerDetails {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  pinCode: string;
  address: string;
  consent: boolean;
  createdAt: number;
}

export type ReservationStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'SOLD'
  | 'RELEASED'
  | 'EXPIRED'
  | 'TIMEOUT'
  | 'WAITLISTED'
  | 'REFUNDED';

export type PaymentState = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'RECONCILED' | 'HELD' | 'REFUNDED';
export type OrderState = 'CREATED' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface SimRequest {
  id: string;
  userId: string;
  idempotencyKey: string;
  isDuplicate: boolean;
  timestamp: number;
  customer?: CustomerDetails;
}

export interface SimReservation {
  id: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  idempotencyKey: string;
  status: ReservationStatus;
  createdAt: number;
  expiresAt: number;
  isDuplicateCall?: boolean;
}

export interface SimPayment {
  id: string;
  reservationId: string;
  idempotencyKey: string;
  transactionRef: string;
  amount: number;
  state: PaymentState;
  createdAt: number;
  gatewayQueryAttempted?: boolean;
}

export interface SimOrder {
  id: string;
  orderNumber: string;
  reservationId: string;
  transactionRef: string;
  idempotencyKey: string;
  userId: string;
  totalAmount: number;
  state: OrderState;
  createdAt: number;
  isReconciled?: boolean;
}

export interface WaitlistEntry {
  id: string;
  position: number;
  userId: string;
  customerName: string;
  email: string;
  mobile: string;
  timestamp: number;
  heldAmount: number;
  status: 'WAITING' | 'ALLOCATED' | 'REFUNDED_VOIDED';
  refundTxId?: string;
  notified?: boolean;
}

export interface LogEvent {
  id: string;
  timestamp: number;
  type:
    | 'REQUEST_RECEIVED'
    | 'DUPLICATE_BLOCKED'
    | 'STOCK_RESERVED'
    | 'SOLD_OUT'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILED'
    | 'ORDER_CREATED'
    | 'ORDER_OUTAGE_QUEUED'
    | 'RECONCILED'
    | 'STOCK_RELEASED'
    | 'WAITLIST_ADDED'
    | 'WAITLIST_SERVED'
    | 'REFUND_PROCESSED'
    | 'CIRCUIT_BREAKER';
  message: string;
  traceId: string;
  details?: Record<string, any>;
}

export interface DesignCheck {
  name: string;
  passed: boolean;
  measured: string;
  expected: string;
  description: string;
}

export interface ProblemSimResult {
  config: SimConfig;
  totalRequests: number;
  oversoldUnits: number;
  finalUnitsSold: number;
  lowestStockSeen: number;
  finalAvailableQuantity: number;
  duplicateReservations: number;
  duplicateCharges: number;
  duplicateOrders: number;
  paidButNoOrder: number;
  customersInLimbo: number;
  dbQueueDepth: number;
  dbLatencyMs: number;
  doubleRefundsIfReRun: number;
  failedRules: { ruleId: string; title: string; reason: string }[];
  logs: LogEvent[];
  executionTimeMs: number;
}

export interface SimResult {
  config: SimConfig;
  totalRequests: number;
  duplicatesAnswered: number;
  admittedRequests: number;
  soldOutReplies: number;
  firstWaveReservations: number;
  paymentsSucceeded: number;
  paymentsFailed: number;
  releasedAndReserved: number;
  ordersCreatedDirectly: number;
  ordersQueuedDuringOutage: number;
  ordersReconciledFromDLQ: number;
  finalUnitsSold: number;
  lowestStockSeen: number;
  finalAvailableQuantity: number;
  finalReservedQuantity: number;
  finalSoldQuantity: number;
  inventoryVersion: number;
  savedCustomers: CustomerDetails[];
  waitlist: WaitlistEntry[];
  refundsProcessed: number;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  reservations: SimReservation[];
  payments: SimPayment[];
  orders: SimOrder[];
  logs: LogEvent[];
  checks: DesignCheck[];
  executionTimeMs: number;
}

