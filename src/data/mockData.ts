import type { SystemMetrics, ArchitectureNode, CoreGuarantee } from '../types/metrics';

export interface NavRoute {
  label: string;
  path: string;
  icon: string;
}

export const navigationRoutes: NavRoute[] = [
  { label: 'Overview', path: '/', icon: 'LayoutDashboard' },
  { label: 'Flash Sale', path: '/flash-sale', icon: 'Zap' },
  { label: 'Inventory', path: '/inventory', icon: 'Package' },
  { label: 'Reservations', path: '/reservations', icon: 'Clock' },
  { label: 'Payments', path: '/payments', icon: 'CreditCard' },
  { label: 'Orders', path: '/orders', icon: 'ShoppingBag' },
  { label: 'Failure Simulator', path: '/failures', icon: 'AlertTriangle' },
  { label: 'Architecture', path: '/architecture', icon: 'Network' },
  { label: 'Observability', path: '/observability', icon: 'Activity' },
];

export const initialMetrics: SystemMetrics = {
  availableInventory: 100,
  concurrentUsers: 0,
  successfulReservations: 0,
  systemStatus: 'READY',
};

export const architectureNodes: ArchitectureNode[] = [
  { id: '1', name: 'Traffic', description: 'User HTTP requests & rate limits', step: 1 },
  { id: '2', name: 'API Gateway', description: 'Authentication & token bucket queue', step: 2 },
  { id: '3', name: 'Inventory', description: 'In-memory atomic Lua decrement', step: 3 },
  { id: '4', name: 'Reservation', description: 'TTL bounded stock allocation', step: 4 },
  { id: '5', name: 'Payment', description: 'PSP Gateway processing', step: 5 },
  { id: '6', name: 'Order', description: 'Async event persistence to database', step: 6 },
];

export const coreGuarantees: CoreGuarantee[] = [
  {
    id: 'g1',
    title: 'No Overselling',
    description: 'Inventory count never drops below zero under any concurrency rate.',
  },
  {
    id: 'g2',
    title: 'Idempotent Transactions',
    description: 'Duplicate network submissions reuse existing state without double-charging.',
  },
  {
    id: 'g3',
    title: 'Expiring Reservations',
    description: 'Unpaid allocations automatically release back to available stock pool.',
  },
  {
    id: 'g4',
    title: 'Failure Recovery',
    description: 'Background reconciler resolves dropped events and service outages.',
  },
];
