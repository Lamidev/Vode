"use client";

import React, { useEffect, useState } from "react";
import { X, RefreshCw, RotateCcw } from "lucide-react";
import { adminApi, ApiError, TransactionRecord } from "@/lib/api";
import { formatDateTime, formatNairaFromKobo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleGuard } from "@/components/RoleGuard";
import { RequestRevertModal } from "./RequestRevertModal";

interface TransactionDetailDrawerProps {
  transactionId: string;
  onClose: () => void;
  onRefreshList: () => Promise<void>;
}

export function TransactionDetailDrawer({
  transactionId,
  onClose,
  onRefreshList,
}: TransactionDetailDrawerProps) {
  const [tx, setTx] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [requerying, setRequerying] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Record<string, unknown> | null>(null);
  const [requeryError, setRequeryError] = useState<string | null>(null);
  const [showRevert, setShowRevert] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTransactionDetail(transactionId);
      setTx(res.transaction);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  const handleRequery = async () => {
    setRequerying(true);
    setRequeryError(null);
    try {
      const res = await adminApi.requeryTransaction(transactionId);
      setProviderStatus(res.providerStatus);
    } catch (err) {
      setRequeryError(err instanceof ApiError ? err.message : "Provider re-query failed.");
    } finally {
      setRequerying(false);
    }
  };

  const canRequestRevert =
    tx &&
    tx.type === "TRANSFER_OUT" &&
    (tx.status === "PENDING" || tx.status === "FAILED");

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-[#090D16]">
              Transaction Inspector
            </h2>
            <p className="text-xs text-slate-400 font-mono">{tx?.reference || transactionId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !tx ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading transaction...</div>
          ) : (
            <>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display font-bold text-2xl text-[#090D16]">
                      {formatNairaFromKobo(tx.amountInKobo)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Fee: {formatNairaFromKobo(tx.feeInKobo)} • {tx.type.replace(/_/g, " ")}
                    </div>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/70 text-xs">
                  <div>
                    <div className="text-slate-400">Customer</div>
                    <div className="font-semibold text-[#090D16]">
                      {tx.user?.fullName || "Unnamed"}
                    </div>
                    <div className="text-slate-500">{tx.user?.phoneNumber}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Recipient</div>
                    <div className="font-semibold text-[#090D16]">
                      {tx.recipientName || "—"}
                    </div>
                    <div className="text-slate-500 font-mono">
                      {tx.recipientAccountNumber || "—"} {tx.recipientBankName || ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Partner Ref</div>
                    <div className="font-mono text-[#090D16]">{tx.partnerReference || "—"}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Timestamp</div>
                    <div className="text-[#090D16]">{formatDateTime(tx.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <RoleGuard allowed={["SUPER_ADMIN", "OPERATIONS", "FINANCE", "SUPPORT"]}>
                  <button
                    onClick={handleRequery}
                    disabled={requerying}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#090D16] flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${requerying ? "animate-spin" : ""}`} />
                    {requerying ? "Querying Provider..." : "Re-query Banking Provider"}
                  </button>
                </RoleGuard>

                {canRequestRevert && (
                  <RoleGuard allowed={["SUPER_ADMIN", "OPERATIONS", "FINANCE", "SUPPORT"]}>
                    <button
                      onClick={() => setShowRevert(true)}
                      className="px-4 py-2 rounded-xl bg-[#090D16] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Request Revert (Maker)
                    </button>
                  </RoleGuard>
                )}
              </div>

              {requeryError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {requeryError}
                </div>
              )}

              {providerStatus && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Provider Response
                  </h3>
                  <pre className="p-3 rounded-xl bg-[#090D16] text-emerald-300 text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(providerStatus, null, 2)}
                  </pre>
                </div>
              )}

              {/* Ledger Entries */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Linked Double-Entry Ledger Entries
                </h3>
                {!tx.ledgerEntries || tx.ledgerEntries.length === 0 ? (
                  <p className="text-xs text-slate-400">No ledger entries recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {tx.ledgerEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={entry.type} />
                            <span className="font-semibold text-[#090D16]">
                              {formatNairaFromKobo(entry.amountInKobo)}
                            </span>
                          </div>
                          <div className="text-slate-500 mt-1">{entry.description || "—"}</div>
                        </div>
                        <div className="text-right text-[11px] text-slate-400 font-mono">
                          <div>Before: {formatNairaFromKobo(entry.balanceBeforeKobo)}</div>
                          <div>After: {formatNairaFromKobo(entry.balanceAfterKobo)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showRevert && tx && (
        <RequestRevertModal
          transactionId={tx.id}
          reference={tx.reference}
          amountInKobo={tx.amountInKobo}
          onClose={() => setShowRevert(false)}
          onSuccess={async () => {
            await Promise.all([load(), onRefreshList()]);
          }}
        />
      )}
    </div>
  );
}

