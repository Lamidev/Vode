"use client";

import React, { useCallback, useEffect, useState } from "react";
import { UserPlus, ShieldCheck, KeyRound, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { RoleGuard } from "@/components/RoleGuard";
import { useAdminAuth } from "@/context/admin-auth-context";
import { adminApi, AdminRole, AdminUser, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export default function SettingsPage() {
  const { admin, refresh } = useAdminAuth();
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Create admin form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("SUPPORT");
  const [teamError, setTeamError] = useState<string | null>(null);

  // 2FA Setup
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpMsg, setTotpMsg] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    try {
      const res = await adminApi.listTeam();
      setMembers(res.members);
    } catch {
      // Non-SUPER_ADMIN/OPERATIONS users won't see team list
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadTeam);
  }, [loadTeam]);

  const handleInit2fa = async () => {
    setTotpMsg(null);
    const res = await adminApi.setup2fa();
    setTotpSecret(res.secret);
    setOtpauthUri(res.otpauthUri);
  };

  const handleConfirm2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpMsg(null);
    try {
      await adminApi.confirm2fa(totpCode);
      setTotpMsg("2FA enabled successfully!");
      setTotpSecret(null);
      setOtpauthUri(null);
      setTotpCode("");
      await refresh();
    } catch (err) {
      setTotpMsg(err instanceof ApiError ? err.message : "Failed to verify 2FA code.");
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError(null);
    try {
      await adminApi.createAdminUser({
        email: newEmail,
        fullName: newName,
        password: newPassword,
        role: newRole,
      });
      setShowCreate(false);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      await loadTeam();
    } catch (err) {
      setTeamError(err instanceof ApiError ? err.message : "Failed to create admin user.");
    }
  };

  const handleToggleActive = async (member: AdminUser) => {
    await adminApi.updateAdminUser(member.id, { isActive: !member.isActive });
    await loadTeam();
  };

  return (
    <AdminShell
      title="Team, RBAC & 2FA Security"
      subtitle="Manage operator roles and hardware/TOTP two-factor authentication"
      onRefresh={loadTeam}
    >
      {/* 2FA Setup Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                admin?.totpEnabled
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-[#090D16]">
                Your Two-Factor Authentication (TOTP)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {admin?.totpEnabled
                  ? "TOTP 2FA is active on your account."
                  : "Protect your admin session with Google Authenticator or 1Password."}
              </p>
            </div>
          </div>

          {!admin?.totpEnabled && !totpSecret && (
            <button
              onClick={handleInit2fa}
              className="px-4 py-2 rounded-xl bg-[#0E63F4] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              Setup 2FA Now
            </button>
          )}
        </div>

        {totpMsg && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
            {totpMsg}
          </div>
        )}

        {totpSecret && (
          <form onSubmit={handleConfirm2fa} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div>
              <div className="font-semibold text-[#090D16]">
                1. Add this Secret Key to your Authenticator App:
              </div>
              <div className="mt-1 font-mono font-bold text-sm bg-white p-2.5 rounded-lg border border-slate-200 select-all">
                {totpSecret}
              </div>
              {otpauthUri && (
                <div className="mt-1 text-[11px] text-slate-400 break-all">{otpauthUri}</div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="flex-1 w-full">
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Activate 2FA
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Admin Team Table */}
      <RoleGuard allowed={["SUPER_ADMIN", "OPERATIONS"]}>
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-sm text-[#090D16]">Admin Team</h2>
              <p className="text-xs text-slate-500">Role-based access control directory</p>
            </div>
            <RoleGuard allowed={["SUPER_ADMIN"]}>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-xl bg-[#090D16] hover:bg-[#1a2234] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Admin
              </button>
            </RoleGuard>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">2FA</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Last Login</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#090D16]">{m.fullName}</div>
                      <div className="text-[11px] text-slate-400">{m.email}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-[#0E63F4]">
                      {m.role}
                    </td>
                    <td className="px-5 py-3.5">
                      {m.totpEnabled ? (
                        <span className="text-emerald-700 font-semibold">Enabled</span>
                      ) : (
                        <span className="text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {m.isActive ? (
                        <span className="text-emerald-700 font-semibold">Active</span>
                      ) : (
                        <span className="text-red-600 font-semibold">Disabled</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDateTime(m.lastLoginAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <RoleGuard allowed={["SUPER_ADMIN"]}>
                        {m.id !== admin?.id && (
                          <button
                            onClick={() => handleToggleActive(m)}
                            className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                          >
                            {m.isActive ? "Disable" : "Enable"}
                          </button>
                        )}
                      </RoleGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </RoleGuard>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-[#090D16]">
                Create Admin Operator
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {teamError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{teamError}</div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Temporary Password (8+ chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="OPERATIONS">OPERATIONS</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0E63F4] text-white font-semibold cursor-pointer"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

