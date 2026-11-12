"use client";

import React from "react";
import { AlertOctagon } from "lucide-react";
import { useAdminAuth } from "@/context/admin-auth-context";

export function EmergencyKillSwitchBanner() {
  const { flags } = useAdminAuth();

  if (!flags || flags.outwardTransfersEnabled !== false) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium shadow-sm">
      <div className="flex items-center gap-2.5">
        <AlertOctagon className="w-4 h-4 shrink-0 animate-pulse" />
        <span>
          <strong>EMERGENCY KILL-SWITCH ACTIVE:</strong> All outward bank transfers are currently
          paused across WhatsApp &amp; Core Ledger.
        </span>
      </div>
      <span className="hidden md:inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-semibold">
        Outward Paused
      </span>
    </div>
  );
}

