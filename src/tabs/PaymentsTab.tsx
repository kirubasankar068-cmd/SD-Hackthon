import React, { useState } from 'react';
import { CreditCard, ShieldAlert, Cpu, CheckCircle2, QrCode, Smartphone, Truck, ShieldCheck, Copy, Check } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { CodeBlock } from '../components/CodeBlock';

export const PaymentsTab: React.FC = () => {
  const { result } = useSimulationStore();
  const [paymentMode, setPaymentMode] = useState<'vpa' | 'qr'>('qr');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('gpay');
  const [customUpiId, setCustomUpiId] = useState<string>('rahul.sharma@upi');
  const [paymentSuccessDemo, setPaymentSuccessDemo] = useState<boolean>(false);
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);

  const circuitBreakerStatus = result.paymentsFailed > 10 ? 'HALF_OPEN' : 'CLOSED';

  const handleTestUpiPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSuccessDemo(true);
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText('salestorm.flash@upi');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#F8FAFC] font-mono">
              UPI Instant Payment Engine & Dynamic QR Scanner
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Supports Google Pay, PhonePe, Paytm, BHIM, and Scan & Pay UPI QR Code. Guarantees 5-day delivery fulfillment for all paid orders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#22C55E]/15 border border-[#22C55E]/30 px-3.5 py-1.5 rounded-full text-[#22C55E] text-[12px] font-mono font-bold">
          <Truck className="w-4 h-4" />
          <span>ESTIMATED DELIVERY: 5 DAYS</span>
        </div>
      </div>

      {/* UPI Payment Gateway & QR Code Scanner Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPI Gateway & QR Scanner Card */}
        <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
          <div className="flex items-center justify-between border-b border-[#334155] pb-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#38BDF8]" /> UPI PAYMENT OPTIONS & INSTANT SCANNER
            </h2>
            <div className="flex items-center gap-1 bg-[#1E293B] p-1 rounded-[10px] border border-[#334155]">
              <button
                onClick={() => setPaymentMode('qr')}
                className={`px-3 py-1 rounded-[8px] font-bold text-[11px] transition-all cursor-pointer ${
                  paymentMode === 'qr'
                    ? 'bg-[#C58AF9] text-[#1A1C21]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Scan QR Code
              </button>
              <button
                onClick={() => setPaymentMode('vpa')}
                className={`px-3 py-1 rounded-[8px] font-bold text-[11px] transition-all cursor-pointer ${
                  paymentMode === 'vpa'
                    ? 'bg-[#C58AF9] text-[#1A1C21]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                UPI ID / App
              </button>
            </div>
          </div>

          {paymentMode === 'qr' ? (
            /* QR CODE PAYMENT DISPLAY */
            <div className="space-y-4 text-center">
              <div className="text-[#94A3B8] text-[12px]">
                Scan with any UPI App (<strong className="text-[#38BDF8]">GPay, PhonePe, Paytm, BHIM, Cred</strong>)
              </div>

              {/* Dynamic Styled QR Code Block */}
              <div className="flex flex-col items-center justify-center p-5 bg-[#FFFFFF] border-4 border-[#C58AF9] rounded-[20px] max-w-[240px] mx-auto shadow-lg space-y-2">
                <div className="text-[11px] font-bold text-[#0F172A] tracking-wider uppercase font-mono">
                  SALESTORM FLASH SALE
                </div>
                {/* SVG Vector QR Code Graphic */}
                <div className="w-44 h-44 bg-[#0F172A] p-2.5 rounded-[12px] flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-[#F8FAFC]">
                    {/* Outer Position Markers */}
                    <rect x="0" y="0" width="30" height="30" rx="4" fill="#F8FAFC" />
                    <rect x="5" y="5" width="20" height="20" rx="2" fill="#0F172A" />
                    <rect x="10" y="10" width="10" height="10" rx="1" fill="#C58AF9" />

                    <rect x="70" y="0" width="30" height="30" rx="4" fill="#F8FAFC" />
                    <rect x="75" y="5" width="20" height="20" rx="2" fill="#0F172A" />
                    <rect x="80" y="10" width="10" height="10" rx="1" fill="#C58AF9" />

                    <rect x="0" y="70" width="30" height="30" rx="4" fill="#F8FAFC" />
                    <rect x="5" y="75" width="20" height="20" rx="2" fill="#0F172A" />
                    <rect x="10" y="80" width="10" height="10" rx="1" fill="#C58AF9" />

                    {/* Data Pattern Modules */}
                    <rect x="35" y="5" width="10" height="10" fill="#38BDF8" />
                    <rect x="50" y="5" width="10" height="10" fill="#F8FAFC" />
                    <rect x="35" y="20" width="15" height="10" fill="#F8FAFC" />

                    <rect x="5" y="35" width="10" height="10" fill="#F8FAFC" />
                    <rect x="20" y="35" width="15" height="15" fill="#38BDF8" />
                    <rect x="40" y="35" width="20" height="10" fill="#F8FAFC" />
                    <rect x="65" y="35" width="15" height="15" fill="#C58AF9" />

                    <rect x="5" y="50" width="10" height="15" fill="#C58AF9" />
                    <rect x="40" y="50" width="15" height="15" fill="#22C55E" />
                    <rect x="60" y="55" width="15" height="10" fill="#F8FAFC" />
                    <rect x="80" y="50" width="15" height="15" fill="#38BDF8" />

                    <rect x="35" y="70" width="15" height="10" fill="#F8FAFC" />
                    <rect x="55" y="70" width="10" height="10" fill="#C58AF9" />
                    <rect x="70" y="75" width="25" height="20" fill="#22C55E" />
                  </svg>
                </div>
                <div className="text-[13px] font-extrabold text-[#0F172A] font-mono">
                  ₹24,999.00 ($299.99)
                </div>
              </div>

              {/* Merchant VPA & Copy Button */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-[#94A3B8]">
                <span>UPI VPA: <strong className="text-[#F8FAFC]">salestorm.flash@upi</strong></span>
                <button
                  onClick={handleCopyVpa}
                  className="p-1 rounded bg-[#1E293B] border border-[#334155] hover:text-[#C58AF9] transition-all cursor-pointer"
                  title="Copy VPA"
                >
                  {copiedVpa ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                onClick={() => setPaymentSuccessDemo(true)}
                className="w-full py-3 rounded-[12px] bg-[#22C55E] hover:opacity-90 text-[#1A1C21] font-bold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#22C55E]/20"
              >
                <QrCode className="w-4 h-4" />
                <span>Simulate Scan & Instant Payment Success</span>
              </button>
            </div>
          ) : (
            /* UPI APP / VPA DIRECT FORM */
            <div className="space-y-3">
              <label className="block text-[#94A3B8]">Select Preferred Instant UPI App</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'gpay', label: 'Google Pay' },
                  { id: 'phonepe', label: 'PhonePe' },
                  { id: 'paytm', label: 'Paytm UPI' },
                  { id: 'bhim', label: 'BHIM UPI' },
                ].map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedUpiApp(app.id)}
                    className={`p-2.5 rounded-[12px] border text-center font-bold transition-all cursor-pointer ${
                      selectedUpiApp === app.id
                        ? 'bg-[#C58AF9] text-[#1A1C21] border-[#C58AF9] shadow-sm'
                        : 'bg-[#1E293B] text-[#94A3B8] border-[#334155] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <div className="text-[11px]">{app.label}</div>
                  </button>
                ))}
              </div>

              <form onSubmit={handleTestUpiPayment} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[#94A3B8] mb-1">Enter UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={customUpiId}
                    onChange={(e) => setCustomUpiId(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#334155] rounded-[10px] px-3 py-2 text-[#F8FAFC] text-[12px] focus:border-[#C58AF9]"
                    placeholder="rahul.sharma@upi"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-[12px] bg-[#22C55E] hover:opacity-90 text-[#1A1C21] font-bold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#22C55E]/20"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Pay ₹24,999 via {selectedUpiApp.toUpperCase()} & Confirm 5-Day Delivery</span>
                </button>
              </form>
            </div>
          )}

          {paymentSuccessDemo && (
            <div className="p-4 rounded-[12px] bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-[13px]">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> UPI PAYMENT CONFIRMED & VERIFIED!
              </div>
              <div>UPI Ref ID: <strong className="text-[#F8FAFC]">UPI_QR_99428172</strong></div>
              <div>Merchant: <strong className="text-[#F8FAFC]">SALESTORM TECH PVT LTD</strong></div>
              <div>Estimated Delivery: <strong className="text-[#F8FAFC]">Within 5 Days (Oct 10, 2026)</strong></div>
            </div>
          )}
        </div>

        {/* 5-Day Guaranteed Delivery Policy Card */}
        <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
          <div className="flex items-center justify-between border-b border-[#334155] pb-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#22C55E]" /> 5-DAY EXPRESS DELIVERY GUARANTEE POLICY
            </h2>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-[12px] p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#38BDF8] font-bold text-[13px]">
              <ShieldCheck className="w-4 h-4" /> SLA: 100% On-Time Delivery Guarantee
            </div>
            <ul className="space-y-2 text-[11px] text-[#94A3B8] list-disc list-inside">
              <li><strong>Day 1:</strong> Instant UPI Auth Hold & Order Confirmation.</li>
              <li><strong>Day 2:</strong> Robotic Pick & Pack at Regional Logistics Hub.</li>
              <li><strong>Day 3:</strong> Air Express Transit to Destination Sorting Facility.</li>
              <li><strong>Day 4:</strong> Local Courier Dispatched Out for Delivery.</li>
              <li><strong>Day 5:</strong> Guaranteed Handover to Customer Address.</li>
            </ul>
            <div className="p-2.5 rounded-[8px] bg-[#0F172A] border border-[#22C55E]/30 text-[#22C55E] text-[11px] font-bold">
              If delivery exceeds 5 days, customer automatically receives ₹500 delay credit!
            </div>
          </div>
        </div>
      </div>

      {/* Circuit Breaker Status Widget */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[12px] font-mono font-bold uppercase text-[#94A3B8]">Payment Gateway Circuit Breaker</div>
            <div className="text-[13px] font-semibold text-[#F8FAFC] mt-0.5">
              Protects backend API thread pools from gateway latency spikes & outages.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[12px]">
          <div className="text-right">
            <div className="text-[#94A3B8]">Failure Threshold: 50%</div>
            <div className="text-[#94A3B8]">Failures Logged: {result.paymentsFailed}</div>
          </div>
          <span className={`px-3 py-1.5 rounded-full font-extrabold border ${
            circuitBreakerStatus === 'CLOSED'
              ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
          }`}>
            CIRCUIT: {circuitBreakerStatus}
          </span>
        </div>
      </div>

      {/* Strategy & Adapter Code Block */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[12px]">
        <div className="flex items-center gap-2 text-[13px] font-bold text-[#38BDF8] uppercase tracking-wider">
          <Cpu className="w-4 h-4 text-[#38BDF8]" /> Open/Closed Principle: UPI & Card Payment Adapter Pattern
        </div>
        <p className="text-[12px] text-[#94A3B8] leading-relaxed">
          Adding new payment options (UPI QR Code, GPay, Paytm, Stripe) requires zero changes to core checkout service logic.
        </p>

        <CodeBlock
          language="typescript"
          code={`// UPI & Card Payment Provider Strategy Interface
export interface PaymentGatewayStrategy {
  readonly providerName: string;
  processUpiQrCharge(qrSessionId: string, amount: number, idempotencyKey: string): Promise<PaymentResult>;
}

// UPI Concrete Adapter (GPay / PhonePe / Paytm / BHIM QR)
export class UpiQrPaymentAdapter implements PaymentGatewayStrategy {
  readonly providerName = 'UPI_QR_GATEWAY';
  async processUpiQrCharge(qrSessionId: string, amount: number, idempotencyKey: string) {
    return { success: true, transactionRef: "tx_upi_qr_" + Date.now(), estimatedDeliveryDays: 5 };
  }
}`}
          explanation="Core checkout workflow relies on PaymentGatewayStrategy interface (DIP & OCP)."
        />
      </div>

      {/* Payment Transactions Table */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[12px]">
        <div className="flex items-center justify-between border-b border-[#334155] pb-3">
          <h2 className="text-[14px] font-semibold text-[#F8FAFC]">
            PAYMENT TRANSACTIONS LOG ({result.payments.length} EXECUTED)
          </h2>
          <span className="text-[11px] text-[#94A3B8]">Showing first 15 records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[12px] text-[#F8FAFC]">
            <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[11px] border-b border-[#334155]">
              <tr>
                <th className="p-3">Payment ID</th>
                <th className="p-3">Reservation ID</th>
                <th className="p-3">Transaction Ref</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Fulfillment SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {result.payments.slice(0, 15).map((pay, idx) => (
                <tr key={pay.id} className="hover:bg-[#1E293B]">
                  <td className="p-3 font-bold text-[#38BDF8]">{pay.id}</td>
                  <td className="p-3">{pay.reservationId}</td>
                  <td className="p-3 text-[#94A3B8] text-[11px]">{pay.transactionRef}</td>
                  <td className="p-3 text-[#C58AF9] font-bold">{idx % 2 === 0 ? 'UPI (QR Code)' : 'UPI (GPay)'}</td>
                  <td className="p-3">${pay.amount.toFixed(2)}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                      SUCCESS
                    </span>
                  </td>
                  <td className="p-3 text-[#22C55E] font-bold text-[11px]">5 Days (Est: Oct 10)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
