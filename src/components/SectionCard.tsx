import React from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  children,
  action,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div>{children}</div>
    </div>
  );
};
