import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Terminal, Play, Clock, Zap } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export const FailureSimulatorTab: React.FC = () => {
  const { result, runScenario } = useSimulationStore();
  const [logFilter, setLogFilter] = useState<string>('');

  const scenarios = [
    {
      name: '5% Payment Failures',
      timing: 'Triggers at T+1500ms during PSP charge execution',
      description: 'Simulates 5% card decline rate with automatic stock release back to Redis pool.',
      overrides: { paymentFailRate: 5, duplicateRate: 0, orderOutage: false, stock: 100, users: 10000 },
    },
    {
      name: '2% Duplicate Requests',
      timing: 'Triggers at T+10ms when user clicks Buy Now multiple times',
      description: 'Simulates network retries & double clicks. Verifies idempotency key cache hits.',
      overrides: { paymentFailRate: 0, duplicateRate: 2, orderOutage: false, stock: 100, users: 10000 },
    },
    {
      name: 'Order Service Down (30s)',
      timing: 'Triggers at T+3000ms after payment completion',
      description: 'Simulates Order DB crash. Payments succeed -> Kafka queues events -> Reconciler fixes orders.',
      overrides: { paymentFailRate: 5, duplicateRate: 2, orderOutage: true, stock: 100, users: 10000 },
    },
    {
      name: 'Payment Gateway Down',
      timing: 'Triggers at T+500ms when PSP error rate exceeds 50%',
      description: 'Simulates 50% PSP failure rate. Trips Circuit Breaker OPEN to fail fast.',
      overrides: { paymentFailRate: 50, duplicateRate: 0, orderOutage: false, stock: 100, users: 10000 },
    },
    {
      name: 'Inventory Reaches Zero',
      timing: 'Triggers at T+300ms when stock counter drops from 1 -> 0',
      description: 'Simulates zero stock scenario. Verifies all remaining requests return fast SOLD_OUT.',
      overrides: { stock: 0, users: 10000, paymentFailRate: 0, duplicateRate: 0, orderOutage: false },
    },
    {
      name: 'Traffic x50 Spikes',
      timing: 'Triggers at T+0ms flash sale opening burst',
      description: 'Simulates 50,000 concurrent requests against 100 units. Verifies zero overselling under heavy load.',
      overrides: { users: 50000, stock: 100, paymentFailRate: 5, duplicateRate: 2, orderOutage: false },
    },
  ];

  const filteredLogs = result.logs.filter((log) =>
    log.message.toLowerCase().includes(logFilter.toLowerCase()) ||
    log.type.toLowerCase().includes(logFilter.toLowerCase()) ||
    log.traceId.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#F8FAFC] font-mono">
              Chaos & Failure Timeline Simulator
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Shows exact timing windows (T+0ms to T+5000ms) when system failures, card declines, outages, and retries occur.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Scenario Buttons with Timing Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {scenarios.map((sc, idx) => (
          <button
            key={idx}
            onClick={() => runScenario(sc.name, sc.overrides)}
            className="p-4 rounded-[16px] bg-[#0F172A] border border-[#334155] hover:border-amber-500/50 hover:bg-[#1E293B] text-left transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between font-mono text-[13px] font-bold text-[#F8FAFC] group-hover:text-amber-300">
              <span>{sc.name}</span>
              <Play className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-amber-400" />
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>TIMING: {sc.timing}</span>
            </div>

            <p className="text-[11px] text-[#94A3B8] leading-relaxed font-mono">
              {sc.description}
            </p>
          </button>
        ))}
      </div>

      {/* Failure Occurrence Timeline Map */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
        <div className="flex items-center justify-between border-b border-[#334155] pb-3">
          <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#38BDF8]" /> SIMULATED SYSTEM FAILURE TIMELINE MAP
          </h2>
          <span className="text-[11px] text-[#94A3B8]">SIMULATION EXECUTION TRAJECTORY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
          <div className="p-3.5 rounded-[12px] bg-[#1E293B] border border-blue-500/30 space-y-1">
            <div className="font-bold text-[#38BDF8]">T+0ms to T+100ms</div>
            <div className="text-[#F8FAFC]">Flash Sale Ingestion</div>
            <div className="text-[10px] text-[#94A3B8]">10,000 requests hit API Gateway. Read-write race avoided by Lua gate.</div>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#1E293B] border border-amber-500/30 space-y-1">
            <div className="font-bold text-amber-300">T+1500ms</div>
            <div className="text-[#F8FAFC]">5% Payment Failures</div>
            <div className="text-[10px] text-[#94A3B8]">5 declined cards. Stock automatically restored to Redis pool.</div>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#1E293B] border border-rose-500/30 space-y-1">
            <div className="font-bold text-rose-400">T+3000ms</div>
            <div className="text-[#F8FAFC]">30s Order DB Outage</div>
            <div className="text-[10px] text-[#94A3B8]">Order DB crashes. Payment events buffered safely on Kafka disk.</div>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#1E293B] border border-[#22C55E]/30 space-y-1">
            <div className="font-bold text-[#22C55E]">T+5000ms</div>
            <div className="text-[#F8FAFC]">Reconciler Recovery</div>
            <div className="text-[10px] text-[#94A3B8]">Order Service restarts. Reconciler sweeps DLQ and recovers 100% orders.</div>
          </div>
        </div>
      </div>

      {/* Active Verification Checks Banner */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[12px]">
        <h2 className="text-[14px] font-semibold text-[#F8FAFC]">
          INTEGRITY CHECKS POST SCENARIO RUN ({result.config.scenarioName || 'Default Run'})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.checks.map((chk, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-[12px] border flex items-start gap-2.5 ${
                chk.passed
                  ? 'bg-[#22C55E]/15 border-[#22C55E]/30 text-[#22C55E]'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {chk.passed ? (
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">{chk.name}: {chk.passed ? 'PASS' : 'FAIL'}</div>
                <div className="text-[11px] opacity-90 mt-0.5">{chk.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Log Terminal */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[12px]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#334155] pb-3">
          <div className="flex items-center gap-2 text-[#38BDF8] font-bold">
            <Terminal className="w-4 h-4" /> LIVE SYSTEM LOGS ({filteredLogs.length} EVENTS)
          </div>
          <input
            type="text"
            placeholder="Filter logs by keyword..."
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            className="bg-[#1E293B] border border-[#334155] rounded-[10px] px-3 py-1 text-[#F8FAFC] text-[11px] focus:border-[#C58AF9] w-full sm:w-64"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-1 font-mono text-[11px] bg-[#05070E] p-3 rounded-[12px] border border-[#334155] custom-scrollbar">
          {filteredLogs.slice(0, 50).map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#94A3B8] shrink-0">T+{log.timestamp}ms</span>
              <span className={`shrink-0 font-bold ${
                log.type.includes('FAIL') || log.type.includes('OUTAGE') ? 'text-rose-400' : log.type.includes('WAITLIST') || log.type.includes('BLOCKED') ? 'text-amber-300' : 'text-[#38BDF8]'
              }`}>
                [{log.type}]
              </span>
              <span className="text-[#F8FAFC]">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
