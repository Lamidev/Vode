"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { KpiSummaryGrid } from "@/components/dashboard/KpiSummaryGrid";
import { QuickKillSwitchPanel } from "@/components/dashboard/QuickKillSwitchPanel";
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
      subtitle="Live liquidity, rail health, and emergency kill-switches"
      onRefresh={load}
    >
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {data ? (
        <>
          <KpiSummaryGrid kpis={data.kpis} />
          <QuickKillSwitchPanel
            outwardTransfersEnabled={data.health.outwardTransfersEnabled}
            onUpdated={load}
          />
          <LiveTransactionStream transactions={data.recentTransactions} />
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-400">
          Loading Command Center telemetry...
        </div>
      )}
    </AdminShell>
  );
}

