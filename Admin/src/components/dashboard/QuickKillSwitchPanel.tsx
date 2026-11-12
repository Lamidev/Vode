"use client";

import React, { useState } from "react";
import { AlertTriangle, Power } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { RoleGuard } from "@/components/RoleGuard";
import { useAdminAuth } from "@/context/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_REASONS = [
  "NIBSS Downtime",
  "Rubies Maintenance",
  "Security Hold",
  "Routine Inspection",
];

export function QuickKillSwitchPanel() {
  const { flags, refresh } = useAdminAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outwardTransfersEnabled = flags ? flags.outwardTransfersEnabled !== false : true;

  const handleToggle = async () => {
    const finalReason =
      reason.trim() ||
      (outwardTransfersEnabled ? "Manual pause by Admin" : "Manual resume by Admin");
    setError(null);
    setLoading(true);
    try {
      await adminApi.toggleKillSwitch(!outwardTransfersEnabled, finalReason);
      setReason("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to toggle kill-switch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowed={["SUPER_ADMIN", "OPERATIONS"]}>
      <div className="bg-white border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`p-1.5 shrink-0 ${
                outwardTransfersEnabled
                  ? "bg-slate-100 text-slate-800"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-[#090D16]">
                Emergency Outward Transfer Kill-Switch
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Instantly pauses or resumes all outward transfers across WhatsApp and the core ledger.
              </p>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase self-start sm:self-center shrink-0 ${
              outwardTransfersEnabled
                ? "bg-slate-100 text-slate-800 border border-slate-300"
                : "bg-red-600 text-white"
            }`}
          >
            {outwardTransfersEnabled ? "STATUS: ACTIVE" : "STATUS: PAUSED"}
          </span>
        </div>

        {/* 1-Click Preset Chips */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_REASONS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setReason(preset)}
              className={`px-2 py-0.5 text-[10px] font-mono border transition-colors cursor-pointer ${
                reason === preset
                  ? "bg-[#090D16] text-white border-[#090D16]"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional audit reason (or pick preset above)"
            className="flex-1"
          />
          <Button
            onClick={handleToggle}
            disabled={loading}
            variant={outwardTransfersEnabled ? "destructive" : "default"}
            size="sm"
            className="shrink-0"
          >
            <Power className="w-3.5 h-3.5" />
            {loading
              ? "Updating..."
              : outwardTransfersEnabled
              ? "Pause Outward Transfers"
              : "Resume Outward Transfers"}
          </Button>
        </div>
      </div>
    </RoleGuard>
  );
}
