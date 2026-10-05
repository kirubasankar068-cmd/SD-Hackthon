import React from 'react';
import {
  Zap,
  UserCheck,
  Package,
  Clock,
  CreditCard,
  ShoppingBag,
  Users,
  AlertTriangle,
  Network,
  Activity,
} from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import type { TabId } from '../store/useSimulationStore';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

export const tabs: TabItem[] = [
  { id: 'flash-sale', label: 'Flash Sale', icon: Zap },
  { id: 'customer-details', label: 'Customer Details', icon: UserCheck },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'reservations', label: 'Reservations', icon: Clock },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'waitlist-refunds', label: 'Waitlist & Refunds', icon: Users },
  { id: 'failures', label: 'Failure Simulator', icon: AlertTriangle },
  { id: 'architecture', label: 'Architecture', icon: Network },
  { id: 'observability', label: 'Observability', icon: Activity },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useSimulationStore();

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-[#334155] flex flex-col justify-between h-full select-none shrink-0 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand Header with Official Logo */}
        <div className="p-4 sm:p-5 border-b border-[#334155] flex items-center gap-3 shrink-0 bg-[#0F172A]">
          <div className="p-1.5 rounded-full bg-[#C58AF9]/15 border border-[#C58AF9]/30 shrink-0">
            <img src="/logo.png" alt="SALESTORM Logo" className="w-7 h-7 rounded-full object-contain" />
          </div>
          <div>
            <div className="font-bold text-[15px] tracking-wider text-[#F8FAFC] font-mono leading-tight">
              SALESTORM
            </div>
            <div className="text-[10px] uppercase font-semibold text-[#38BDF8] font-mono tracking-widest mt-0.5">
              SYSCRAFTERS 2026
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Exact 10 tabs, 16px radius buttons, scrollable if height is small) */}
        <nav aria-label="Sidebar Navigation" className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[16px] text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#C58AF9] text-[#1A1C21] font-semibold shadow-xs'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1A1C21]' : 'text-[#38BDF8]'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3.5 sm:p-4 border-t border-[#334155] bg-[#0F172A] shrink-0">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] mb-1">
          System Status
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="flex items-center gap-2 font-medium text-[#F8FAFC]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            ONLINE GATEWAY
          </span>
          <span className="text-[11px] text-[#94A3B8] font-mono">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
};
