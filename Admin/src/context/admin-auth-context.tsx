"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminApi, AdminUser, SystemFlags } from "@/lib/api";

interface AdminAuthContextValue {
  admin: AdminUser | null;
  flags: SystemFlags | null;
  pendingApprovalsCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  admin: null,
  flags: null,
  pendingApprovalsCount: 0,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [flags, setFlags] = useState<SystemFlags | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const meRes = await adminApi.me();
      setAdmin(meRes.admin);

      const [cfgRes, overviewRes] = await Promise.all([
        adminApi.getSystemConfig().catch(() => null),
        adminApi.getOverview().catch(() => null),
      ]);
      if (cfgRes) setFlags(cfgRes.flags);
      if (overviewRes) setPendingApprovalsCount(overviewRes.kpis.pendingApprovals);
    } catch {
      setAdmin(null);
      if (pathname !== "/login") {
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const logout = useCallback(async () => {
    await adminApi.logout().catch(() => {});
    setAdmin(null);
    router.replace("/login");
  }, [router]);

  return (
    <AdminAuthContext.Provider
      value={{ admin, flags, pendingApprovalsCount, loading, refresh, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

