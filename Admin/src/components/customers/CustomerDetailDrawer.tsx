"use client";

import React, { useEffect, useState } from "react";
import { X, Lock, Unlock, ShieldAlert } from "lucide-react";
import { adminApi, CustomerDetail } from "@/lib/api";
import { formatDateTime, formatNairaFromKobo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleGuard } from "@/components/RoleGuard";
import { FreezeAccountModal } from "./FreezeAccountModal";
import { RequestUnfreezeModal } from "./RequestUnfreezeModal";

interface CustomerDetailDrawerProps {
  customerId: string;
  onClose: () => void;
  onRefreshList: () => Promise<void>;
}

export function CustomerDetailDrawer({
  customerId,
  onClose,
  onRefreshList,
}: CustomerDetailDrawerProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFreeze, setShowFreeze] = useState(false);
  const [showUnfreeze, setShowUnfreeze] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCustomerDetail(customerId);
      setCustomer(res.customer);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadDetail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleActionDone = async () => {
    await Promise.all([loadDetail(), onRefreshList()]);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-[#090D16]">
              Customer 360° Profile
            </h2>
            <p className="text-xs text-slate-400 font-mono">{customerId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !customer ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading customer data...</div>
          ) : (
            <>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display font-bold text-lg text-[#090D16]">
                      {customer.fullName || "Unnamed Customer"}
                    </div>
                    <div className="text-xs text-slate-500">{customer.phoneNumber}</div>
                  </div>
                  <StatusBadge status={customer.status} />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200/70 text-xs">
                  <div>
                    <div className="text-slate-400">Wallet Balance</div>
                    <div className="font-bold text-[#090D16]">
                      {formatNairaFromKobo(customer.wallet?.balanceInKobo)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">KYC Tier</div>
                    <div className="font-bold text-[#090D16]">Tier {customer.kycTier}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">BVN Last 4</div>
                    <div className="font-mono font-bold text-[#090D16]">
                      {customer.bvnLast4 || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {customer.status !== "FROZEN" ? (
                  <RoleGuard allowed={["SUPER_ADMIN", "OPERATIONS"]}>
                    <button
                      onClick={() => setShowFreeze(true)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Freeze Account
                    </button>
                  </RoleGuard>
                ) : (
                  <RoleGuard allowed={["SUPER_ADMIN", "OPERATIONS", "SUPPORT"]}>
                    <button
                      onClick={() => setShowUnfreeze(true)}
                      className="px-4 py-2 rounded-xl bg-[#0E63F4] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Request Unfreeze (Maker)
                    </button>
                  </RoleGuard>
                )}
              </div>

              {/* Dedicated NUBANs */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Dedicated Virtual Accounts
                </h3>
                {customer.dedicatedNubans.length === 0 ? (
                  <p className="text-xs text-slate-400">No NUBAN assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {customer.dedicatedNubans.map((n) => (
                      <div
                        key={n.accountNumber}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#090D16]">{n.bankName}</div>
                          <div className="text-slate-500">{n.accountName}</div>
                        </div>
                        <div className="font-mono font-bold text-sm text-[#090D16]">
                          {n.accountNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Freeze Logs */}
              {customer.emergencyFreezeLogs.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                    Freeze History
                  </h3>
                  <div className="space-y-2">
                    {customer.emergencyFreezeLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-red-50/50 border border-red-100 text-xs flex justify-between"
                      >
                        <div>
                          <div className="font-mono font-semibold text-red-700">
                            {log.reference}
                          </div>
                          <div className="text-slate-500">Channel: {log.channel}</div>
                        </div>
                        <div className="text-slate-400">{formatDateTime(log.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Recent Transactions
                </h3>
                <div className="space-y-2">
                  {customer.transactions.length === 0 ? (
                    <p className="text-xs text-slate-400">No transactions yet.</p>
                  ) : (
                    customer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono font-semibold text-[#090D16]">
                            {tx.reference}
                          </div>
                          <div className="text-slate-500">
                            {tx.type.replace(/_/g, " ")} • {formatDateTime(tx.createdAt)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-bold text-[#090D16]">
                            {formatNairaFromKobo(tx.amountInKobo)}
                          </div>
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showFreeze && customer && (
        <FreezeAccountModal
          customerId={customer.id}
          customerName={customer.fullName || customer.phoneNumber}
          onClose={() => setShowFreeze(false)}
          onSuccess={handleActionDone}
        />
      )}

      {showUnfreeze && customer && (
        <RequestUnfreezeModal
          customerId={customer.id}
          customerName={customer.fullName || customer.phoneNumber}
          onClose={() => setShowUnfreeze(false)}
          onSuccess={handleActionDone}
        />
      )}
    </div>
  );
}

