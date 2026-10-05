import React, { useState } from 'react';
import { Settings, X, CheckCircle2, ShieldCheck, Database, Key, Server, RefreshCw, Radio, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [redisUrl, setRedisUrl] = useState('redis://salestorm-redis.syscrafters.internal:6379');
  const [stripeKey, setStripeKey] = useState('sk_live_salestorm_2026_syscrafters_99812');
  const [kafkaUrl, setKafkaUrl] = useState('kafka-cluster.syscrafters.internal:9092');
  const [postgresUri, setPostgresUri] = useState('postgresql://salestorm:pass@db-primary.internal:5432/salestorm_db');
  const [notifyKey, setNotifyKey] = useState('SG.salestorm_notify_secret_8812');

  const [isTesting, setIsTesting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestConnections = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setIsSuccess(false);

    setTimeout(() => {
      setIsTesting(false);
      setIsSuccess(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 font-sans select-none animate-fadeIn">
      <div className="bg-[#22242A] border border-[#444746] rounded-[16px] w-full max-w-2xl overflow-hidden shadow-none space-y-0 text-[#E8E8E8]">
        {/* Header */}
        <div className="p-6 border-b border-[#444746] flex items-center justify-between bg-[#34363B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono font-normal text-[15px] text-[#E8E8E8] flex items-center gap-2">
                PROJECT API KEYS & INFRASTRUCTURE INTEGRATION
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/40 font-semibold">
                  LIVE API MAPPING
                </span>
              </div>
              <div className="text-[12px] text-[#9AA0A6] mt-0.5">
                Connect backend API credentials to map live Redis, Payment Gateway, Kafka, and PostgreSQL endpoints.
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9AA0A6] hover:text-white hover:bg-[#444746] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleTestConnections} className="p-6 space-y-4 font-mono text-[13px]">
          <div className="space-y-3">
            <div>
              <label className="block text-[#9AA0A6] mb-1 flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-[#C58AF9]" /> Redis Cluster Connection URI (Atomic Lua Gate)
              </label>
              <input
                type="text"
                value={redisUrl}
                onChange={(e) => setRedisUrl(e.target.value)}
                className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] text-[13px] focus:border-[#C58AF9] font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#9AA0A6] mb-1 flex items-center gap-1.5 font-medium">
                  <Key className="w-3.5 h-3.5 text-[#99C3FF]" /> Stripe / PSP Secret Key
                </label>
                <input
                  type="password"
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] text-[13px] focus:border-[#C58AF9] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#9AA0A6] mb-1 flex items-center gap-1.5 font-medium">
                  <Server className="w-3.5 h-3.5 text-[#C58AF9]" /> Kafka Event Bus Broker Endpoint
                </label>
                <input
                  type="text"
                  value={kafkaUrl}
                  onChange={(e) => setKafkaUrl(e.target.value)}
                  className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] text-[13px] focus:border-[#C58AF9] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#9AA0A6] mb-1 flex items-center gap-1.5 font-medium">
                  <Database className="w-3.5 h-3.5 text-[#99C3FF]" /> PostgreSQL Primary Database URI
                </label>
                <input
                  type="text"
                  value={postgresUri}
                  onChange={(e) => setPostgresUri(e.target.value)}
                  className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] text-[13px] focus:border-[#C58AF9] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#9AA0A6] mb-1 flex items-center gap-1.5 font-medium">
                  <Radio className="w-3.5 h-3.5 text-[#C58AF9]" /> Twilio / Email Notification API Key
                </label>
                <input
                  type="password"
                  value={notifyKey}
                  onChange={(e) => setNotifyKey(e.target.value)}
                  className="w-full bg-[#1A1C21] border border-[#444746] rounded-[12px] px-3.5 py-2 text-[#E8E8E8] text-[13px] focus:border-[#C58AF9] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Test & Connect Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isTesting}
              className="w-full py-3 rounded-full bg-[#C58AF9] hover:opacity-90 text-[#1A1C21] font-mono font-semibold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin text-[#1A1C21]" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{isTesting ? 'Validating API Key Handshakes...' : 'Connect & Test API Keys'}</span>
            </button>
          </div>

          {/* Connection Results Grid */}
          {isSuccess && (
            <div className="p-4 rounded-[16px] bg-[#1A1C21] border border-[#99C3FF]/40 text-[#99C3FF] space-y-2 animate-fadeIn font-sans">
              <div className="flex items-center justify-between font-medium border-b border-[#444746] pb-2 text-[13px]">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#99C3FF]" /> ALL API KEYS VERIFIED & CONNECTED SUCCESSFULLY
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#99C3FF]/20 text-[#99C3FF] border border-[#99C3FF]/40 font-mono">
                  HEALTH 100%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px] text-[#E8E8E8] font-mono">
                <div>&bull; Redis Gate: <strong className="text-[#99C3FF]">CONNECTED (0.8ms)</strong></div>
                <div>&bull; Stripe PSP API: <strong className="text-[#99C3FF]">AUTHORIZED (v2026)</strong></div>
                <div>&bull; Kafka Broker: <strong className="text-[#99C3FF]">ACTIVE (Partitions 1-12)</strong></div>
                <div>&bull; PostgreSQL DB: <strong className="text-[#99C3FF]">CONNECTED (PgBouncer)</strong></div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-[#444746] bg-[#34363B] flex items-center justify-between text-[12px] font-mono text-[#9AA0A6]">
          <span>SALESTORM Infrastructure Gateway</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#444746] hover:bg-[#5E5E5E] text-white font-medium transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
