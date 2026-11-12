"use client";

import React, { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { adminApi, ApiError } from "@/lib/api";
import { formatNairaFromKobo } from "@/lib/format";

interface RequestRevertModalProps {
  transactionId: string;
  reference: string;
  amountInKobo: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function RequestRevertModal({
  transactionId,
  reference,
  amountInKobo,
  onClose,
  onSuccess,
}: RequestRevertModalProps) {
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
      await adminApi.createApprovalRequest({
        type: "REVERSE_TRANSACTION",
        targetType: "TRANSACTION",
        targetId: transactionId,
        payload: { transactionId, reference, amountInKobo },
        reason: reason.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit reversal request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-[#090D16] flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#0E63F4]" />
            Request Compensating Reversal
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Reference</span>
            <span className="font-mono font-bold text-[#090D16]">{reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-[#090D16]">{formatNairaFromKobo(amountInKobo)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          This creates a Maker request in the Review &amp; Revert Queue. A second Admin (Checker)
          must approve before the wallet is credited via a compensating ledger entry.
        </p>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reversal Justification
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Provider re-query confirmed FAILED at NIBSS; customer wallet debited"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E63F4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Evidence / Provider Log URL (Optional)
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0E63F4]"
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
              className="px-4 py-2 rounded-xl bg-[#0E63F4] hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit Reversal Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

