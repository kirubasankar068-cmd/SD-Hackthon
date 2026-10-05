import React from 'react';
import { Menu, Terminal } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

interface TopBarProps {
  onMenuToggle?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-md bg-slate-900 text-slate-400 hover:text-slate-100"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-slate-100 tracking-tight font-mono">
              FlashGuard
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              High-Scale Flash Sale Simulation
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status="READY" size="sm" />

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-800 bg-slate-900 text-[11px] font-mono text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span>LOCAL SIMULATION</span>
        </div>
      </div>
    </header>
  );
};
