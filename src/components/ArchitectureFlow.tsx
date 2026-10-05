import React from 'react';
import { ArrowRight } from 'lucide-react';
import { architectureNodes } from '../data/mockData';

export const ArchitectureFlow: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      {architectureNodes.map((node, index) => (
        <React.Fragment key={node.id}>
          <div className="flex-1 min-w-[130px] bg-slate-950 border border-slate-800 rounded-md p-3 text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Step 0{node.step}
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {node.name}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              {node.description}
            </div>
          </div>

          {index < architectureNodes.length - 1 && (
            <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden sm:block" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
