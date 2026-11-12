"use client";

import React, { useCallback, useEffect, useState } from "react";
import { UserPlus, ShieldCheck, KeyRound, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { RoleGuard } from "@/components/RoleGuard";
import { useAdminAuth } from "@/context/admin-auth-context";
import { adminApi, AdminRole, AdminUser, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { QuickKillSwitchPanel } from "@/components/dashboard/QuickKillSwitchPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      title="Settings & System Control"
      subtitle="Kill-switches, operator team management, and 2FA authentication"
      onRefresh={loadTeam}
    >
      {/* 1. Emergency Controls Section */}
      <div className="space-y-2">
        <h2 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
          System Emergency Controls
        </h2>
        <QuickKillSwitchPanel />
      </div>

      {/* 2. 2FA Setup Card */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-slate-100 text-slate-800 shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-[#090D16]">
                Two-Factor Authentication (TOTP)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {admin?.totpEnabled
                  ? "TOTP 2FA is active on your admin account."
                  : "Protect your admin login with Google Authenticator or 1Password."}
              </p>
            </div>
          </div>

          {!admin?.totpEnabled && !totpSecret && (
            <Button size="sm" onClick={handleInit2fa} className="self-start sm:self-center">
              Setup 2FA
            </Button>
          )}
        </div>

        {totpMsg && (
          <div className="p-2.5 bg-slate-100 border border-slate-300 text-xs text-[#090D16]">
            {totpMsg}
          </div>
        )}

        {totpSecret && (
          <form onSubmit={handleConfirm2fa} className="p-3 bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div>
              <div className="font-bold text-[#090D16]">1. Add Secret Key to Authenticator App:</div>
              <div className="mt-1 font-mono font-bold text-xs bg-white p-2 border border-slate-300 select-all">
                {totpSecret}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  2. Enter 6-Digit Code
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="font-mono text-center tracking-widest"
                />
              </div>
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                <ShieldCheck className="w-3.5 h-3.5" />
                Activate 2FA
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Admin Team Table */}
      <RoleGuard allowed={["SUPER_ADMIN", "OPERATIONS"]}>
        <div className="bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-[#090D16]">Admin Operators</h3>
              <p className="text-[11px] text-slate-500">Authorized platform staff</p>
            </div>
            <RoleGuard allowed={["SUPER_ADMIN"]}>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <UserPlus className="w-3.5 h-3.5" />
                Add Admin
              </Button>
            </RoleGuard>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Name</th>
                  <th className="px-4 py-2.5 font-bold">Role</th>
                  <th className="px-4 py-2.5 font-bold">2FA</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold">Last Login</th>
                  <th className="px-4 py-2.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-[#090D16]">{m.fullName}</div>
                      <div className="text-[11px] text-slate-500">{m.email}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-[#090D16]">
                      {m.role}
                    </td>
                    <td className="px-4 py-2.5">
                      {m.totpEnabled ? (
                        <span className="text-emerald-700 font-bold">Enabled</span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {m.isActive ? (
                        <span className="font-bold text-[#090D16]">Active</span>
                      ) : (
                        <span className="text-red-600 font-bold">Disabled</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                      {formatDateTime(m.lastLoginAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <RoleGuard allowed={["SUPER_ADMIN"]}>
                        {m.id !== admin?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(m)}
                            className="h-7 text-[11px]"
                          >
                            {m.isActive ? "Disable" : "Enable"}
                          </Button>
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

      {/* Create Admin Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-none max-w-sm w-full p-5 space-y-3.5 border border-slate-300 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#090D16]">
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
              <div className="p-2 bg-red-50 text-red-700 text-xs border border-red-200">{teamError}</div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
                <Input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Work Email</label>
                <Input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john@usevode.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Temporary Password (8+)</label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full h-9 px-2 border border-slate-300 bg-white text-xs rounded-none"
                >
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="OPERATIONS">OPERATIONS</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create Admin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
