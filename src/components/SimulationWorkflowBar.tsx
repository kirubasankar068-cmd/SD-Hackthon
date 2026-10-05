import React from 'react';
import { Play, Pause, RotateCcw, FastForward, SkipForward, Activity, ShieldCheck, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export const SimulationWorkflowBar: React.FC = () => {
  const {
    isSimulating,
    isPaused,
    simProgress,
    simSpeed,
    currentStageName,
    config,
    result,
    problemResult,
    startDynamicSimulation,
    pauseDynamicSimulation,
    resumeDynamicSimulation,
    stepDynamicSimulation,
    resetDynamicSimulation,
    setSimSpeed,
    jumpToProgress,
  } = useSimulationStore();

  const processedRequests = Math.floor((config.users * simProgress) / 100);

  const stages = [
    { id: 'INGESTION', label: '1. Ingestion', range: [0, 20] },
    { id: 'LUA_GATE', label: '2. Lua Gate (Stock)', range: [20, 40] },
    { id: 'IDEMPOTENCY', label: '3. Idempotency', range: [40, 60] },
    { id: 'PAYMENTS', label: '4. Payments', range: [60, 75] },
    { id: 'OUTBOX', label: '5. Outbox Queue', range: [75, 90] },
    { id: 'WAITLIST', label: '6. FIFO Waitlist', range: [90, 100] },
  ];

  // Dynamic Problem -> Solution Mapping per active stage
  const getProblemSolutionCallout = () => {
    if (simProgress < 20) {
      return {
        problem: '10,000 unthrottled concurrent requests hitting single DB row (Queue depth: ' + problemResult.dbQueueDepth + ')',
        solution: 'Upfront customer detail validation & edge ingestion throttling',
        solved: true,
      };
    }
    if (simProgress < 40) {
      return {
        problem: 'Naive Read-then-Write oversells stock to ' + problemResult.finalUnitsSold + ' units (Stock: ' + problemResult.lowestStockSeen + ')',
        solution: 'Atomic Redis Lua DECR Gate guarantees sold (' + result.finalSoldQuantity + ') <= stock (' + config.stock + ')',
        solved: true,
      };
    }
    if (simProgress < 60) {
      return {
        problem: 'Repeated client clicks cause ' + problemResult.duplicateCharges + ' duplicate charges & duplicate orders',
        solution: 'Redis Idempotency Keys (idemp_usr_X) deduplicate ' + result.duplicatesAnswered + ' repeat requests',
        solved: true,
      };
    }
    if (simProgress < 75) {
      return {
        problem: 'Payment failures leave stock locked or drop customers without recovery',
        solution: 'Payment failure releases stock unit to #1 FIFO Waitlist customer (' + result.releasedAndReserved + ' re-reserved)',
        solved: true,
      };
    }
    if (simProgress < 90) {
      return {
        problem: config.orderOutage
          ? '30s Order Service outage drops ' + problemResult.paidButNoOrder + ' paid orders permanently'
          : 'Order Service failures drop unfulfilled payments',
        solution: 'Transactional Outbox + Kafka + DLQ Reconciler recovers 100% of paid orders (' + result.ordersReconciledFromDLQ + ' reconciled)',
        solved: true,
      };
    }
    return {
      problem: 'Re-running naive refund job issues ' + problemResult.doubleRefundsIfReRun + ' double refunds to customer bank accounts',
      solution: 'Idempotent Refund Worker index ensures exactly 0 double refunds on re-runs',
      solved: true,
    };
  };

  const callout = getProblemSolutionCallout();

  return (
    <div className="bg-[#34363B] border border-[#444746] rounded-[16px] p-4 sm:p-5 text-[#E8E8E8] font-sans space-y-4 shadow-none mb-6 max-w-full overflow-hidden">
      {/* Header & Status Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/40 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-mono text-[14px] text-[#E8E8E8] font-semibold flex items-center gap-2 flex-wrap">
              <span>DYNAMIC STEP-BY-STEP SIMULATION WORKFLOW (10ms TICKS)</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/40 font-mono uppercase">
                {simProgress === 100 ? 'COMPLETED' : isSimulating ? (isPaused ? 'PAUSED' : 'RUNNING LIVE') : 'READY'}
              </span>
            </div>
            <div className="text-[12px] text-[#9AA0A6] mt-0.5 font-sans">
              <span>{currentStageName}</span>
            </div>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          {!isSimulating || isPaused ? (
            <button
              onClick={() => {
                if (isPaused) resumeDynamicSimulation();
                else startDynamicSimulation();
              }}
              className="px-4 py-1.5 rounded-full bg-[#C58AF9] hover:opacity-90 text-[#1A1C21] font-mono font-semibold text-[12px] flex items-center gap-1.5 transition-all cursor-pointer border border-[#C58AF9]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPaused ? 'Resume' : simProgress === 100 ? 'Re-Run Simulation' : 'Start Simulation'}</span>
            </button>
          ) : (
            <button
              onClick={pauseDynamicSimulation}
              className="px-4 py-1.5 rounded-full bg-[#99C3FF] hover:opacity-90 text-[#1A1C21] font-mono font-semibold text-[12px] flex items-center gap-1.5 transition-all cursor-pointer border border-[#99C3FF]"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={stepDynamicSimulation}
            disabled={simProgress >= 100}
            className="px-3 py-1.5 rounded-full bg-[#22242A] border border-[#444746] text-[#E8E8E8] hover:border-[#C58AF9] font-mono text-[12px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
            title="Advance simulation by 1 stock unit"
          >
            <SkipForward className="w-3.5 h-3.5 text-[#C58AF9]" />
            <span>Step +1 Unit</span>
          </button>

          <button
            onClick={resetDynamicSimulation}
            className="px-3 py-1.5 rounded-full bg-[#22242A] border border-[#444746] text-[#E8E8E8] hover:border-[#C58AF9] font-mono text-[12px] flex items-center gap-1 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#9AA0A6]" />
            <span>Reset (0 Units)</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#1A1C21] border border-[#444746] rounded-full px-2 py-0.5 font-mono text-[11px]">
            <FastForward className="w-3 h-3 text-[#C58AF9]" />
            {[0.25, 0.5, 1, 2, 100].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-1.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                  simSpeed === s ? 'bg-[#C58AF9] text-[#1A1C21] font-bold' : 'text-[#9AA0A6] hover:text-white'
                }`}
              >
                {s === 100 ? 'Instant' : `${s}x`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar & Slider */}
      <div className="space-y-1.5 font-mono text-[12px]">
        <div className="flex items-center justify-between text-[#9AA0A6]">
          <span>
            Requests Streamed: <strong className="text-[#E8E8E8]">{processedRequests.toLocaleString()}</strong> / {config.users.toLocaleString()}
          </span>
          <span>
            Progress: <strong className="text-[#C58AF9]">{simProgress.toFixed(0)}%</strong>
          </span>
        </div>
        <div className="relative w-full h-3 bg-[#1A1C21] border border-[#444746] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C58AF9] to-[#99C3FF] transition-all duration-75 ease-out"
            style={{ width: `${simProgress}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={simProgress}
            onChange={(e) => jumpToProgress(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
      </div>

      {/* Workflow Stage Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 font-mono text-[11px]">
        {stages.map((stg) => {
          const isActive = simProgress >= stg.range[0] && simProgress <= stg.range[1];
          const isDone = simProgress > stg.range[1];

          return (
            <div
              key={stg.id}
              onClick={() => jumpToProgress(stg.range[1])}
              className={`p-2 rounded-[12px] border transition-all cursor-pointer text-center ${
                isActive
                  ? 'bg-[#C58AF9]/20 border-[#C58AF9] text-[#E8E8E8] font-bold shadow-xs'
                  : isDone
                  ? 'bg-[#99C3FF]/10 border-[#99C3FF]/40 text-[#99C3FF]'
                  : 'bg-[#1A1C21] border-[#444746] text-[#5E5E5E]'
              }`}
            >
              <div className="truncate">{stg.label}</div>
              <div className="text-[9px] mt-0.5 opacity-70">
                {isDone ? '✓ DONE' : isActive ? '● ACTIVE' : 'WAITING'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Problem vs Solution Resolved Callout Card */}
      <div className="bg-[#1A1C21] border border-[#444746] rounded-[12px] p-3 font-mono text-[12px] space-y-1.5">
        <div className="flex items-center gap-2 text-[#f43f5e] text-[11px] font-semibold uppercase">
          <AlertTriangle className="w-3.5 h-3.5" /> NAIVE SYSTEM FAILURE IN THIS STAGE:
        </div>
        <div className="text-[#9AA0A6] pl-5">{callout.problem}</div>
        
        <div className="flex items-center gap-2 text-[#99C3FF] text-[11px] font-semibold uppercase pt-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#99C3FF]" /> SALESTORM SYSTEM ARCHITECTURAL FIX:
        </div>
        <div className="text-[#E8E8E8] font-medium pl-5">{callout.solution}</div>
      </div>

      {/* Real-Time Dual Engine Metrics Comparison Pill */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-[#444746] font-mono text-[12px]">
        {/* Main System Status */}
        <div className="bg-[#1A1C21] border border-[#99C3FF]/30 rounded-[12px] p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#99C3FF]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-semibold">MAIN SYSTEM (PROTECTED)</span>
          </div>
          <div className="text-right">
            <span className="text-[#E8E8E8] font-semibold">
              Sold: {result.finalSoldQuantity} / {config.stock}
            </span>
            <span className="text-[#99C3FF] ml-2 text-[11px]">
              Available: {result.finalAvailableQuantity}
            </span>
          </div>
        </div>

        {/* Problem System Status */}
        <div className="bg-[#1A1C21] border border-[#f43f5e]/30 rounded-[12px] p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#f43f5e]">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span className="font-semibold">NAIVE SYSTEM (BROKEN)</span>
          </div>
          <div className="text-right">
            <span className="text-[#E8E8E8] font-semibold">
              Sold: {problemResult.finalUnitsSold} / {config.stock}
            </span>
            <span className="text-[#f43f5e] ml-2 text-[11px]">
              Stock: {problemResult.lowestStockSeen} ({problemResult.oversoldUnits > 0 ? `+${problemResult.oversoldUnits} oversold` : 'OK'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
