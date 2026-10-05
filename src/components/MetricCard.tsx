import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  status?: string;
  description?: string;
  subtext?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  status,
  description,
  subtext,
}) => {
  const sub = subtext || description;
  return (
    <div className="bg-[#34363B] border border-[#444746] rounded-[16px] p-6 flex flex-col justify-between font-sans">
      <div className="flex items-center justify-between text-[#9AA0A6] mb-2">
        <span className="text-[12px] font-medium uppercase tracking-wider text-[#9AA0A6] font-mono">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 text-[#99C3FF]" />}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        {status ? (
          <div className="mt-1">
            <StatusBadge status={status} />
          </div>
        ) : (
          <span className="text-[26px] font-semibold font-mono tracking-tight text-[#E8E8E8]">
            {value}
          </span>
        )}
      </div>

      {sub && (
        <p className="text-[11px] font-mono text-[#9AA0A6] mt-2.5 truncate">
          {sub}
        </p>
      )}
    </div>
  );
};
