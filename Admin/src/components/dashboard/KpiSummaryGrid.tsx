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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-start justify-between shadow-[0_1px_2px_rgba(9,13,22,0.03)]"
          >
            <div>
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className="font-display font-bold text-2xl text-[#090D16] mt-1.5 tracking-tight">
                {card.value}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${card.accent}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

