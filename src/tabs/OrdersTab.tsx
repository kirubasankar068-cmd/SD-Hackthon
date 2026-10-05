import React, { useState } from 'react';
import { ShoppingBag, RefreshCcw, Bell, Search, Truck, CheckCircle2, PackageCheck, MapPin, Clock } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { StateChain } from '../components/StateChain';

export const OrdersTab: React.FC = () => {
  const { result } = useSimulationStore();
  const [searchQuery, setSearchQuery] = useState<string>('cust_1');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>('ORD-20261005-001');

  // Filter orders by Customer ID or Order Number
  const filteredOrders = result.orders.filter(
    (ord) =>
      ord.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTrackedOrder = filteredOrders.find(o => o.orderNumber === selectedOrderNumber) || filteredOrders[0] || result.orders[0];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#F8FAFC] font-mono">
              Order Fulfillment & Particular Customer Delivery Tracker
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Search by Customer ID or Order Number to inspect real-time 5-day delivery progress timeline and shipping tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Customer Delivery Tracking Search & Live Progress Bar */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#334155] pb-3">
          <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#38BDF8]" /> CUSTOMER ORDER DELIVERY TRACKER
          </h2>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1E293B] border border-[#334155] rounded-[10px] px-3 py-1.5 text-[#F8FAFC] text-[12px] focus:border-[#C58AF9] w-48 sm:w-64"
              placeholder="Search Customer ID (e.g. cust_1)"
            />
          </div>
        </div>

        {/* Selected Customer Active Track Timeline Card */}
        {activeTrackedOrder ? (
          <div className="bg-[#1E293B] border border-[#334155] rounded-[12px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#334155] pb-3 text-[12px]">
              <div>
                <div className="text-[15px] font-bold text-[#38BDF8] flex items-center gap-2">
                  <span>ORDER: {activeTrackedOrder.orderNumber}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 font-bold">
                    CONFIRMED & PAID
                  </span>
                </div>
                <div className="text-[#94A3B8] text-[11px] mt-0.5">
                  Customer ID: <strong className="text-[#F8FAFC]">{activeTrackedOrder.userId}</strong> | Tx Ref: <strong className="text-[#F8FAFC]">{activeTrackedOrder.transactionRef}</strong>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-[#94A3B8]">Tracking AWB: <strong className="text-[#C58AF9]">TRK-IN-98765432</strong></div>
                <div className="text-[11px] text-[#22C55E] font-bold flex items-center gap-1 justify-end mt-0.5">
                  <Clock className="w-3.5 h-3.5" /> Est Delivery: 5 Days (Oct 10, 2026)
                </div>
              </div>
            </div>

            {/* 5-Day Delivery Tracking Timeline */}
            <div className="space-y-2 pt-1 font-sans">
              <div className="text-[11px] uppercase font-mono font-semibold text-[#94A3B8] mb-2">5-DAY LIVE DELIVERY PROGRESS STAGES:</div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                <div className="p-3 rounded-[10px] bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Day 1 (Oct 5)
                  </div>
                  <div className="text-[10px] text-[#F8FAFC]">Order Confirmed</div>
                  <div className="text-[9px] text-[#22C55E]">Completed</div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5" /> Day 2 (Oct 6)
                  </div>
                  <div className="text-[10px] text-[#F8FAFC]">Hub Packing</div>
                  <div className="text-[9px] text-[#22C55E]">Completed</div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 animate-pulse" /> Day 3 (Oct 7)
                  </div>
                  <div className="text-[10px] text-[#F8FAFC]">Air Express</div>
                  <div className="text-[9px] text-[#38BDF8]">IN TRANSIT</div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#0F172A] border border-[#334155] text-[#94A3B8] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Day 4 (Oct 8)
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">Out For Delivery</div>
                  <div className="text-[9px] text-[#94A3B8]">Pending</div>
                </div>

                <div className="p-3 rounded-[10px] bg-[#0F172A] border border-[#334155] text-[#94A3B8] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Day 5 (Oct 10)
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">Delivered</div>
                  <div className="text-[9px] text-[#94A3B8]">Pending</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-[12px] bg-[#1E293B] text-[#94A3B8] text-[12px]">
            No customer order matching "{searchQuery}". Try searching "cust_1" or "cust_2".
          </div>
        )}
      </div>

      {/* State Machine Visualization */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[12px]">
        <h2 className="text-[14px] font-semibold text-[#F8FAFC]">
          ORDER LIFECYCLE STATE MACHINE (STATE PATTERN)
        </h2>
        <StateChain
          states={[
            { label: 'CREATED', status: 'neutral' },
            { label: 'PAYMENT_PENDING', status: 'pending' },
            { label: 'CONFIRMED', status: 'success' },
            { label: 'PROCESSING', status: 'active' },
            { label: 'SHIPPED', status: 'active' },
            { label: 'OUT_FOR_DELIVERY', status: 'active' },
            { label: 'DELIVERED (DAY 5)', status: 'success' },
          ]}
        />
      </div>

      {/* Outage Recovery & Observer Pattern Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[12px]">
        <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <RefreshCcw className="w-4 h-4 text-amber-400" /> Outage Recovery: Outbox &rarr; DLQ &rarr; Reconciler
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            If the Order Service is down during payment completion, <span className="text-[#F8FAFC]">PaymentSucceededEvent</span> messages queue safely on Kafka disk. Upon service recovery, the Background Reconciler reconstructs missing orders into PostgreSQL.
          </p>
        </div>

        <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#22C55E]">
            <Bell className="w-4 h-4 text-[#22C55E]" /> Observer Pattern: Asynchronous Domain Events
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            When an order shifts to <span className="text-[#F8FAFC]">CONFIRMED</span>, an <span className="text-[#F8FAFC]">OrderConfirmedEvent</span> is published. Independent observers (Shipment 5-Day Service, SMS Notification, Warehouse WMS) consume this event without slowing down HTTP checkout.
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[12px]">
        <div className="flex items-center justify-between border-b border-[#334155] pb-3">
          <h2 className="text-[14px] font-semibold text-[#F8FAFC]">
            PERSISTED ORDERS ({result.orders.length} CONFIRMED)
          </h2>
          <span className="text-[11px] text-[#94A3B8]">Click any row to track delivery</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[12px] text-[#F8FAFC]">
            <thead className="bg-[#1E293B] text-[#94A3B8] uppercase text-[11px] border-b border-[#334155]">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Customer ID</th>
                <th className="p-3">Transaction Ref</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Source</th>
                <th className="p-3">Track Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {filteredOrders.slice(0, 15).map((ord) => (
                <tr
                  key={ord.id}
                  onClick={() => setSelectedOrderNumber(ord.orderNumber)}
                  className={`hover:bg-[#1E293B] cursor-pointer ${
                    selectedOrderNumber === ord.orderNumber ? 'bg-[#1E293B] border-l-4 border-l-[#C58AF9]' : ''
                  }`}
                >
                  <td className="p-3 font-bold text-[#38BDF8]">{ord.orderNumber}</td>
                  <td className="p-3">{ord.userId}</td>
                  <td className="p-3 text-[#94A3B8] text-[11px]">{ord.transactionRef}</td>
                  <td className="p-3">${ord.totalAmount.toFixed(2)}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                      {ord.state}
                    </span>
                  </td>
                  <td className="p-3">
                    {ord.isReconciled ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        RECONCILED (DLQ)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-[#38BDF8] border border-blue-500/30">
                        DIRECT KAFKA
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <button className="px-2.5 py-1 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 hover:bg-[#38BDF8] hover:text-[#1A1C21] text-[10px] font-bold transition-all">
                      Track 5-Day Status
                    </button>
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
