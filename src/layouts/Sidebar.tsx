import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Package,
  Clock,
  CreditCard,
  ShoppingBag,
  AlertTriangle,
  Network,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { navigationRoutes } from '../data/mockData';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Zap,
  Package,
  Clock,
  CreditCard,
  ShoppingBag,
  AlertTriangle,
  Network,
  Activity,
};

interface SidebarProps {
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onMobileClose }) => {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-full select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-600/10 text-blue-500 border border-blue-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-wider text-slate-100 font-mono">
              FLASHGUARD
            </div>
            <div className="text-[10px] uppercase font-semibold text-slate-400 font-mono tracking-widest">
              SYS CRAFTERS 2026
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav aria-label="Sidebar Navigation" className="p-3 space-y-1">
          {navigationRoutes.map((route) => {
            const Icon = iconMap[route.icon] || LayoutDashboard;
            return (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={onMobileClose}
                end={route.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{route.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
          System Status
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            LOCAL SIMULATION
          </span>
          <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
