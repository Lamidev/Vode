"use client";

import React, { useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";

interface RequestUnfreezeModalProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function RequestUnfreezeModal({
  customerId,
  customerName,
  onClose,
  onSuccess,
}: RequestUnfreezeModalProps) {
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.requestUnfreezeCustomer(
        customerId,
        reason.trim(),
        evidenceUrl.trim() || undefined
      );
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit unfreeze request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-[#090D16] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-800" />
            Request Account Unfreeze (Maker)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Unfreezing <strong>{customerName}</strong> requires a second admin (Checker) to review
          your KYC verification notes in the Review &amp; Revert Queue.
        </p>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              KYC Verification Notes
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Completed video KYC + BVN last-4 match with customer"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#090D16]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Evidence / Ticket Link (Optional)
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://tickets.usevode.com/..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#090D16]"
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
              className="px-4 py-2 rounded-xl bg-[#090D16] hover:bg-black text-white text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors"
            >
              {submitting ? "Submitting..." : "Submit for Checker Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

