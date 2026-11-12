"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Search, Eye } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { CustomerDetailDrawer } from "@/components/customers/CustomerDetailDrawer";
import { adminApi, CustomerSummary } from "@/lib/api";
import { formatDateTime, formatNairaFromKobo } from "@/lib/format";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listCustomers({
        q: query || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setCustomers(res.customers);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <AdminShell
      title="Customers & Emergency Controls"
      subtitle={`${total.toLocaleString()} registered wallets`}
      onRefresh={load}
    >
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by phone (+234...), full name, or NUBAN account number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E63F4]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#0E63F4]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="FROZEN">FROZEN</option>
          <option value="PENDING_KYC">PENDING KYC</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">NUBAN</th>
                <th className="px-5 py-3 font-semibold">Tier</th>
                <th className="px-5 py-3 font-semibold">Balance</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No matching customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#090D16]">
                        {c.fullName || "Unnamed User"}
                      </div>
                      <div className="text-[11px] text-slate-500">{c.phoneNumber}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      {c.dedicatedNubans[0]?.accountNumber || "—"}
                    </td>
                    <td className="px-5 py-3.5 font-medium">Tier {c.kycTier}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#090D16]">
                      {formatNairaFromKobo(c.wallet?.balanceInKobo)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDateTime(c.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedId(c.id)}
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
        <CustomerDetailDrawer
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onRefreshList={load}
        />
      )}
    </AdminShell>
  );
}

