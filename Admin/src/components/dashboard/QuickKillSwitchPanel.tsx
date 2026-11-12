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

const PRESET_REASONS = [
  "NIBSS Downtime",
  "Rubies Maintenance",
  "Security Hold",
  "Routine Inspection",
];

export function QuickKillSwitchPanel({
  outwardTransfersEnabled,
  onUpdated,
}: QuickKillSwitchPanelProps) {
  const { refresh } = useAdminAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    const finalReason =
      reason.trim() ||
      (outwardTransfersEnabled ? "Manual pause by Admin" : "Manual resume by Admin");
    setError(null);
    setLoading(true);
    try {
      await adminApi.toggleKillSwitch(!outwardTransfersEnabled, finalReason);
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
                WhatsApp automatically handles normal bank errors; use this brake only for major
                maintenance or security holds.
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
              outwardTransfersEnabled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {outwardTransfersEnabled ? "ACTIVE" : "PAUSED"}
          </span>
        </div>

        {/* 1-Click Preset Chips */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_REASONS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setReason(preset)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                reason === preset
                  ? "bg-[#090D16] text-white border-[#090D16]"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional note (or pick a preset above)"
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#090D16]/20"
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
