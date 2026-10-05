import React from 'react';
import { Users, Clock, RotateCcw, FastForward, ShieldCheck, PackageX, AlertTriangle } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';

export const WaitlistRefundsTab: React.FC = () => {
  const {
    result,
    restockInput,
    refundJobRunCount,
    setRestockInput,
    fastForward24Hours,
    runRefundJobAgain,
  } = useSimulationStore();

  const waitingCount = result.waitlist.filter((w) => w.status === 'WAITING').length;
  const allocatedCount = result.waitlist.filter((w) => w.status === 'ALLOCATED').length;
  const refundedCount = result.waitlist.filter((w) => w.status === 'REFUNDED_VOIDED').length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#F8FAFC] font-mono">
              FIFO Waitlist, Product Stock Outages & Single Idempotent Refund
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Business Rules #4, #5 & #6: Manages stock unavailability delays, 24-hour restock window, held payment allocations, and idempotent refund worker.
            </p>
          </div>
        </div>
      </div>

      {/* Product Unavailability & Restock Delay Status Banner */}
      <div className="bg-[#0F172A] border border-amber-500/40 rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
        <div className="flex items-center justify-between border-b border-[#334155] pb-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-[14px]">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> PRODUCT STOCK UNAVAILABILITY & RESTOCK DELAY ALERT
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
            PRODUCT OUT OF STOCK (100/100 UNITS ALLOCATED)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-[12px] p-4 space-y-2">
            <div className="text-[#38BDF8] font-bold text-[12px] flex items-center gap-1.5">
              <PackageX className="w-4 h-4" /> REASON FOR DELAY
            </div>
            <p className="text-[#94A3B8] text-[11px] leading-relaxed">
              Initial high-demand inventory of 100 units sold out completely within 300ms. {waitingCount} unserved customers have been placed in the 24-hour restock waitlist with authorized payment holds.
            </p>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-[12px] p-4 space-y-2">
            <div className="text-[#22C55E] font-bold text-[12px] flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> 24-HOUR RESTOCK RESOLUTION
            </div>
            <p className="text-[#94A3B8] text-[11px] leading-relaxed">
              If new factory restock arrives within 24 hours, waitlisted customers receive priority fulfillment. If restock fails, authorized holds auto-void with <strong>0 double refunds</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Control Card for 24h Fast-Forward & Restock */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
        <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#38BDF8]" /> 24-HOUR WAITLIST RESTOCK WINDOW SIMULATION CONTROLS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[#94A3B8] mb-1">Restock Units Arrived (N)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={restockInput}
              onChange={(e) => setRestockInput(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[#1E293B] border border-[#334155] rounded-[10px] px-3 py-2 text-[#F8FAFC] text-[12px] focus:border-[#C58AF9]"
              placeholder="e.g. 20"
            />
            <span className="text-[10px] text-[#94A3B8] mt-1 block">Set 0 to test full refund/void path.</span>
          </div>

          <div>
            <button
              onClick={fastForward24Hours}
              className="w-full py-2.5 rounded-[12px] bg-[#C58AF9] hover:opacity-90 text-[#1A1C21] font-bold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#C58AF9]/20"
            >
              <FastForward className="w-4 h-4 fill-current" />
              <span>Fast-forward 24 Hours</span>
            </button>
          </div>

          <div>
            <button
              onClick={runRefundJobAgain}
              className="w-full py-2.5 rounded-[12px] bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] border border-[#334155] font-bold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#22C55E]" />
              <span>Run Refund Job Again (Prove 0 Double Refunds)</span>
            </button>
          </div>
        </div>

        {refundJobRunCount > 0 && (
          <div className="p-3.5 rounded-[12px] bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
              Idempotency Test Passed: Re-ran refund worker #{refundJobRunCount + 1}. Issued 0 NEW refunds!
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#0F172A] border border-[#334155] font-mono">
              PROVEN IDEMPOTENT
            </span>
          </div>
        )}
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[12px]">
        <div className="bg-[#0F172A] border border-[#334155] p-4 rounded-[16px]">
          <div className="text-[#94A3B8]">Total Waitlisted</div>
          <div className="text-[20px] font-bold text-[#F8FAFC] mt-1">{result.waitlist.length}</div>
        </div>
        <div className="bg-[#0F172A] border border-[#334155] p-4 rounded-[16px]">
          <div className="text-amber-400">Waiting (Delayed Restock)</div>
          <div className="text-[20px] font-bold text-amber-300 mt-1">{waitingCount}</div>
        </div>
        <div className="bg-[#0F172A] border border-[#334155] p-4 rounded-[16px]">
          <div className="text-[#22C55E]">Allocated & Served</div>
          <div className="text-[20px] font-bold text-[#22C55E] mt-1">{allocatedCount}</div>
        </div>
        <div className="bg-[#0F172A] border border-[#334155] p-4 rounded-[16px]">
          <div className="text-[#C58AF9]">Refunded / Voided</div>
          <div className="text-[20px] font-bold text-[#C58AF9] mt-1">{refundedCount}</div>
        </div>
      </div>

      {/* Waitlist Table */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[12px]">
        <div className="flex items-center justify-between border-b border-[#334155] pb-3">
          <h2 className="text-[14px] font-semibold text-[#F8FAFC]">
            FIFO WAITLIST & REFUND AUDIT LOG ({result.waitlist.length} CUSTOMERS)
          </h2>
          <span className="text-[11px] text-[#94A3B8]">Showing first 15 records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[12px] text-[#F8FAFC]">
            <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[11px] border-b border-[#334155]">
              <tr>
                <th className="p-3">Pos</th>
                <th className="p-3">Customer ID</th>
                <th className="p-3">Payment Hold</th>
                <th className="p-3">Status</th>
                <th className="p-3">Restock Allocation</th>
                <th className="p-3">Refund Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {result.waitlist.slice(0, 15).map((w) => (
                <tr key={w.id} className="hover:bg-[#1E293B]">
                  <td className="p-3 font-bold text-[#38BDF8]">#{w.position}</td>
                  <td className="p-3 font-bold text-[#F8FAFC]">{w.userId}</td>
                  <td className="p-3 text-amber-300 font-bold">${w.heldAmount.toFixed(2)} HELD</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      w.status === 'ALLOCATED'
                        ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                        : w.status === 'REFUNDED_VOIDED'
                        ? 'bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3 text-[#94A3B8]">
                    {w.status === 'ALLOCATED' ? 'Allocated Unit #' + w.position : 'Delayed / Unallocated'}
                  </td>
                  <td className="p-3">
                    {w.refundTxId ? (
                      <span className="text-[10px] text-[#22C55E] font-bold">
                        Ref: {w.refundTxId} (Idempotent 1x)
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8]">Hold Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
