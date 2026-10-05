import React, { useState } from 'react';
import { Clock, RefreshCw, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { StateChain } from '../components/StateChain';

export const ReservationsTab: React.FC = () => {
  const { result } = useSimulationStore();
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);

  const BATCH_SIZE = 20;
  
  // Total customers attempting reservations (e.g. 100 total customers)
  const totalCustomers = Array.from({ length: 100 }, (_, i) => ({
    customerId: `cust_${i + 1}`,
    name: i === 0 ? 'Rahul Sharma' : i === 1 ? 'Aarav Sharma' : i === 2 ? 'Ananya Verma' : `Customer #${i + 1}`,
    batch: Math.floor(i / BATCH_SIZE),
    position: i + 1,
  }));

  const activeBatchCustomers = totalCustomers.filter(c => c.batch === currentBatchIndex);
  const waitingCustomers = totalCustomers.filter(c => c.batch > currentBatchIndex);

  const handleClearCurrentBatch = () => {
    if ((currentBatchIndex + 1) * BATCH_SIZE < totalCustomers.length) {
      setCurrentBatchIndex(prev => prev + 1);
    } else {
      setCurrentBatchIndex(0); // Reset loop
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#F8FAFC] font-mono">
              Stock Reservations & 20-Customer Batch Slot Gate
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Strict 20-slot concurrency capacity. Customers #1-20 get 15-minute active reservation slots. Customer #21+ enter 15-minute wait queue until active slots clear.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearCurrentBatch}
          className="px-4 py-2.5 rounded-[12px] bg-[#C58AF9] hover:opacity-90 text-[#1A1C21] font-mono font-bold text-[12px] flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Clear Batch #{currentBatchIndex + 1} (Release Next 20 Slots)</span>
        </button>
      </div>

      {/* 20-Slot Concurrency Batch Banner */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#334155] pb-3">
          <div className="flex items-center gap-2 text-[#38BDF8] font-bold text-[14px]">
            <Users className="w-4 h-4" /> CURRENT CONCURRENCY BATCH: #{currentBatchIndex + 1} (SLOTS 1 TO 20)
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-3 py-1 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 font-bold">
              ACTIVE SLOTS: {activeBatchCustomers.length} / 20
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              WAITING QUEUE: {waitingCustomers.length} CUSTOMERS (15-MIN DELAY)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active 20 Slots Card */}
          <div className="bg-[#1E293B] border border-[#22C55E]/40 rounded-[12px] p-4 space-y-3">
            <div className="flex items-center justify-between text-[#22C55E] font-bold text-[12px]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> ACTIVE RESERVATION SLOTS (#1 TO #20)
              </span>
              <span className="text-[10px] text-[#94A3B8]">15-MIN TTL COUNTDOWN</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              {activeBatchCustomers.map((cust) => (
                <div key={cust.customerId} className="p-2 rounded-[8px] bg-[#0F172A] border border-[#334155] text-center space-y-0.5">
                  <div className="font-bold text-[#38BDF8]">#{cust.position}</div>
                  <div className="text-[#F8FAFC] truncate text-[10px]">{cust.name}</div>
                  <div className="text-[9px] text-[#22C55E] font-mono">14m 58s TTL</div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer #21+ Waiting Queue Card */}
          <div className="bg-[#1E293B] border border-amber-500/40 rounded-[12px] p-4 space-y-3">
            <div className="flex items-center justify-between text-amber-300 font-bold text-[12px]">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" /> WAITQUEUE (SLOTS #21 TO #100)
              </span>
              <span className="text-[10px] text-amber-400">15-MINUTE TIME DELAY</span>
            </div>

            <div className="space-y-2 text-[11px] max-h-[160px] overflow-y-auto pr-1">
              {waitingCustomers.slice(0, 10).map((cust) => (
                <div key={cust.customerId} className="p-2 rounded-[8px] bg-[#0F172A] border border-[#334155] flex items-center justify-between text-[#94A3B8]">
                  <span className="font-bold text-amber-300">Customer #{cust.position} ({cust.name})</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Waiting ~15m for Batch #{cust.batch + 1} Slot
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#94A3B8] italic">
              When Batch #{currentBatchIndex + 1} completes/clears, the system automatically releases the 20 active slots to Batch #{currentBatchIndex + 2}!
            </p>
          </div>
        </div>
      </div>

      {/* State Machine Visualization */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3">
        <h2 className="text-[14px] font-semibold text-[#F8FAFC] font-mono">
          RESERVATION LIFECYCLE STATE MACHINE & FAILURE PATHS
        </h2>
        <StateChain
          states={[
            { label: 'AVAILABLE', status: 'neutral' },
            { label: 'RESERVED (15m TTL)', status: 'pending' },
            { label: 'PAYMENT_PENDING', status: 'active' },
            { label: 'CONFIRMED', status: 'success' },
            { label: 'SOLD', status: 'success' },
          ]}
        />
        <div className="pt-2 flex flex-wrap gap-4 text-[12px] font-mono">
          <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-300 px-3 py-1.5 rounded-full border border-rose-500/30">
            <span>Failure Path 1:</span> RESERVED → PAYMENT_FAILED → RELEASED (Stock Returned)
          </div>
          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-300 px-3 py-1.5 rounded-full border border-amber-500/30">
            <span>Failure Path 2:</span> RESERVED → TIMEOUT (15m Expiry) → RELEASED (Stock Returned to Pool)
          </div>
        </div>
      </div>

      {/* Reservations Active Table */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[12px]">
        <div className="flex items-center justify-between border-b border-[#334155] pb-3">
          <h2 className="text-[14px] font-semibold text-[#F8FAFC]">
            RESERVATION RECORDS ({result.reservations.length} ISSUED)
          </h2>
          <span className="text-[11px] text-[#94A3B8]">Showing first 15 records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[12px] text-[#F8FAFC]">
            <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[11px] border-b border-[#334155]">
              <tr>
                <th className="p-3">Reservation ID</th>
                <th className="p-3">Customer ID</th>
                <th className="p-3">Idempotency Key</th>
                <th className="p-3">Status</th>
                <th className="p-3">Issued At</th>
                <th className="p-3">Expires At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {result.reservations.slice(0, 15).map((res) => (
                <tr key={res.id} className="hover:bg-[#1E293B]">
                  <td className="p-3 font-bold text-[#38BDF8]">{res.id}</td>
                  <td className="p-3">{res.userId}</td>
                  <td className="p-3 text-[#94A3B8] text-[11px]">{res.idempotencyKey}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      res.status === 'CONFIRMED'
                        ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                        : res.status === 'RELEASED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="p-3 text-[#94A3B8]">T+{res.createdAt}ms</td>
                  <td className="p-3 text-[#94A3B8]">T+{res.expiresAt}ms (15m TTL)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
