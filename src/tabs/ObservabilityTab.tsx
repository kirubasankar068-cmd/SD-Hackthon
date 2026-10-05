import React, { useState } from 'react';
import { Activity, ShieldCheck, Cpu, Terminal, AlertOctagon, GitBranch, Search } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { MetricCard } from '../components/MetricCard';

export const ObservabilityTab: React.FC = () => {
  const { result } = useSimulationStore();
  const [selectedTraceId] = useState<string>('tr_usr_102');
  const [logFilter, setLogFilter] = useState<string>('');
  const [logLevelFilter, setLogLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');

  const formattedJsonLogs = result.logs.map((log) => ({
    timestamp: new Date(1760000000000 + log.timestamp).toISOString(),
    level: log.type.includes('FAIL') || log.type.includes('OUTAGE') ? 'ERROR' : log.type.includes('WAITLIST') || log.type.includes('BLOCKED') ? 'WARN' : 'INFO',
    service: log.type.includes('STOCK') ? 'inventory-service' : log.type.includes('PAYMENT') ? 'payment-gateway' : log.type.includes('ORDER') ? 'order-service' : 'api-gateway',
    traceId: log.traceId,
    type: log.type,
    message: log.message,
  }));

  const filteredLogs = formattedJsonLogs.filter((log) => {
    const matchesLevel = logLevelFilter === 'ALL' || log.level === logLevelFilter;
    const matchesQuery =
      log.message.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.traceId.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.service.toLowerCase().includes(logFilter.toLowerCase());
    return matchesLevel && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#F8FAFC] font-mono">
              Observability, Telemetry & Structured Logging
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Monitor real-time metrics, structured JSON log streams, distributed OpenTelemetry traces, alerting rules, and system scalability.
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard label="Request Rate" value={`${result.totalRequests}/s`} subtext="Burst load" />
        <MetricCard label="p99 Latency" value="1.2 ms" subtext="Redis gate" />
        <MetricCard label="Error Rate" value={`${((result.paymentsFailed / (result.totalRequests || 1)) * 100).toFixed(1)}%`} subtext="PSP declines" />
        <MetricCard label="Res Failures" value={result.soldOutReplies} subtext="Sold-out replies" />
        <MetricCard label="Pay Failures" value={result.paymentsFailed} subtext="Released stock" />
        <MetricCard label="Conversion" value={`${((result.finalUnitsSold / result.config.stock) * 100).toFixed(0)}%`} subtext="Stock sold out" />
        <MetricCard label="Kafka Lag" value={result.ordersQueuedDuringOutage} subtext="Outbox queue lag" />
      </div>

      {/* Configured PagerDuty Alerts */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono">
        <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400" /> CONFIGURED SYSTEM ALERTS & THRESHOLDS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
          <div className="p-3.5 rounded-[12px] bg-rose-500/15 border border-rose-500/30 text-rose-300 space-y-1">
            <div className="font-bold text-rose-400">ALERT P0: Inventory Mismatch</div>
            <div className="text-[11px] opacity-80">Triggered if stock count &lt; 0. Status: NORMAL.</div>
          </div>

          <div className="p-3.5 rounded-[12px] bg-amber-500/15 border border-amber-500/30 text-amber-300 space-y-1">
            <div className="font-bold text-amber-400">ALERT P1: Payment Spike</div>
            <div className="text-[11px] opacity-80">Triggered if payment failure rate &gt; 15%. Status: NORMAL.</div>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] space-y-1">
            <div className="font-bold text-[#38BDF8]">ALERT P2: Kafka Queue Lag</div>
            <div className="text-[11px] opacity-80">Triggered if consumer lag &gt; 5,000 events. Status: ACTIVE ({result.ordersQueuedDuringOutage}).</div>
          </div>

          <div className="p-3.5 rounded-[12px] bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] space-y-1">
            <div className="font-bold text-[#22C55E]">ALERT P3: DLQ Reconciled</div>
            <div className="text-[11px] opacity-80">Reconciler recovered {result.ordersReconciledFromDLQ} events. Status: RESOLVED.</div>
          </div>
        </div>
      </div>

      {/* Structured JSON Log Viewer */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#334155] pb-3">
          <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#38BDF8]" /> STRUCTURED JSON TELEMETRY LOG STREAM ({filteredLogs.length} RECORDS)
          </h2>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1E293B] p-1 rounded-[10px] border border-[#334155]">
              {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded-[8px] font-bold text-[10px] cursor-pointer transition-all ${
                    logLevelFilter === lvl
                      ? lvl === 'ERROR'
                        ? 'bg-rose-600 text-white'
                        : lvl === 'WARN'
                        ? 'bg-amber-600 text-white'
                        : 'bg-[#C58AF9] text-[#1A1C21]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="Search logs..."
                className="bg-[#1E293B] border border-[#334155] rounded-[10px] pl-8 pr-3 py-1.5 text-[12px] text-[#F8FAFC] focus:border-[#C58AF9] w-44"
              />
            </div>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="p-3 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-1 font-mono text-[11px] leading-relaxed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    log.level === 'ERROR'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : log.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-[#38BDF8] border border-blue-500/40'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-[#F8FAFC] font-bold">{log.service}</span>
                  <span className="text-[#94A3B8] text-[10px]">[{log.timestamp}]</span>
                </div>
                <span className="text-[10px] text-[#C58AF9]">{log.traceId}</span>
              </div>
              <div className="text-[#F8FAFC] pt-0.5">{log.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Distributed Trace Viewer */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-3 font-mono text-[12px]">
        <div className="flex items-center justify-between border-b border-[#334155] pb-3">
          <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#38BDF8]" /> DISTRIBUTED TRACE CORRELATION VIEWER (OPENTELEMETRY)
          </h2>
          <span className="text-[12px] text-[#C58AF9] font-bold">Trace ID: {selectedTraceId}</span>
        </div>

        <div className="p-4 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-2 text-[12px]">
          <div className="flex items-center justify-between border-b border-[#334155] pb-2">
            <span className="text-[#94A3B8]">1. Client HTTP POST /checkout</span>
            <span className="text-[#22C55E] font-bold">0.1 ms (Gateway Admission)</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#334155] pb-2 pl-4">
            <span className="text-[#94A3B8]">2. Inventory Service &rarr; Redis EVAL lua_script</span>
            <span className="text-[#22C55E] font-bold">0.8 ms (Atomic Stock Decrement)</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#334155] pb-2 pl-8">
            <span className="text-[#94A3B8]">3. Payment Service &rarr; PSP Charge Execution</span>
            <span className="text-[#22C55E] font-bold">120 ms (Stripe Authorization)</span>
          </div>
          <div className="flex items-center justify-between border-b border-[#334155] pb-2 pl-12">
            <span className="text-[#94A3B8]">4. Kafka Publish PaymentSucceededEvent</span>
            <span className="text-[#22C55E] font-bold">1.5 ms (Partition Disk Commit)</span>
          </div>
          <div className="flex items-center justify-between pl-16">
            <span className="text-[#94A3B8]">5. Order Service &rarr; PostgreSQL INSERT INTO orders</span>
            <span className="text-[#22C55E] font-bold">3.2 ms (ACID Persistence)</span>
          </div>
        </div>
      </div>

      {/* Security & Scalability Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[12px]">
        <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#38BDF8]">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8]" /> Security Architecture Summary
          </div>
          <ul className="space-y-1.5 text-[#94A3B8] list-disc list-inside leading-relaxed font-sans text-[12px]">
            <li>Edge Cloudflare WAF sheds bot traffic & protects against DDoS bursts.</li>
            <li>JWT Bearer token authentication with RS256 signature checks.</li>
            <li>PCI-DSS compliance: Payment card details tokenized at PSP edge.</li>
            <li>All microservice secrets injected via AWS Secrets Manager.</li>
          </ul>
        </div>

        <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#22C55E]">
            <Cpu className="w-4 h-4 text-[#22C55E]" /> Scalability & 50x Traffic Burst Plan
          </div>
          <ul className="space-y-1.5 text-[#94A3B8] list-disc list-inside leading-relaxed font-sans text-[12px]">
            <li>Normal load: 10,000 req/s; Burst load: 500,000 req/s.</li>
            <li>Virtual Waiting Room sheds 95%+ excess requests at CDN edge.</li>
            <li>Redis 6-Node sharded cluster executes 400k+ ops/sec.</li>
            <li>PostgreSQL PgBouncer connection pool caps active DB threads to 200.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
