import React, { useState } from 'react';
import { Package, Play, CheckCircle2, XCircle, Code, ShieldCheck } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { MetricCard } from '../components/MetricCard';

export const InventoryTab: React.FC = () => {
  const { result } = useSimulationStore();
  const [raceState, setRaceState] = useState<{
    reqA: string | null;
    reqB: string | null;
    stock: number;
  }>({ reqA: null, reqB: null, stock: 1 });

  const handleRunRaceDemo = () => {
    // Simulate 2 requests racing for the last unit
    setRaceState({
      reqA: '200 OK (1 row updated -> RESERVED)',
      reqB: '200 OK (0 rows updated -> SOLD_OUT)',
      stock: 0,
    });
  };

  const totalSum = result.finalAvailableQuantity + result.finalReservedQuantity + result.finalSoldQuantity;
  const invariantPassed = totalSum === result.config.stock && result.finalAvailableQuantity >= 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 font-mono flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-400" /> Inventory & Concurrency Design
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect inventory metrics, concurrency locking models, conditional SQL updates, and last-unit race demos.
        </p>
      </div>

      {/* Real-time Inventory State Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard label="Available Qty" value={result.finalAvailableQuantity} />
        <MetricCard label="Reserved Qty" value={result.finalReservedQuantity} />
        <MetricCard label="Sold Qty" value={result.finalSoldQuantity} />
        <MetricCard label="Inventory Version" value={result.inventoryVersion} />
        <MetricCard label="Total Inventory" value={totalSum} />
      </div>

      {/* Invariant Check Card */}
      <div className={`p-4 rounded-lg border flex items-center justify-between font-mono text-xs ${
        invariantPassed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
      }`}>
        <div className="flex items-center gap-2">
          {invariantPassed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
          <div>
            <div className="font-bold">INVARIANT CHECK: Available ({result.finalAvailableQuantity}) + Reserved ({result.finalReservedQuantity}) + Sold ({result.finalSoldQuantity}) = {result.config.stock}</div>
            <div className="text-[11px] opacity-80 mt-0.5">Available stock is strictly non-negative ({result.finalAvailableQuantity} &gt;= 0).</div>
          </div>
        </div>
        <span className="font-bold text-sm px-3 py-1 rounded bg-slate-950 border border-slate-800">
          {invariantPassed ? 'PASSED' : 'FAILED'}
        </span>
      </div>

      {/* Locking Models Comparison Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Concurrency Locking Strategy Evaluation Matrix
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">Strategy</th>
                <th className="p-3">Mechanism</th>
                <th className="p-3">Max Throughput</th>
                <th className="p-3">DB Lock Risk</th>
                <th className="p-3">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/40">
                <td className="p-3 font-bold">Pessimistic Locking</td>
                <td className="p-3">SELECT ... FOR UPDATE on DB row</td>
                <td className="p-3 text-rose-400">~200 req/sec</td>
                <td className="p-3 text-rose-400">EXTREME (Deadlocks)</td>
                <td className="p-3 text-rose-400 font-bold">REJECTED</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="p-3 font-bold">Optimistic Versioning</td>
                <td className="p-3">UPDATE ... WHERE version = N</td>
                <td className="p-3 text-amber-400">~1,500 req/sec</td>
                <td className="p-3 text-amber-400">HIGH RETRY COST</td>
                <td className="p-3 text-amber-400 font-bold">REJECTED</td>
              </tr>
              <tr className="bg-blue-500/10 text-blue-200 border-l-4 border-l-blue-500">
                <td className="p-3 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" /> Atomic Redis Gate + DB Update
                </td>
                <td className="p-3">Single-threaded Redis Lua decrement + conditional DB write</td>
                <td className="p-3 text-emerald-400 font-bold">80,000+ req/sec</td>
                <td className="p-3 text-emerald-400 font-bold">ZERO DB LOCKS</td>
                <td className="p-3 text-emerald-400 font-bold">CHOSEN MODEL</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Snippet & Last-Item Race Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conditional SQL Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
            <Code className="w-4 h-4 text-cyan-400" /> Conditional SQL Update Query
          </div>
          <pre className="p-4 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 leading-relaxed overflow-x-auto">
{`-- Atomic conditional inventory reservation
UPDATE inventory 
SET available_quantity = available_quantity - 1, 
    reserved_quantity = reserved_quantity + 1, 
    version = version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE product_id = 'prod_x_100' 
  AND available_quantity > 0;

-- Note: 0 rows updated indicates item is SOLD_OUT`}
          </pre>
        </div>

        {/* Last-Item Race Demo */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              Last-Unit Race Simulation Demo
            </span>
            <button
              onClick={handleRunRaceDemo}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer font-mono"
            >
              <Play className="w-3.5 h-3.5" /> Race 2 Requests
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Demonstrates 2 concurrent HTTP requests arriving at the exact same millisecond when only 1 unit remains in stock (Stock = 1).
          </p>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Client A (req_last_01):</span>
              <span className="text-emerald-400 font-bold">{raceState.reqA || 'Waiting for trigger...'}</span>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Client B (req_last_02):</span>
              <span className="text-rose-400 font-bold">{raceState.reqB || 'Waiting for trigger...'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
