"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Search, Eye, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { adminApi, AuditLogRecord } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs({
        action: actionFilter || undefined,
        limit: 100,
      });
      setLogs(res.logs);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <AdminShell
      title="Immutable Admin Audit Logs"
      subtitle={`${total.toLocaleString()} recorded administrative actions`}
      onRefresh={load}
    >
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by action (e.g., FREEZE_CUSTOMER, PAUSE_OUTWARD_TRANSFERS, APPROVE)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E63F4]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Admin</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Target</th>
                <th className="px-5 py-3 font-semibold">IP Address</th>
                <th className="px-5 py-3 font-semibold text-right">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#090D16]">
                        {log.adminUser?.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400">{log.adminUser?.role}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#0E63F4]">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {log.targetType}: {log.targetId.slice(0, 14)}…
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {log.ipAddress || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelected(log)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium cursor-pointer"
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

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[#090D16]">
                Audit State Diff — {selected.action}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selected.reason && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <strong>Reason:</strong> {selected.reason}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-500 mb-1">Before State</div>
                <pre className="p-3 rounded-xl bg-[#090D16] text-slate-300 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selected.beforeState ?? null, null, 2)}
                </pre>
              </div>
              <div>
                <div className="font-bold text-slate-500 mb-1">After State</div>
                <pre className="p-3 rounded-xl bg-[#090D16] text-emerald-300 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selected.afterState ?? null, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

