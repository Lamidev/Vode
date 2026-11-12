"use client";

import React from "react";
import Link from "next/link";
import { TransactionRecord } from "@/lib/api";
import { formatDateTime, formatNairaFromKobo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export function LiveTransactionStream({
  transactions,
}: {
  transactions: TransactionRecord[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-sm text-[#090D16]">
            Recent Transaction Stream
          </h2>
          <p className="text-xs text-slate-500">Latest 12 ledger movements across Vode</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-[#090D16] hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
            <tr>
              <th className="px-5 py-3 font-semibold">Reference</th>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  No transactions recorded yet.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-mono font-medium text-[#090D16]">
                    {tx.reference}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-[#090D16]">
                      {tx.user?.fullName || "Unnamed User"}
                    </div>
                    <div className="text-[11px] text-slate-400">{tx.user?.phoneNumber}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{tx.type.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 font-semibold text-[#090D16]">
                    {formatNairaFromKobo(tx.amountInKobo)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDateTime(tx.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

