export interface SystemMetrics {
  availableInventory: number;
  concurrentUsers: number;
  successfulReservations: number;
  systemStatus: 'READY' | 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
}

export interface ArchitectureNode {
  id: string;
  name: string;
  description: string;
  step: number;
}

export interface CoreGuarantee {
  id: string;
  title: string;
  description: string;
}
