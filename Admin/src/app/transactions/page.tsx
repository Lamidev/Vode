"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Search, Eye } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { TransactionDetailDrawer } from "@/components/transactions/TransactionDetailDrawer";
import { adminApi, TransactionRecord } from "@/lib/api";
import { formatDateTime, formatNairaFromKobo } from "@/lib/format";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listTransactions({
        q: query || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        limit: 50,
      });
      setTransactions(res.transactions);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, typeFilter]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <AdminShell
      title="Transactions & Provider Re-Query"
      subtitle={`${total.toLocaleString()} ledger transactions`}
      onRefresh={load}
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference, partner ref, account number, or recipient..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E63F4]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="REVERSED">REVERSED</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
        >
          <option value="">All Types</option>
          <option value="TRANSFER_IN">TRANSFER IN</option>
          <option value="TRANSFER_OUT">TRANSFER OUT</option>
          <option value="AIRTIME">AIRTIME</option>
          <option value="DATA">DATA</option>
          <option value="REVERSAL">REVERSAL</option>
          <option value="ADJUSTMENT">ADJUSTMENT</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Recipient</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No matching transactions.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono font-medium text-[#090D16]">
                      {tx.reference}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#090D16]">
                        {tx.user?.fullName || "Unnamed"}
                      </div>
                      <div className="text-[11px] text-slate-400">{tx.user?.phoneNumber}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{tx.type.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-[#090D16]">{tx.recipientName || "—"}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {tx.recipientAccountNumber || ""}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#090D16]">
                      {formatNairaFromKobo(tx.amountInKobo)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDateTime(tx.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedId(tx.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-[#090D16] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && (
        <TransactionDetailDrawer
          transactionId={selectedId}
          onClose={() => setSelectedId(null)}
          onRefreshList={load}
        />
      )}
    </AdminShell>
  );
}

