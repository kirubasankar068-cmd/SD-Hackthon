import React from 'react';
import { Clock } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

interface PlaceholderPageProps {
  title: string;
  phase: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  phase,
  description,
}) => {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={description} />

      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="p-3 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700 mb-4">
          <Clock className="w-6 h-6" />
        </div>

        <h2 className="text-lg font-bold text-slate-200 font-mono tracking-wide">
          Coming in {phase}
        </h2>

        <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
          The interactive simulation engine and controls for <span className="text-slate-300 font-semibold">{title}</span> will be implemented in subsequent phases of the hackathon prototype.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-400 border border-slate-700">
          <span>PHASE 1 FOUNDATION ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
