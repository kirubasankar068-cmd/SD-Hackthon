import React from 'react';

interface StatusBadgeProps {
  status: 'READY' | 'ACTIVE' | 'DEGRADED' | 'OFFLINE' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let badgeStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let dotStyles = 'bg-emerald-500';

  if (status === 'ACTIVE') {
    badgeStyles = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    dotStyles = 'bg-blue-500 animate-pulse';
  } else if (status === 'DEGRADED') {
    badgeStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    dotStyles = 'bg-amber-500';
  } else if (status === 'OFFLINE') {
    badgeStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    dotStyles = 'bg-rose-500';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-md border ${padding} ${badgeStyles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles}`} />
      <span>{status}</span>
    </span>
  );
};
