"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { KpiSummaryGrid } from "@/components/dashboard/KpiSummaryGrid";
import { LiveTransactionStream } from "@/components/dashboard/LiveTransactionStream";
import { adminApi, OverviewResponse } from "@/lib/api";

export default function CommandCenterPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await adminApi.getOverview();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overview.");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <AdminShell
      title="Command Center"
      subtitle="Live liquidity, recent volume, and real-time transaction stream"
      onRefresh={load}
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {data ? (
        <>
          <KpiSummaryGrid kpis={data.kpis} />
          <LiveTransactionStream transactions={data.recentTransactions} />
        </>
      ) : (
        <div className="bg-white border border-slate-200 p-8 text-center text-xs text-slate-400">
          Loading Command Center telemetry...
        </div>
      )}
    </AdminShell>
  );
}

