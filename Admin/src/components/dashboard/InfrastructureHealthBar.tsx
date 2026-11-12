"use client";

import React from "react";
import { Database, Landmark, Cpu, ShieldCheck } from "lucide-react";
import { OverviewResponse } from "@/lib/api";

export function InfrastructureHealthBar({ health }: { health: OverviewResponse["health"] }) {
  const items = [
    { label: "PostgreSQL Ledger", value: health.database, icon: Database, ok: health.database === "ONLINE" },
    { label: "Banking Rail", value: health.bankingProvider, icon: Landmark, ok: true },
    { label: "AI Intent Engine", value: health.aiProvider, icon: Cpu, ok: true },
    {
      label: "Outward Switch",
      value: health.outwardTransfersEnabled ? "ENABLED" : "PAUSED",
      icon: ShieldCheck,
      ok: health.outwardTransfersEnabled,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-slate-200/80 px-4 py-3 flex items-center gap-3"
          >
            <div
              className={`p-2 rounded-lg ${
                item.ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500">{item.label}</div>
              <div className="text-xs font-bold text-[#090D16] truncate uppercase">{item.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

