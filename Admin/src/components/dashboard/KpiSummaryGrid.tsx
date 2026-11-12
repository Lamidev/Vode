"use client";

import React from "react";
import { Users, ShieldAlert, ArrowDownLeft, ArrowUpRight, Wallet, Clock } from "lucide-react";
import { OverviewResponse } from "@/lib/api";
import { formatNairaFromKobo } from "@/lib/format";

export function KpiSummaryGrid({ kpis }: { kpis: OverviewResponse["kpis"] }) {
  const cards = [
    {
      label: "24h Inflows",
      value: formatNairaFromKobo(kpis.inflow24hKobo),
      sub: "Successful NIBSS credits",
      icon: ArrowDownLeft,
      accent: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "24h Outflows",
      value: formatNairaFromKobo(kpis.outflow24hKobo),
      sub: "Settled outward transfers",
      icon: ArrowUpRight,
      accent: "text-[#0E63F4] bg-blue-50",
    },
    {
      label: "Total Fees Earned",
      value: formatNairaFromKobo(kpis.totalFeesEarnedKobo),
      sub: "Cumulative platform revenue",
      icon: Wallet,
      accent: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Active / Total Users",
      value: `${kpis.activeUsers.toLocaleString()} / ${kpis.totalUsers.toLocaleString()}`,
      sub: `${kpis.frozenUsers} frozen accounts`,
      icon: Users,
      accent: "text-slate-700 bg-slate-100",
    },
    {
      label: "Pending Approvals",
      value: String(kpis.pendingApprovals),
      sub: "Maker–Checker queue",
      icon: Clock,
      accent:
        kpis.pendingApprovals > 0
          ? "text-amber-700 bg-amber-50"
          : "text-slate-600 bg-slate-100",
    },
    {
      label: "Frozen Accounts",
      value: String(kpis.frozenUsers),
      sub: "Emergency / Ops locked",
      icon: ShieldAlert,
      accent: kpis.frozenUsers > 0 ? "text-red-600 bg-red-50" : "text-slate-600 bg-slate-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(9,13,22,0.03)] space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 line-clamp-1">{card.label}</p>
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div>
              <p className="font-display font-bold text-lg sm:text-2xl text-[#090D16] tracking-tight truncate">
                {card.value}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 line-clamp-1">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

