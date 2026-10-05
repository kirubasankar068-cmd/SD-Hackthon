import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface StateItem {
  label: string;
  status?: 'active' | 'success' | 'failed' | 'neutral' | 'pending';
}

interface StateChainProps {
  states: StateItem[];
}

export const StateChain: React.FC<StateChainProps> = ({ states }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
      {states.map((state, idx) => {
        let badgeStyle = 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
        let Icon = null;

        if (state.status === 'success') {
          badgeStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
          Icon = CheckCircle2;
        } else if (state.status === 'failed') {
          badgeStyle = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
          Icon = XCircle;
        } else if (state.status === 'active' || state.status === 'pending') {
          badgeStyle = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse';
          Icon = Clock;
        }

        return (
          <React.Fragment key={idx}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold font-mono ${badgeStyle}`}>
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{state.label}</span>
            </div>
            {idx < states.length - 1 && (
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
