"use client";

import React, { useState } from "react";
import { X, Lock } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";

interface FreezeAccountModalProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function FreezeAccountModal({
  customerId,
  customerName,
  onClose,
  onSuccess,
}: FreezeAccountModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.freezeCustomer(customerId, reason.trim());
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to freeze account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-[#090D16] flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-600" />
            Freeze Customer Account
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          This will immediately lock <strong>{customerName}</strong>&apos;s wallet, revoke all
          active PIN tokens, and notify them on WhatsApp.
        </p>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory Freeze Reason
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer called reporting stolen phone / suspected unauthorized access"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Freezing..." : "Confirm Freeze"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

