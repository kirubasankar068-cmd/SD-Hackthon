export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
}

export interface MetricItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'ready' | 'active' | 'warning' | 'danger';
  change?: string;
}
