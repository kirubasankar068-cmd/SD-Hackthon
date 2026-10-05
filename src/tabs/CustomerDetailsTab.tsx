import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, ShieldCheck, Copy, Send, Save, Trash2 } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import type { CustomerDetails } from '../sim/types';

export const CustomerDetailsTab: React.FC = () => {
  const { result } = useSimulationStore();

  const [formData, setFormData] = useState<CustomerDetails>({
    id: `cust_demo_${Date.now()}`,
    fullName: 'Rahul Sharma',
    mobile: '9876543210',
    email: 'rahul.sharma@example.com',
    pinCode: '560001',
    address: 'Flat 402, Sunshine Heights, MG Road, Bengaluru',
    consent: true,
    createdAt: Date.now(),
  });

  const [localCustomers, setLocalCustomers] = useState<CustomerDetails[]>([]);
  const [submittedReservation, setSubmittedReservation] = useState<{
    id: string;
    idempotencyKey: string;
    status: string;
    isDuplicateResponse: boolean;
  } | null>(null);

  // Load local customers from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('salestorm_saved_customers');
      if (saved) {
        setLocalCustomers(JSON.parse(saved));
      } else {
        // Initial defaults
        const defaults: CustomerDetails[] = [
          {
            id: 'cust_101',
            fullName: 'Aarav Sharma',
            mobile: '9876100000',
            email: 'aarav.sharma@example.com',
            pinCode: '560001',
            address: '101, SysCrafters Ave, Tech Park, Bengaluru',
            consent: true,
            createdAt: Date.now(),
          },
          {
            id: 'cust_102',
            fullName: 'Ananya Verma',
            mobile: '9876100001',
            email: 'ananya.verma@example.com',
            pinCode: '560011',
            address: '102, SysCrafters Ave, Tech Park, Bengaluru',
            consent: true,
            createdAt: Date.now(),
          },
          {
            id: 'cust_103',
            fullName: 'Rohan Patel',
            mobile: '9876100002',
            email: 'rohan.patel@example.com',
            pinCode: '560012',
            address: '103, SysCrafters Ave, Tech Park, Bengaluru',
            consent: true,
            createdAt: Date.now(),
          }
        ];
        setLocalCustomers(defaults);
        localStorage.setItem('salestorm_saved_customers', JSON.stringify(defaults));
      }
    } catch (err) {
      console.error('Failed loading local storage customers:', err);
    }
  }, []);

  const saveCustomerToLocalStorage = (cust: CustomerDetails) => {
    const updated = [cust, ...localCustomers.filter(c => c.id !== cust.id)];
    setLocalCustomers(updated);
    localStorage.setItem('salestorm_saved_customers', JSON.stringify(updated));
  };

  const deleteLocalCustomer = (id: string) => {
    const updated = localCustomers.filter(c => c.id !== id);
    setLocalCustomers(updated);
    localStorage.setItem('salestorm_saved_customers', JSON.stringify(updated));
  };

  // Validation logic
  const isNameValid = formData.fullName.trim().length >= 3;
  const isMobileValid = /^\d{10}$/.test(formData.mobile.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isPinValid = /^\d{6}$/.test(formData.pinCode.trim());
  const isAddressValid = formData.address.trim().length >= 10;
  const isConsentValid = formData.consent;

  const isFormValid = isNameValid && isMobileValid && isEmailValid && isPinValid && isAddressValid && isConsentValid;

  const handleBuyNowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newCust: CustomerDetails = {
      ...formData,
      id: formData.id || `cust_local_${Date.now()}`,
      createdAt: Date.now(),
    };
    saveCustomerToLocalStorage(newCust);

    const key = `idemp_email_${formData.email.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (submittedReservation && submittedReservation.idempotencyKey === key) {
      setSubmittedReservation({
        ...submittedReservation,
        isDuplicateResponse: true,
      });
    } else {
      setSubmittedReservation({
        id: `res_cust_${Math.floor(Math.random() * 8999 + 1000)}`,
        idempotencyKey: key,
        status: 'RESERVED (15m TTL)',
        isDuplicateResponse: false,
      });
    }
  };

  const useSavedCustomer = (cust: CustomerDetails) => {
    setFormData(cust);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#F8FAFC] font-mono">
              Customer Information & Local Storage Database
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Customer details are validated upfront and saved locally in your browser session for lightning fast checkout.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Validated Form */}
        <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
          <div className="flex items-center justify-between border-b border-[#334155] pb-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" /> PRE-CHECKOUT VALIDATION FORM
            </h2>
            <span className="text-[11px] text-[#22C55E] bg-[#22C55E]/15 border border-[#22C55E]/30 px-2.5 py-0.5 rounded-full font-bold">
              LOCAL STORAGE ENABLED
            </span>
          </div>

          <form onSubmit={handleBuyNowSubmit} className="space-y-3">
            <div>
              <label className="block text-[#94A3B8] mb-1">Full Name (Min 3 chars)</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full bg-[#1E293B] border rounded-[10px] px-3 py-2 text-[#F8FAFC] text-[12px] ${
                  isNameValid ? 'border-[#334155] focus:border-[#C58AF9]' : 'border-rose-500/60'
                }`}
                placeholder="Rahul Sharma"
              />
              {!isNameValid && <span className="text-[10px] text-rose-400 mt-0.5 block">Name must be at least 3 characters.</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#94A3B8] mb-1">10-Digit Mobile Number</label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className={`w-full bg-[#1E293B] border rounded-[10px] px-3 py-2 text-[#F8FAFC] text-[12px] ${
                    isMobileValid ? 'border-[#334155] focus:border-[#C58AF9]' : 'border-rose-500/60'
                  }`}
                  placeholder="9876543210"
                />
                {!isMobileValid && <span className="text-[10px] text-rose-400 mt-0.5 block">Must be 10 digits.</span>}
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1">PIN Code (6 digits)</label>
                <input
                  type="text"
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                  className={`w-full bg-[#1E293B] border rounded-[10px] px-3 py-2 text-[#F8FAFC] text-[12px] ${
                    isPinValid ? 'border-[#334155] focus:border-[#C58AF9]' : 'border-rose-500/60'
                  }`}
                  placeholder="560001"
                />
                {!isPinValid && <span className="text-[10px] text-rose-400 mt-0.5 block">Must be 6 digits.</span>}
              </div>
            </div>

            <div>
              <label className="block text-[#94A3B8] mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-[#1E293B] border rounded-[10px] px-3 py-2 text-[#F8FAFC] text-[12px] ${
                  isEmailValid ? 'border-[#334155] focus:border-[#C58AF9]' : 'border-rose-500/60'
                }`}
                placeholder="rahul.sharma@example.com"
              />
              {!isEmailValid && <span className="text-[10px] text-rose-400 mt-0.5 block">Enter valid email.</span>}
            </div>

            <div>
              <label className="block text-[#94A3B8] mb-1">Delivery Address (Min 10 chars)</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className={`w-full bg-[#1E293B] border rounded-[10px] px-3 py-2 text-[#F8FAFC] text-[12px] ${
                  isAddressValid ? 'border-[#334155] focus:border-[#C58AF9]' : 'border-rose-500/60'
                }`}
                placeholder="Flat / House No, Street, City"
              />
              {!isAddressValid && <span className="text-[10px] text-rose-400 mt-0.5 block">Address too short.</span>}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="consentCheck"
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                className="w-4 h-4 rounded border-[#334155] text-[#C58AF9] focus:ring-[#C58AF9] cursor-pointer"
              />
              <label htmlFor="consentCheck" className="text-[#F8FAFC] text-[11px] cursor-pointer">
                I agree to SMS/Email notifications for order status and 5-day delivery updates.
              </label>
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-3 rounded-[12px] font-bold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isFormValid
                  ? 'bg-[#C58AF9] hover:opacity-90 text-[#1A1C21] shadow-md shadow-[#C58AF9]/20'
                  : 'bg-[#1E293B] text-[#94A3B8] cursor-not-allowed border border-[#334155]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isFormValid ? 'Buy Now & Save to Local Database' : 'Buy Blocked (Form Invalid)'}</span>
            </button>
          </form>

          {/* Submission Result / Idempotency Response */}
          {submittedReservation && (
            <div className={`p-4 rounded-[12px] border space-y-2 ${
              submittedReservation.isDuplicateResponse
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {submittedReservation.isDuplicateResponse ? <Copy className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {submittedReservation.isDuplicateResponse ? 'DUPLICATE CLICK DETECTED (Idempotent Response Returned)' : 'RESERVATION SUCCESS'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0F172A] border border-[#334155]">
                  HTTP 200
                </span>
              </div>
              <div className="text-[11px] opacity-90 space-y-1">
                <div>Reservation ID: <strong className="font-mono">{submittedReservation.id}</strong></div>
                <div>Idempotency Key: <strong className="font-mono">{submittedReservation.idempotencyKey}</strong></div>
                <div>Status: <strong>{submittedReservation.status}</strong></div>
                {submittedReservation.isDuplicateResponse && (
                  <p className="text-[10px] text-amber-300 mt-1 italic">
                    Notice: Duplicate request returned cached reservation without decrementing stock a second time.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Saved Customers Local Storage Table */}
        <div className="bg-[#0F172A] border border-[#334155] rounded-[16px] p-5 space-y-4 font-mono text-[12px]">
          <div className="flex items-center justify-between border-b border-[#334155] pb-3">
            <h2 className="text-[14px] font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Save className="w-4 h-4 text-[#22C55E]" /> BROWSER LOCAL STORAGE DATABASE ({localCustomers.length} RECORDS)
            </h2>
            <span className="text-[10px] text-[#94A3B8]">PERSISTED IN LOCALSTORAGE</span>
          </div>

          <div className="max-h-[440px] overflow-y-auto space-y-2.5 pr-1">
            {localCustomers.map((cust) => (
              <div key={cust.id} className="p-3.5 rounded-[12px] bg-[#1E293B] border border-[#334155] space-y-1.5 text-[#F8FAFC]">
                <div className="flex items-center justify-between font-bold text-[#F8FAFC]">
                  <span className="text-[13px] text-[#38BDF8]">{cust.fullName}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => useSavedCustomer(cust)}
                      className="px-2.5 py-1 rounded-full bg-[#C58AF9]/20 text-[#C58AF9] border border-[#C58AF9]/30 hover:bg-[#C58AF9] hover:text-[#1A1C21] text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Use Profile
                    </button>
                    <button
                      onClick={() => deleteLocalCustomer(cust.id)}
                      className="p-1 text-[#94A3B8] hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-[#94A3B8] flex items-center justify-between">
                  <span>{cust.email}</span>
                  <span className="text-[#22C55E]">MOB: {cust.mobile} | PIN: {cust.pinCode}</span>
                </div>
                <div className="text-[11px] text-[#94A3B8] truncate">{cust.address}</div>
              </div>
            ))}

            {result.savedCustomers.slice(0, 5).map((cust) => (
              <div key={cust.id} className="p-3.5 rounded-[12px] bg-[#1E293B]/60 border border-[#334155] space-y-1 text-[#94A3B8]">
                <div className="flex items-center justify-between font-bold text-[#F8FAFC]">
                  <span className="text-[12px]">{cust.fullName}</span>
                  <span className="text-[10px] text-[#38BDF8]">{cust.mobile}</span>
                </div>
                <div className="text-[11px] text-[#94A3B8] truncate">{cust.email} | PIN: {cust.pinCode}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
