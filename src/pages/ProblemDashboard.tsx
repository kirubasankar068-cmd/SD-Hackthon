import { useState } from 'react';
import { AlertOctagon, Play, XCircle, AlertTriangle, ShieldOff, Zap, CreditCard, Server, RotateCcw, Clock } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { MetricCard } from '../components/MetricCard';
import { SimulationWorkflowBar } from '../components/SimulationWorkflowBar';

export const ProblemDashboard: React.FC = () => {
  const { problemResult, config, isSimulating, runProblem, updateConfig } = useSimulationStore();
  const [doubleRefundExecuted, setDoubleRefundExecuted] = useState(false);

  const handleTriggerDoubleRefund = () => {
    setDoubleRefundExecuted(true);
  };

  const currentDoubleRefunds = doubleRefundExecuted ? problemResult.duplicateCharges * 2 : problemResult.duplicateCharges;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Simulation Workflow Transport Controller */}
      <SimulationWorkflowBar />

      {/* Header Banner */}
      <div className="bg-[#34363B] border border-[#f43f5e]/50 rounded-[16px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-full bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30 shrink-0">
            <AlertOctagon className="w-6 h-6 text-[#f43f5e]" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono font-normal text-[16px] text-[#E8E8E8]">
              PROBLEM DASHBOARD ("Without Protection")
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/40 font-semibold uppercase">
                NAIVE SYSTEM
              </span>
            </div>
            <p className="text-[13px] text-[#9AA0A6] mt-1 font-sans">
              Simulating standard naive architecture: Read-then-Write check, No Idempotency Keys, No Outbox, No Waitlist, No Circuit Breaker.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={runProblem}
            disabled={isSimulating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#f43f5e] hover:opacity-90 text-white font-semibold text-[13px] transition-all cursor-pointer border border-[#f43f5e] disabled:opacity-50 font-sans"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isSimulating ? 'Running Naive Code...' : 'Run Problem Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Critical Invariant Broken Banner */}
      <div className="bg-[#34363B] border border-[#f43f5e] rounded-[16px] p-6 text-[#E8E8E8] space-y-2 font-mono">
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-[#f43f5e] shrink-0" />
          <div>
            <div className="text-[18px] font-normal leading-[1.33] text-[#f43f5e]">
              INVARIANT BROKEN: sold {problemResult.finalUnitsSold} &gt; stock {config.stock}
            </div>
            <div className="text-[13px] text-[#9AA0A6] mt-0.5 font-sans">
              CRITICAL SYSTEM FAILURE: Stock pool reached negative value ({problemResult.lowestStockSeen}). Oversold {problemResult.oversoldUnits} units.
            </div>
          </div>
        </div>
      </div>

      {/* Live Failure Counters Grid */}
      <div>
        <div className="text-[13px] font-mono font-medium uppercase tracking-wider text-[#f43f5e] mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#f43f5e]" /> Naive System Failure Live Telemetry Metrics
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Oversold Units (sold > 100)"
            value={`+${problemResult.oversoldUnits}`}
            subtext={`Stock: ${problemResult.lowestStockSeen}`}
          />
          <MetricCard
            label="Duplicate Charges"
            value={problemResult.duplicateCharges}
            subtext="No Idempotency Key"
          />
          <MetricCard
            label="Duplicate Orders"
            value={problemResult.duplicateOrders}
            subtext="Repeated Clicks"
          />
          <MetricCard
            label="Paid But No Order"
            value={problemResult.paidButNoOrder}
            subtext={config.orderOutage ? 'Outage Active (30s)' : 'Outage Off'}
          />
          <MetricCard
            label="Customers in Limbo"
            value={problemResult.customersInLimbo}
            subtext="No Phone/Email Saved"
          />
          <MetricCard
            label="DB Row Queue Depth"
            value={problemResult.dbQueueDepth}
            subtext="Row Lock Contention"
          />
          <MetricCard
            label="P95 Latency Spike"
            value={`${problemResult.dbLatencyMs} ms`}
            subtext="Target: < 200 ms"
          />
          <MetricCard
            label="Double Refunds Issued"
            value={currentDoubleRefunds}
            subtext={doubleRefundExecuted ? 'Double Refund Triggered!' : 'Click Trigger Below'}
          />
          <MetricCard
            label="Total Naive Requests"
            value={problemResult.totalRequests}
            subtext="All Hit Database Row"
          />
          <MetricCard
            label="Total Sold Quantity"
            value={problemResult.finalUnitsSold}
            subtext={`Stock limit: ${config.stock}`}
          />
        </div>
      </div>

      {/* Individual Failure Trigger Buttons */}
      <div className="bg-[#34363B] border border-[#444746] rounded-[16px] p-6 space-y-4 font-sans">
        <h2 className="text-[20px] font-normal leading-[1.4] text-[#E8E8E8] flex items-center gap-2">
          <ShieldOff className="w-5 h-5 text-[#f43f5e]" /> Interactive Failure Injection Controls (Trigger Individually)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px] font-mono">
          <button
            onClick={() => runProblem()}
            className="p-4 rounded-[12px] bg-[#1A1C21] hover:bg-[#22242A] border border-[#f43f5e]/40 text-[#E8E8E8] text-left transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="font-semibold flex items-center justify-between">
              <span>Trigger Race Condition</span>
              <Zap className="w-4 h-4 text-[#f43f5e]" />
            </div>
            <div className="text-[12px] text-[#9AA0A6] mt-2 font-sans">
              Check stock read-then-write (SELECT then UPDATE without lock). Oversells stock!
            </div>
          </button>

          <button
            onClick={() => updateConfig({ duplicateRate: config.duplicateRate === 2 ? 10 : 2 })}
            className="p-4 rounded-[12px] bg-[#1A1C21] hover:bg-[#22242A] border border-[#444746] text-[#E8E8E8] text-left transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="font-semibold flex items-center justify-between">
              <span>Toggle Duplicate Clicks</span>
              <CreditCard className="w-4 h-4 text-[#99C3FF]" />
            </div>
            <div className="text-[12px] text-[#9AA0A6] mt-2 font-sans">
              Duplicates: {config.duplicateRate}%. Click to switch (2% &harr; 10%). No idempotency key!
            </div>
          </button>

          <button
            onClick={() => updateConfig({ orderOutage: !config.orderOutage })}
            className="p-4 rounded-[12px] bg-[#1A1C21] hover:bg-[#22242A] border border-[#444746] text-[#E8E8E8] text-left transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="font-semibold flex items-center justify-between">
              <span>Toggle Order Outage (30s)</span>
              <Server className="w-4 h-4 text-[#C58AF9]" />
            </div>
            <div className="text-[12px] text-[#9AA0A6] mt-2 font-sans">
              Outage: {config.orderOutage ? 'ACTIVE (Down)' : 'OFF (Up)'}. Leaves paid customers stranded!
            </div>
          </button>

          <button
            onClick={handleTriggerDoubleRefund}
            className="p-4 rounded-[12px] bg-[#1A1C21] hover:bg-[#22242A] border border-[#f43f5e]/40 text-[#E8E8E8] text-left transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="font-semibold flex items-center justify-between">
              <span>Trigger Naive Refund Job</span>
              <RotateCcw className="w-4 h-4 text-[#f43f5e]" />
            </div>
            <div className="text-[12px] text-[#9AA0A6] mt-2 font-sans">
              Re-running refund job without idempotency issues DOUBLE refunds to customers!
            </div>
          </button>
        </div>
      </div>

      {/* Failed Design Rules Audit List */}
      <div className="bg-[#34363B] border border-[#444746] rounded-[16px] p-6 space-y-4 font-sans">
        <h2 className="text-[20px] font-normal leading-[1.4] text-[#f43f5e] flex items-center gap-2">
          <XCircle className="w-5 h-5 text-[#f43f5e]" /> Detailed Breakdown of Failed Design Rules
        </h2>
        <div className="space-y-3 font-mono text-[13px]">
          {problemResult.failedRules.map((rule, idx) => (
            <div key={idx} className="p-4 rounded-[12px] bg-[#1A1C21] border border-[#f43f5e]/30 space-y-1">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-[#E8E8E8]">{rule.ruleId}: {rule.title}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#f43f5e]/20 text-[#f43f5e] font-semibold text-[11px]">
                  FAILED
                </span>
              </div>
              <p className="text-[12px] text-[#9AA0A6] leading-relaxed font-sans">
                {rule.reason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Naive Log Timeline */}
      <div className="bg-[#34363B] border border-[#444746] rounded-[16px] p-6 space-y-3 font-mono text-[13px]">
        <h2 className="text-[20px] font-normal leading-[1.4] text-[#E8E8E8] font-sans flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#9AA0A6]" /> Problem System Diagnostic Execution Log
        </h2>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
          {problemResult.logs.map((log) => (
            <div key={log.id} className="p-3 rounded-[12px] bg-[#1A1C21] border border-[#444746] text-[#E8E8E8] flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[#f43f5e] font-semibold">[{log.type}]</span>
                <span className="font-sans text-[13px] text-[#9AA0A6]">{log.message}</span>
              </div>
              <span className="text-[11px] text-[#9AA0A6] shrink-0 font-mono">{log.traceId}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
