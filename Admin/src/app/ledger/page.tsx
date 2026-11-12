"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertOctagon } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { adminApi, LedgerEntryRecord, TrialBalance } from "@/lib/api";
import { formatDateTime, formatNairaFromKobo } from "@/lib/format";

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntryRecord[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getLedger({
        type: typeFilter || undefined,
        limit: 100,
      });
      setEntries(res.entries);
      setTrialBalance(res.trialBalance);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <AdminShell
      title="Double-Entry Ledger Inspector"
      subtitle="Append-only financial journal & real-time trial balance"
      onRefresh={load}
    >
      {trialBalance && (
        <div
          className={`rounded-2xl border p-5 space-y-4 ${
            trialBalance.isBalanced
              ? "bg-emerald-50/50 border-emerald-200"
              : "bg-red-50 border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {trialBalance.isBalanced ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-red-600" />
              )}
              <div>
                <h2 className="font-display font-bold text-sm text-[#090D16]">
                  {trialBalance.isBalanced
                    ? "Trial Balance Verified (Balanced)"
                    : "LEDGER IMBALANCE DETECTED"}
                </h2>
                <p className="text-xs text-slate-600">
                  Net Ledger (Credits − Debits) vs Sum of Customer Wallet Liabilities
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                trialBalance.isBalanced
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {trialBalance.isBalanced ? "BALANCED" : "MISMATCH"}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-white rounded-xl p-3 border border-slate-200/70">
              <div className="text-slate-400">Total Credits</div>
              <div className="font-bold text-sm text-emerald-700 mt-0.5">
                {formatNairaFromKobo(trialBalance.totalCreditsKobo)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200/70">
              <div className="text-slate-400">Total Debits</div>
              <div className="font-bold text-sm text-[#090D16] mt-0.5">
                {formatNairaFromKobo(trialBalance.totalDebitsKobo)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200/70">
              <div className="text-slate-400">Net Ledger</div>
              <div className="font-bold text-sm text-[#090D16] mt-0.5">
                {formatNairaFromKobo(trialBalance.netLedgerKobo)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200/70">
              <div className="text-slate-400">Wallet Liabilities</div>
              <div className="font-bold text-sm text-[#090D16] mt-0.5">
                {formatNairaFromKobo(trialBalance.totalWalletLiabilitiesKobo)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Filter Journal Entries</span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
        >
          <option value="">All Entries</option>
          <option value="CREDIT">CREDIT Only</option>
          <option value="DEBIT">DEBIT Only</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Wallet Owner</th>
                <th className="px-5 py-3 font-semibold">Tx Reference</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Before → After</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading ledger journal...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No ledger entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <StatusBadge status={entry.type} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#090D16]">
                        {entry.wallet?.user?.fullName || "Unnamed"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {entry.wallet?.user?.phoneNumber}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      {entry.transaction?.reference || "—"}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#090D16]">
                      {formatNairaFromKobo(entry.amountInKobo)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {formatNairaFromKobo(entry.balanceBeforeKobo)} →{" "}
                      {formatNairaFromKobo(entry.balanceAfterKobo)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                      {entry.description || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDateTime(entry.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

