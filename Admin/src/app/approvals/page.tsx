"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ApprovalReviewDrawer } from "@/components/approvals/ApprovalReviewDrawer";
import { adminApi, ApprovalRequestRecord } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const TABS = [
  { key: "PENDING_APPROVAL", label: "Pending Review" },
  { key: "EXECUTED", label: "Executed" },
  { key: "REJECTED", label: "Rejected" },
  { key: "", label: "All Requests" },
];

export default function ApprovalsPage() {
  const [statusTab, setStatusTab] = useState("PENDING_APPROVAL");
  const [requests, setRequests] = useState<ApprovalRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApprovalRequestRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listApprovals(statusTab || undefined);
      setRequests(res.requests);
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <AdminShell
      title="Maker–Checker Review & Revert Queue"
      subtitle="Dual-control authorization for reversals, unfreezes, and ledger adjustments"
      onRefresh={load}
    >
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              statusTab === tab.key
                ? "bg-[#090D16] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3 font-semibold">Action Type</th>
                <th className="px-5 py-3 font-semibold">Target</th>
                <th className="px-5 py-3 font-semibold">Maker</th>
                <th className="px-5 py-3 font-semibold">Checker</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Loading approval queue...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No requests in this queue.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-semibold text-[#090D16]">
                      {req.type.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {req.targetType}: {req.targetId.slice(0, 14)}…
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#090D16]">{req.maker.fullName}</div>
                      <div className="text-[11px] text-slate-400">{req.maker.role}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {req.checker ? req.checker.fullName : "Awaiting Checker"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDateTime(req.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelected(req)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-[#090D16] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ApprovalReviewDrawer
          request={selected}
          onClose={() => setSelected(null)}
          onSuccess={load}
        />
      )}
    </AdminShell>
  );
}

