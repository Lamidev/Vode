"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, RefreshCw, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { Button } from "@/components/ui/button";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onMenuClick: () => void;
}

export function AdminTopbar({ title, subtitle, onRefresh, onMenuClick }: AdminTopbarProps) {
  const { admin, flags, pendingApprovalsCount, logout } = useAdminAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const alertCount =
    pendingApprovalsCount +
    (flags && !flags.outwardTransfersEnabled ? 1 : 0) +
    (admin && !admin.totpEnabled ? 1 : 0);

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="p-1.5 rounded-none border border-slate-300 text-[#090D16] hover:bg-slate-100 lg:hidden cursor-pointer shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm sm:text-lg text-[#090D16] tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {flags && (
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-[11px] font-bold border ${
                flags.outwardTransfersEnabled
                  ? "bg-slate-50 text-slate-800 border-slate-300"
                  : "bg-red-50 text-red-700 border-red-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 ${
                  flags.outwardTransfersEnabled ? "bg-emerald-600" : "bg-red-600 animate-ping"
                }`}
              />
              {flags.outwardTransfersEnabled ? "Transfers Active" : "Transfers Paused"}
            </div>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-none border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifs((v) => !v)}
              aria-label="Notifications"
              className="relative p-1.5 rounded-none border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-none shadow-xl border border-slate-300 p-3 z-50 space-y-2 text-xs">
                <div className="font-display font-bold text-[#090D16] px-1 pb-1 border-b border-slate-100 flex items-center justify-between">
                  <span>Ops Alerts</span>
                  <span className="text-[10px] font-mono text-slate-400">Live</span>
                </div>

                {alertCount === 0 ? (
                  <div className="py-4 text-center text-slate-500 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    All clear — no pending alerts.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {flags && !flags.outwardTransfersEnabled && (
                      <Link
                        href="/settings"
                        onClick={() => setShowNotifs(false)}
                        className="block p-2 rounded-none bg-red-50 border border-red-200 text-red-800 hover:bg-red-100"
                      >
                        <div className="font-bold">Outward Transfers Paused</div>
                        <div className="text-[11px]">System kill-switch is currently active.</div>
                      </Link>
                    )}

                    {pendingApprovalsCount > 0 && (
                      <Link
                        href="/approvals"
                        onClick={() => setShowNotifs(false)}
                        className="block p-2 rounded-none bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100"
                      >
                        <div className="font-bold">
                          {pendingApprovalsCount} Pending Approval{pendingApprovalsCount > 1 ? "s" : ""}
                        </div>
                        <div className="text-[11px]">Review &amp; Revert queue needs attention.</div>
                      </Link>
                    )}

                    {admin && !admin.totpEnabled && (
                      <Link
                        href="/settings"
                        onClick={() => setShowNotifs(false)}
                        className="block p-2 rounded-none bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100"
                      >
                        <div className="font-bold">2FA Not Enabled</div>
                        <div className="text-[11px]">Bind your authenticator app in Settings.</div>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {admin && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-[#090D16]">{admin.fullName}</div>
                <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 font-mono">
                  {!admin.totpEnabled && (
                    <span title="2FA not enabled yet">
                      <ShieldAlert className="w-3 h-3 text-amber-600 inline" />
                    </span>
                  )}
                  {admin.role}
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Sign out"
                className="p-1.5 rounded-none text-slate-500 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-none max-w-sm w-full p-5 space-y-4 border border-slate-300 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-red-50 text-red-600 border border-red-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[#090D16]">
                  Sign Out of Ops?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm ending your admin session.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
