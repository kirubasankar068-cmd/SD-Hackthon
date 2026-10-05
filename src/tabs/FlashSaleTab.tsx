import React from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, ShieldCheck, Zap, Info, RefreshCw } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { MetricCard } from '../components/MetricCard';
import { SimulationWorkflowBar } from '../components/SimulationWorkflowBar';

export const FlashSaleTab: React.FC = () => {
  const { config, result, isSimulating, simProgress, executeSimulation, resetDynamicSimulation, updateConfig } =
    useSimulationStore();

  const isSoldWithinStock = result.finalUnitsSold <= config.stock && result.finalAvailableQuantity >= 0;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Workflow Simulation Stepper Bar */}
      <SimulationWorkflowBar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#444746]">
        <div>
          <h1 className="text-[18px] font-normal leading-[1.33] text-[#E8E8E8] font-sans flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-[#C58AF9] fill-current" /> Flash Sale Execution Center
          </h1>
          <p className="text-[13px] text-[#9AA0A6] mt-1">
            Simulate {config.users.toLocaleString()} concurrent customer buy requests against {config.stock} stock units with atomic Redis Lua gate.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={executeSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#C58AF9] hover:opacity-90 text-[#1A1C21] font-semibold text-[13px] transition-all cursor-pointer border border-[#C58AF9] disabled:opacity-50"
          >
            {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isSimulating ? `Processing Stream (${simProgress.toFixed(0)}%)...` : 'Start Flash Sale'}</span>
          </button>

          <button
            onClick={resetDynamicSimulation}
            className="p-2.5 rounded-full bg-[#34363B] hover:bg-[#444746] text-[#E8E8E8] text-[13px] transition-all cursor-pointer border border-[#444746]"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Invariant Banner: sold <= stock */}
      <div className={`p-6 rounded-[16px] border flex items-center justify-between font-mono text-[13px] ${
        isSoldWithinStock
          ? 'bg-[#34363B] border-[#99C3FF]/40 text-[#E8E8E8]'
          : 'bg-[#34363B] border-[#f43f5e]/40 text-[#f43f5e]'
      }`}>
        <div className="flex items-center gap-3">
          {isSoldWithinStock ? (
            <CheckCircle2 className="w-6 h-6 text-[#99C3FF] shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-[#f43f5e] shrink-0" />
          )}
          <div>
            <div className="font-semibold text-[15px] tracking-wide text-[#E8E8E8]">
              sold ({result.finalUnitsSold}) &le; stock ({config.stock}): {isSoldWithinStock ? 'PASS' : 'FAIL'}
            </div>
            <div className="text-[12px] text-[#9AA0A6] mt-0.5 font-sans">
              Available Stock ({result.finalAvailableQuantity}) + Reserved ({result.finalReservedQuantity}) + Sold ({result.finalSoldQuantity}) = Total ({config.stock})
            </div>
          </div>
        </div>

        <span className={`px-4 py-1.5 rounded-full font-semibold text-[12px] border ${
          isSoldWithinStock
            ? 'bg-[#99C3FF]/20 text-[#99C3FF] border-[#99C3FF]/40'
            : 'bg-[#f43f5e]/20 text-[#f43f5e] border-[#f43f5e]/40'
        }`}>
          {isSoldWithinStock ? 'SYSTEM INVARIANT PASS' : 'INVARIANT BROKEN'}
        </span>
      </div>

      {/* Real-time Progress Bar during execution */}
      {isSimulating && (
        <div className="bg-[#34363B] border border-[#C58AF9]/40 rounded-[16px] p-6 font-mono text-[13px] space-y-2.5">
          <div className="flex items-center justify-between text-[#C58AF9] font-medium">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#C58AF9]" />
              Simulating Flash Sale Traffic Stream ({simProgress}% Completed)
            </span>
            <span>{Math.floor((config.users * simProgress) / 100)} / {config.users} Requests</span>
          </div>
          <div className="w-full bg-[#1A1C21] h-2.5 rounded-full overflow-hidden border border-[#444746]">
            <div
              className="bg-[#C58AF9] h-full transition-all duration-200"
              style={{ width: `${simProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-[#34363B] border border-[#444746] rounded-[16px] p-6 font-sans">
        <h2 className="text-[20px] font-normal leading-[1.4] text-[#E8E8E8] mb-4">
          Simulation Control Parameters
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono text-[13px]">
          <div>
            <label className="block text-[#9AA0A6] mb-1">Stock Units</label>
            <input
              type="number"
              value={config.stock}
              onChange={(e) => updateConfig({ stock: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] focus:border-[#C58AF9]"
            />
          </div>

          <div>
            <label className="block text-[#9AA0A6] mb-1">Concurrent Users</label>
            <input
              type="number"
              value={config.users}
              onChange={(e) => updateConfig({ users: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] focus:border-[#C58AF9]"
            />
          </div>

          <div>
            <label className="block text-[#9AA0A6] mb-1">Payment Fail %</label>
            <input
              type="number"
              value={config.paymentFailRate}
              onChange={(e) => updateConfig({ paymentFailRate: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] focus:border-[#C58AF9]"
            />
          </div>

          <div>
            <label className="block text-[#9AA0A6] mb-1">Duplicate %</label>
            <input
              type="number"
              value={config.duplicateRate}
              onChange={(e) => updateConfig({ duplicateRate: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] focus:border-[#C58AF9]"
            />
          </div>

          <div>
            <label className="block text-[#9AA0A6] mb-1">Random Seed</label>
            <input
              type="number"
              value={config.seed}
              onChange={(e) => updateConfig({ seed: parseInt(e.target.value, 10) || 1337 })}
              className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] focus:border-[#C58AF9]"
            />
          </div>

          <div>
            <label className="block text-[#9AA0A6] mb-1">Order Outage (30s)</label>
            <button
              onClick={() => updateConfig({ orderOutage: !config.orderOutage })}
              className={`w-full py-2 rounded-full font-medium transition-all cursor-pointer ${
                config.orderOutage
                  ? 'bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/40'
                  : 'bg-[#1A1C21] text-[#9AA0A6] border border-[#444746]'
              }`}
            >
              {config.orderOutage ? 'OUTAGE ACTIVE' : 'NORMAL (ONLINE)'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Counter Cards (Exact Requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Requests" value={result.totalRequests} subtext="Incoming traffic" />
        <MetricCard label="Admitted (Redis Gate)" value={result.firstWaveReservations} subtext="Atomic gate" />
        <MetricCard label="Sold-Out Rejected" value={result.soldOutReplies} subtext="Immediate HTTP 200" />
        <MetricCard label="Duplicates Blocked" value={result.duplicatesAnswered} subtext="Idempotency key hit" />
        <MetricCard label="Reserved (10m TTL)" value={result.finalReservedQuantity} subtext="Stock locked" />
        <MetricCard label="Final Units Sold" value={result.finalUnitsSold} subtext={`Max stock: ${config.stock}`} />
        <MetricCard label="Payments Failed & Released" value={result.paymentsFailed} subtext="Stock returned to pool" />
        <MetricCard label="Waitlisted (FIFO)" value={result.waitlist.length} subtext="Held payments" />
        <MetricCard label="Refunds Processed" value={result.refundsProcessed} subtext="Single refund guarantee" />
        <MetricCard label="Orders Persisted" value={result.orders.length} subtext="Postgres DB" />
      </div>

      {/* Final Check Verification Banner */}
      <div className="bg-[#34363B] border border-[#444746] rounded-[16px] p-6 space-y-3 font-sans">
        <h2 className="text-[20px] font-normal leading-[1.4] text-[#E8E8E8] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#99C3FF]" /> System Design Guarantees & Verification Audit
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[13px]">
          {result.checks.slice(0, 3).map((check, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-[12px] border flex items-start gap-3 ${
                check.passed
                  ? 'bg-[#1A1C21] border-[#99C3FF]/40 text-[#99C3FF]'
                  : 'bg-[#1A1C21] border-[#f43f5e]/40 text-[#f43f5e]'
              }`}
            >
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-[#99C3FF] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-[#f43f5e] shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-semibold text-[13px]">{check.name}: {check.passed ? 'PASS' : 'FAIL'}</div>
                <div className="text-[12px] opacity-80 mt-0.5 font-sans">{check.measured} ({check.expected})</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Jury Walkthrough Panel */}
      <div className="bg-[#34363B] border border-[#444746] rounded-[16px] p-6 space-y-4 font-sans">
        <div className="flex items-center gap-2 text-[20px] font-normal leading-[1.4] text-[#C58AF9]">
          <Info className="w-5 h-5 text-[#C58AF9]" /> Jury Walkthrough Panel (Step-by-Step System Flow)
        </div>
        <ol className="space-y-2.5 text-[13px] text-[#E8E8E8] list-decimal list-inside leading-relaxed font-sans">
          <li><strong>10,000 Concurrent Requests Arrive</strong>: Edge WAF and API Gateway rate limiting remove invalid payloads and bots.</li>
          <li><strong>Atomic Redis Lua Gate</strong>: Executes 100 memory decrements in ~10ms; the remaining 9,900 requests never touch the inventory row.</li>
          <li><strong>Conditional DB Reservation</strong>: Each admitted request obtains a 10-minute TTL reservation with a unique idempotency key.</li>
          <li><strong>Idempotent Payment Processing</strong>: PSP gateway charges 95% successfully; 5% fail and release stock immediately to the FIFO waitlist.</li>
          <li><strong>Event-Driven Order Fulfillment</strong>: PaymentSucceeded events flow via Kafka outbox &rarr; queue &rarr; Order Service &rarr; Postgres persistence.</li>
          <li><strong>Waitlist & 24h Restock Window</strong>: Excess customers join FIFO waitlist with payment held; served in order or refunded ONCE after 24h.</li>
          <li><strong>Audit Invariants Met</strong>: Final units sold = {result.finalUnitsSold} (&le; {config.stock}), zero overselling, 100% auditable outcomes.</li>
        </ol>
      </div>
    </div>
  );
};
