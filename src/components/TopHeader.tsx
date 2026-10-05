import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, GitCompare, RefreshCw, Settings } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { SettingsModal } from './SettingsModal';

export const TopHeader: React.FC = () => {
  const { activeView, setActiveView, isSimulating, executeSimulation } = useSimulationStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="bg-[#0F172A] border-b border-[#334155] px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 select-none font-sans">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-1 rounded-full bg-[#C58AF9]/15 border border-[#C58AF9]/30 shrink-0">
            <img src="/logo.png" alt="SALESTORM Logo" className="w-7 h-7 rounded-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono font-normal text-[15px] text-[#F8FAFC]">
              <span>SALESTORM EVALUATION SUITE</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30 font-semibold">
                SYSCRAFTERS 2026
              </span>
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1 font-mono flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[#38BDF8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse"></span> REDIS LUA
              </span>
              <span className="text-[#334155]">|</span>
              <span className="flex items-center gap-1 text-[#C58AF9]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C58AF9] animate-pulse"></span> STRIPE PSP
              </span>
              <span className="text-[#334155]">|</span>
              <span className="flex items-center gap-1 text-[#38BDF8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse"></span> KAFKA OUTBOX
              </span>
              <span className="text-[#334155]">|</span>
              <span className="flex items-center gap-1 text-[#C58AF9]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C58AF9] animate-pulse"></span> POSTGRES DB
              </span>
            </div>
          </div>
        </div>

        {/* Switchable View Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end font-sans">
          <div className="bg-[#1E293B] p-1.5 rounded-full border border-[#334155] flex items-center gap-1.5 text-[13px]">
            <button
              onClick={() => setActiveView('main')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                activeView === 'main'
                  ? 'bg-[#C58AF9] text-[#1A1C21] font-semibold'
                  : 'text-[#F8FAFC] hover:text-white hover:bg-[#334155]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>MAIN DASHBOARD</span>
            </button>

            <button
              onClick={() => setActiveView('problem')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                activeView === 'problem'
                  ? 'bg-[#f43f5e] text-white font-semibold'
                  : 'text-[#F8FAFC] hover:text-white hover:bg-[#334155]'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>PROBLEM DASHBOARD</span>
            </button>

            <button
              onClick={() => setActiveView('compare')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                activeView === 'compare'
                  ? 'bg-[#38BDF8] text-[#1A1C21] font-semibold'
                  : 'text-[#F8FAFC] hover:text-white hover:bg-[#334155]'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>COMPARE VIEW</span>
            </button>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] border border-[#334155] text-[13px] font-medium transition-all cursor-pointer"
            title="Configure API Keys & Infrastructure Settings"
          >
            <Settings className="w-4 h-4 text-[#38BDF8]" />
            <span>API Settings</span>
          </button>

          <button
            onClick={executeSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#C58AF9] hover:opacity-90 text-[#1A1C21] text-[13px] font-semibold transition-all cursor-pointer border border-[#C58AF9] disabled:opacity-50"
            title="Re-run Simulation with Current Seed"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Running...' : 'Run Both'}</span>
          </button>
        </div>
      </header>

      {/* API Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};
