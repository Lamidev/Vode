"use client";

import React, { useCallback, useEffect, useState } from "react";
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { RoleGuard } from "@/components/RoleGuard";
import { adminApi, ApiError, ReconciliationBatch } from "@/lib/api";
import { formatDateTime, formatNairaFromKobo } from "@/lib/format";

export default function ReconciliationPage() {
  const [batches, setBatches] = useState<ReconciliationBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ReconciliationBatch | null>(null);
  const [providerName, setProviderName] = useState("RubiesMFB");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminApi.listReconciliations();
    setBatches(res.batches);
    if (res.batches.length > 0 && !selectedBatch) {
      const detail = await adminApi.getReconciliationBatch(res.batches[0].id);
      setSelectedBatch(detail.batch);
    }
  }, [selectedBatch]);

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error("CSV must contain a header row and at least one settlement row.");
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const refIdx = headers.findIndex((h) => h.includes("ref"));
      const amtIdx = headers.findIndex((h) => h.includes("amount"));
      const statusIdx = headers.findIndex((h) => h.includes("status"));

      if (refIdx === -1 || amtIdx === -1) {
        throw new Error("CSV header must include 'reference' and 'amount' columns.");
      }

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        return {
          reference: cols[refIdx] || "",
          amountInNaira: Number(cols[amtIdx] || 0),
          status: statusIdx !== -1 ? cols[statusIdx] || "SUCCESS" : "SUCCESS",
        };
      });

      const res = await adminApi.uploadReconciliationCsv({
        providerName,
        fileName: file.name,
        rows,
      });

      setSelectedBatch(res.batch);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Failed to process CSV."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const selectBatch = async (id: string) => {
    const res = await adminApi.getReconciliationBatch(id);
    setSelectedBatch(res.batch);
  };

  return (
    <AdminShell
      title="Partner Settlement Reconciliation"
      subtitle="Upload RubiesMFB / Paystack / NIBSS CSV statements to detect mismatches"
      onRefresh={load}
    >
      <RoleGuard allowed={["SUPER_ADMIN", "OPERATIONS", "FINANCE"]}>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-sm text-[#090D16]">
                Upload Partner Settlement CSV
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Expected CSV columns: <code>reference,amount,status</code> (amount in Naira).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              >
                <option value="RubiesMFB">RubiesMFB</option>
                <option value="Paystack">Paystack</option>
                <option value="Providus">Providus</option>
              </select>

              <label className="px-4 py-2 rounded-xl bg-[#090D16] hover:bg-black text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-xs">
                <UploadCloud className="w-4 h-4" />
                {uploading ? "Matching..." : "Upload CSV"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>
      </RoleGuard>

      {selectedBatch && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
              <div className="text-xs text-slate-500">Total Settlement Rows</div>
              <div className="font-display font-bold text-2xl text-[#090D16] mt-1">
                {selectedBatch.totalRows}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {selectedBatch.providerName} • {selectedBatch.fileName}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-200 p-4">
              <div className="text-xs text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Matched Cleanly
              </div>
              <div className="font-display font-bold text-2xl text-emerald-700 mt-1">
                {selectedBatch.matchedCount}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-amber-200 p-4">
              <div className="text-xs text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Discrepancies Flagged
              </div>
              <div className="font-display font-bold text-2xl text-amber-700 mt-1">
                {selectedBatch.discrepancyCount}
              </div>
            </div>
          </div>

          {selectedBatch.discrepancies && selectedBatch.discrepancies.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 font-display font-bold text-xs text-[#090D16]">
                Discrepancy Breakdown
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Mismatch Type</th>
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Internal Amount</th>
                      <th className="px-5 py-3 font-semibold">Partner Amount</th>
                      <th className="px-5 py-3 font-semibold">Internal vs Partner Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBatch.discrepancies.map((d) => (
                      <tr key={d.id}>
                        <td className="px-5 py-3 font-semibold text-red-700">
                          {d.type.replace(/_/g, " ")}
                        </td>
                        <td className="px-5 py-3 font-mono">{d.reference}</td>
                        <td className="px-5 py-3">
                          {d.internalAmount ? formatNairaFromKobo(d.internalAmount) : "—"}
                        </td>
                        <td className="px-5 py-3">
                          {d.partnerAmount ? formatNairaFromKobo(d.partnerAmount) : "—"}
                        </td>
                        <td className="px-5 py-3">
                          {d.internalStatus || "NONE"} → {d.partnerStatus || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 font-display font-bold text-xs text-[#090D16] flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-slate-700" />
          Past Reconciliation Batches
        </div>
        <div className="divide-y divide-slate-100">
          {batches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No reconciliation batches uploaded yet.
            </div>
          ) : (
            batches.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBatch(b.id)}
                className="w-full px-5 py-3.5 text-left hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-[#090D16]">
                    {b.providerName} — {b.fileName}
                  </div>
                  <div className="text-[11px] text-slate-400">{formatDateTime(b.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-semibold">{b.matchedCount} matched</span>
                  <span className="text-amber-700 font-semibold">
                    {b.discrepancyCount} flagged
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}

