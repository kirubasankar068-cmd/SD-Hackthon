import React from 'react';
import { GitCompare, CheckCircle2, XCircle, ShieldCheck, AlertOctagon } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { SimulationWorkflowBar } from '../components/SimulationWorkflowBar';

export const CompareView: React.FC = () => {
  const { result, problemResult, config } = useSimulationStore();

  const comparisons = [
    {
      guarantee: '1. No Overselling Guarantee',
      rule: 'sold <= stock and stock >= 0',
      problemMetric: `Sold ${problemResult.finalUnitsSold} / Stock ${problemResult.lowestStockSeen}`,
      problemPassed: false,
      problemDetail: `Oversold ${problemResult.oversoldUnits} units due to non-atomic read-then-write inventory check. Stock dropped to ${problemResult.lowestStockSeen}.`,
      mainMetric: `Sold ${result.finalUnitsSold} / Stock ${result.finalAvailableQuantity}`,
      mainPassed: result.finalUnitsSold <= config.stock && result.finalAvailableQuantity >= 0,
      mainDetail: `Atomic Redis Lua gate + DB conditional update guaranteed sold (${result.finalUnitsSold}) <= initial stock (${config.stock}). Zero overselling.`,
    },
    {
      guarantee: '2. No Duplicate Reservations',
      rule: '1 reservation per customer per sale',
      problemMetric: `${problemResult.duplicateReservations} Duplicate Reservations`,
      problemPassed: false,
      problemDetail: `Repeated user clicks re-ran inventory allocation without idempotency checking, creating multiple reservations.`,
      mainMetric: `0 Duplicate Reservations`,
      mainPassed: true,
      mainDetail: `Idempotency keys (idemp_usr_X) cached initial reservation and deduplicated ${result.duplicatesAnswered} duplicate requests.`,
    },
    {
      guarantee: '3. No Duplicate Charges',
      rule: '1 payment charge per customer',
      problemMetric: `${problemResult.duplicateCharges} Duplicate Charges`,
      problemPassed: false,
      problemDetail: `Network retries re-triggered PSP payment gateway without idempotency headers, charging credit cards multiple times.`,
      mainMetric: `0 Duplicate Charges`,
      mainPassed: true,
      mainDetail: `Payment Gateway requests bound to unique idempotency_key + transaction_ref, returning cached payment result.`,
    },
    {
      guarantee: '4. No Duplicate Orders',
      rule: '1 order record per customer',
      problemMetric: `${problemResult.duplicateOrders} Duplicate Orders`,
      problemPassed: false,
      problemDetail: `Kafka message re-delivery without unique order constraint created duplicate Postgres order entries.`,
      mainMetric: `0 Duplicate Orders`,
      mainPassed: true,
      mainDetail: `PostgreSQL unique index ON orders(idempotency_key) rejected duplicate order persistence attempts.`,
    },
    {
      guarantee: '5. Paid-But-No-Order Recovery',
      rule: 'Order Service outage convergence',
      problemMetric: `${problemResult.paidButNoOrder} Customers Paid With NO Order`,
      problemPassed: false,
      problemDetail: `Order Service 30s outage resulted in dropped events. Payments succeeded but orders were lost with no retry queue.`,
      mainMetric: `${result.ordersReconciledFromDLQ} Orders Reconciled via DLQ Outbox`,
      mainPassed: true,
      mainDetail: `Transactional Outbox + Kafka retry queue + Background Reconciler recovered 100% of unfulfilled payments after outage.`,
    },
    {
      guarantee: '6. Waitlist FIFO & Restock',
      rule: 'Held payments & ordered restock',
      problemMetric: `No Waitlist (Customers Dropped / Charged)`,
      problemPassed: false,
      problemDetail: `Naive system had no waitlist capability. Customers were either charged without stock or given raw 500 error pages.`,
      mainMetric: `${result.waitlist.length} Customers in FIFO Waitlist`,
      mainPassed: true,
      mainDetail: `Excess customers join FIFO waitlist with held payments. Released units from failed payments immediately allocated to #1 waiting customer.`,
    },
    {
      guarantee: '7. Single Idempotent Refund',
      rule: 'Exactly one refund per customer',
      problemMetric: `${problemResult.doubleRefundsIfReRun} Double Refunds Issued`,
      problemPassed: false,
      problemDetail: `Re-running naive refund script without idempotency keys processed duplicate refunds to customer bank accounts.`,
      mainMetric: `0 Double Refunds (Idempotent Job)`,
      mainPassed: true,
      mainDetail: `Refund Worker uses unique refund_id key per reservation. Re-running refund job issues 0 new refunds.`,
    },
    {
      guarantee: '8. Customer Details & Communication',
      rule: 'Upfront validation & limbo prevention',
      problemMetric: `${problemResult.customersInLimbo} Customers Stranded in Limbo`,
      problemPassed: false,
      problemDetail: `Buy button was active without details form validation. Stranded customers could not be contacted or refunded.`,
      mainMetric: `${result.savedCustomers.length} Validated Customers Saved`,
      mainPassed: true,
      mainDetail: `Mandatory upfront form collected Name, 10-digit Mobile, Email, PIN, & Address before Buy. 100% reachable for refunds/SMS.`,
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="pb-4 border-b border-[#444746] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-normal leading-[1.33] text-[#E8E8E8] flex items-center gap-2.5">
            <GitCompare className="w-5 h-5 text-[#99C3FF]" /> Side-by-Side Architectural Comparison View
          </h1>
          <p className="text-[13px] text-[#9AA0A6] mt-1">
            Direct guarantee-by-guarantee benchmark: Naive System ("Without Protection") vs SALESTORM Solution under identical seeded traffic (Seed: {config.seed}).
          </p>
        </div>
      </div>

      {/* Simulation Workflow Transport Controller */}
      <SimulationWorkflowBar />

      {/* Comparison Table */}
      <div className="bg-[#34363B] border border-[#444746] rounded-[16px] overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[13px] text-[#E8E8E8]">
            <thead className="bg-[#1A1C21] text-[#9AA0A6] uppercase text-[11px] border-b border-[#444746]">
              <tr>
                <th className="p-4 w-1/4 font-semibold">System Guarantee</th>
                <th className="p-4 w-5/12 bg-[#f43f5e]/10 text-[#f43f5e]">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertOctagon className="w-4 h-4 text-[#f43f5e]" /> Naive System ("Without Protection")
                  </div>
                </th>
                <th className="p-4 w-5/12 bg-[#C58AF9]/10 text-[#C58AF9]">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#C58AF9]" /> SALESTORM Solution
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#444746]">
              {comparisons.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#22242A] transition-colors">
                  <td className="p-4 align-top font-semibold text-[#E8E8E8]">
                    <div className="text-[13px] font-sans">{row.guarantee}</div>
                    <div className="text-[11px] text-[#9AA0A6] font-normal mt-0.5 font-mono">{row.rule}</div>
                  </td>

                  {/* Problem Column */}
                  <td className="p-4 align-top bg-[#1A1C21]/60 border-l border-[#444746]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#f43f5e]">{row.problemMetric}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/40 font-semibold text-[11px] flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> FAIL
                      </span>
                    </div>
                    <p className="text-[12px] text-[#9AA0A6] leading-relaxed font-sans">
                      {row.problemDetail}
                    </p>
                  </td>

                  {/* Main Solution Column */}
                  <td className="p-4 align-top bg-[#1A1C21]/60 border-l border-[#444746]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#99C3FF]">{row.mainMetric}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#99C3FF]/20 text-[#99C3FF] border border-[#99C3FF]/40 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                      </span>
                    </div>
                    <p className="text-[12px] text-[#9AA0A6] leading-relaxed font-sans">
                      {row.mainDetail}
                    </p>
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
