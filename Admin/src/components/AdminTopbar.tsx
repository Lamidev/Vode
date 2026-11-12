"use client";

import React from "react";
import { LogOut, Menu, RefreshCw, ShieldAlert } from "lucide-react";
import { useAdminAuth } from "@/context/admin-auth-context";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onMenuClick: () => void;
}

export function AdminTopbar({ title, subtitle, onRefresh, onMenuClick }: AdminTopbarProps) {
  const { admin, flags, logout } = useAdminAuth();

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="p-2 -ml-1 rounded-lg border border-slate-200 text-[#090D16] hover:bg-slate-50 lg:hidden cursor-pointer shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <h1 className="font-display font-bold text-base sm:text-xl text-[#090D16] tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {flags && (
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
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
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {admin && (
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
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
