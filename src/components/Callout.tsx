import React from 'react';
import { Info, AlertTriangle, XOctagon, CheckCircle } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({ type = 'info', title, children }) => {
  const configs = {
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200',
      icon: Info,
      iconColor: 'text-blue-500',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    danger: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200',
      icon: XOctagon,
      iconColor: 'text-rose-500',
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border flex gap-3 text-sm leading-relaxed ${config.bg}`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="space-y-1">
        {title && <h4 className="font-semibold text-base leading-tight">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
};
