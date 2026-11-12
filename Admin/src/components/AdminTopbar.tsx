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

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifs((v) => !v)}
              aria-label="Notifications"
              className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#090D16] transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 space-y-2 text-xs">
                <div className="font-display font-bold text-[#090D16] px-1 pb-1 border-b border-slate-100 flex items-center justify-between">
                  <span>Ops Alerts</span>
                  <span className="text-[11px] font-normal text-slate-400">Live status</span>
                </div>

                {alertCount === 0 ? (
                  <div className="py-4 text-center text-slate-500 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    All clear — no pending alerts.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {flags && !flags.outwardTransfersEnabled && (
                      <Link
                        href="/"
                        onClick={() => setShowNotifs(false)}
                        className="block p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-800 hover:bg-red-100/70"
                      >
                        <div className="font-semibold">Outward Transfers Paused</div>
                        <div className="text-[11px]">Kill-switch is currently active.</div>
                      </Link>
                    )}

                    {pendingApprovalsCount > 0 && (
                      <Link
                        href="/approvals"
                        onClick={() => setShowNotifs(false)}
                        className="block p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 hover:bg-amber-100/70"
                      >
                        <div className="font-semibold">
                          {pendingApprovalsCount} Pending Approval{pendingApprovalsCount > 1 ? "s" : ""}
                        </div>
                        <div className="text-[11px]">Review &amp; Revert queue needs attention.</div>
                      </Link>
                    )}

                    {admin && !admin.totpEnabled && (
                      <Link
                        href="/settings"
                        onClick={() => setShowNotifs(false)}
                        className="block p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100"
                      >
                        <div className="font-semibold">2FA Not Enabled</div>
                        <div className="text-[11px]">Bind your authenticator app in Team &amp; 2FA.</div>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
                onClick={() => setShowLogoutConfirm(true)}
                title="Sign out"
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#090D16]">
                  Sign Out of Ops?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your active admin session will be terminated.
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
                Yes, Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
