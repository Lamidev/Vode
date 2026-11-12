"use client";

import React, { useState } from "react";
import { AlertTriangle, Power } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { RoleGuard } from "@/components/RoleGuard";
import { useAdminAuth } from "@/context/admin-auth-context";

interface QuickKillSwitchPanelProps {
  outwardTransfersEnabled: boolean;
  onUpdated: () => Promise<void>;
}

export function QuickKillSwitchPanel({
  outwardTransfersEnabled,
  onUpdated,
}: QuickKillSwitchPanelProps) {
  const { refresh } = useAdminAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!reason.trim()) {
      setError("A mandatory operational reason is required to toggle the kill-switch.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await adminApi.toggleKillSwitch(!outwardTransfersEnabled, reason.trim());
      setReason("");
      await Promise.all([refresh(), onUpdated()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to toggle kill-switch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowed={["SUPER_ADMIN", "OPERATIONS"]}>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                outwardTransfersEnabled
                  ? "bg-amber-50 text-amber-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-[#090D16]">
                Emergency Outward Transfer Kill-Switch
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Instantly pauses or resumes all outward bank transfers across WhatsApp &amp; Core
                Ledger.
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              outwardTransfersEnabled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {outwardTransfersEnabled ? "ACTIVE" : "PAUSED"}
          </span>
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mandatory audit reason (e.g., NIBSS outage / Rubies maintenance)"
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E63F4]"
          />
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer ${
              outwardTransfersEnabled
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {loading
              ? "Updating..."
              : outwardTransfersEnabled
              ? "Pause Outward Transfers"
              : "Resume Outward Transfers"}
          </button>
        </div>
      </div>
    </RoleGuard>
  );
}

