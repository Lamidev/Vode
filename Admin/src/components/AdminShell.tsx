"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopbar } from "@/components/AdminTopbar";
import { EmergencyKillSwitchBanner } from "@/components/EmergencyKillSwitchBanner";

interface AdminShellProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  children: React.ReactNode;
}

export function AdminShell({ title, subtitle, onRefresh, children }: AdminShellProps) {
  const { admin, loading } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#0E63F4] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#FAF9F5]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <EmergencyKillSwitchBanner />
        <AdminTopbar
          title={title}
          subtitle={subtitle}
          onRefresh={onRefresh}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-5 sm:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
