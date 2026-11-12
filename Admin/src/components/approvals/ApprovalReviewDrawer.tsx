"use client";

import React, { useState } from "react";
import { X, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { adminApi, ApiError, ApprovalRequestRecord } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { useAdminAuth } from "@/context/admin-auth-context";

interface ApprovalReviewDrawerProps {
  request: ApprovalRequestRecord;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function ApprovalReviewDrawer({
  request,
  onClose,
  onSuccess,
}: ApprovalReviewDrawerProps) {
  const { admin, refresh } = useAdminAuth();
  const [checkerNotes, setCheckerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSameMaker = admin?.id === request.maker.id;
  const isSuperAdmin = admin?.role === "SUPER_ADMIN";
  const isPending = request.status === "PENDING_APPROVAL";
  const canCheck =
    isPending &&
    (isSuperAdmin || !isSameMaker) &&
    admin &&
    ["SUPER_ADMIN", "OPERATIONS", "FINANCE"].includes(admin.role);

  const handleApprove = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.approveRequest(request.id, checkerNotes.trim() || undefined);
      await Promise.all([refresh(), onSuccess()]);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to approve request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!checkerNotes.trim()) {
      setError("Checker notes are mandatory when rejecting a request.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.rejectRequest(request.id, checkerNotes.trim());
      await Promise.all([refresh(), onSuccess()]);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reject request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-[#090D16]">
              Maker–Checker Review
            </h2>
            <p className="text-xs text-slate-400 font-mono">{request.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-[#090D16]">
                {request.type.replace(/_/g, " ")}
              </span>
              <StatusBadge status={request.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
              <div>
                <div className="text-slate-400">Maker</div>
                <div className="font-semibold text-[#090D16]">{request.maker.fullName}</div>
                <div className="text-slate-500">{request.maker.role}</div>
              </div>
              <div>
                <div className="text-slate-400">Submitted</div>
                <div className="text-[#090D16]">{formatDateTime(request.createdAt)}</div>
              </div>
              <div>
                <div className="text-slate-400">Target</div>
                <div className="font-mono text-[#090D16]">
                  {request.targetType}: {request.targetId}
                </div>
              </div>
              {request.checker && (
                <div>
                  <div className="text-slate-400">Checker</div>
                  <div className="font-semibold text-[#090D16]">{request.checker.fullName}</div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Maker Reason
            </h3>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-[#090D16]">
              {request.reason}
            </div>
            {request.evidenceUrl && (
              <div className="mt-2">
                <span className="text-slate-500">Evidence: </span>
                <span className="font-mono text-slate-800 underline break-all">{request.evidenceUrl}</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Execution Payload
            </h3>
            <pre className="p-3 rounded-xl bg-[#090D16] text-slate-200 font-mono text-[11px] overflow-x-auto">
              {JSON.stringify(request.payload, null, 2)}
            </pre>
          </div>

          {request.checkerNotes && (
            <div>
              <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Checker Notes
              </h3>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                {request.checkerNotes}
              </div>
            </div>
          )}

          {isPending && isSameMaker && !isSuperAdmin && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Segregation of Duties:</strong> You created this Maker request, so a
                different Admin must approve or reject it.
              </span>
            </div>
          )}

          {isPending && isSameMaker && isSuperAdmin && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>
                <strong>Solo Founder Override:</strong> As <code>SUPER_ADMIN</code>, you can
                approve and execute your own request directly.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {canCheck && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Checker Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={checkerNotes}
                  onChange={(e) => setCheckerNotes(e.target.value)}
                  placeholder="Optional for approval; mandatory for rejection..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#090D16]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? "Executing..." : "Approve & Execute"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

