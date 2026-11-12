"use client";

import React from "react";
import { LogOut, RefreshCw, ShieldAlert } from "lucide-react";
import { useAdminAuth } from "@/context/admin-auth-context";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function AdminTopbar({ title, subtitle, onRefresh }: AdminTopbarProps) {
  const { admin, flags, logout } = useAdminAuth();

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <h1 className="font-display font-bold text-xl text-[#090D16] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {flags && (
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              flags.outwardTransfersEnabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                flags.outwardTransfersEnabled ? "bg-emerald-500" : "bg-red-500 animate-ping"
              }`}
            />
            {flags.outwardTransfersEnabled ? "Transfers Active" : "Transfers Paused"}
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        )}

        {admin && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-[#090D16]">{admin.fullName}</div>
              <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                {!admin.totpEnabled && (
                  <span title="2FA not enabled yet">
                    <ShieldAlert className="w-3 h-3 text-amber-500 inline" />
                  </span>
                )}
                {admin.role}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

