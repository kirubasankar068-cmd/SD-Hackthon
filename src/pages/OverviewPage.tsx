import React from 'react';
import { Package, Users, CheckCircle, ShieldCheck, Cpu } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { SectionCard } from '../components/SectionCard';
import { ArchitectureFlow } from '../components/ArchitectureFlow';
import { coreGuarantees, initialMetrics } from '../data/mockData';

export const OverviewPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-blue-400">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span>Consistency-First Flash Sale Simulation</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight font-mono">
          FLASHGUARD
        </h1>

        <p className="text-base sm:text-lg font-semibold text-slate-300">
          "Designing for 10,000 requests. Protecting 100 units."
        </p>

        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          A local simulation of a consistency-first architecture for high-scale limited-inventory commerce.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Available Inventory"
          value={initialMetrics.availableInventory}
          icon={Package}
          description="Total units allocated for flash sale"
        />
        <MetricCard
          label="Concurrent Users"
          value={initialMetrics.concurrentUsers}
          icon={Users}
          description="Simulated parallel requests"
        />
        <MetricCard
          label="Successful Reservations"
          value={initialMetrics.successfulReservations}
          icon={CheckCircle}
          description="Stock reservations granted"
        />
        <MetricCard
          label="System Status"
          value={initialMetrics.systemStatus}
          status={initialMetrics.systemStatus}
          description="System health & worker readiness"
        />
      </div>

      {/* Simulation Architecture Section */}
      <SectionCard
        title="Simulation Architecture"
        subtitle="End-to-end request pipeline from edge traffic down to async order persistence"
      >
        <ArchitectureFlow />
      </SectionCard>

      {/* Core Guarantees Section */}
      <SectionCard
        title="Core Guarantees"
        subtitle="Non-negotiable invariants enforced across the architecture"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coreGuarantees.map((guarantee) => (
            <div
              key={guarantee.id}
              className="bg-slate-950 border border-slate-800 rounded-md p-4 flex items-start gap-3"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  {guarantee.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {guarantee.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
