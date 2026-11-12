"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  BookOpen,
  FileSpreadsheet,
  History,
  Settings,
  Lock,
} from "lucide-react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/approvals", label: "Review & Revert", icon: ShieldCheck, badgeKey: "approvals" as const },
  { href: "/ledger", label: "Double-Entry Ledger", icon: BookOpen },
  { href: "/reconciliation", label: "Reconciliation", icon: FileSpreadsheet },
  { href: "/audit", label: "Audit Logs", icon: History },
  { href: "/settings", label: "Team & 2FA", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { pendingApprovalsCount } = useAdminAuth();

  return (
    <aside className="w-64 shrink-0 bg-[#090D16] text-white min-h-screen flex flex-col border-r border-white/10">
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Vode"
            width={28}
            height={28}
            className="rounded-md object-contain"
          />
          <div>
            <div className="font-display font-extrabold text-base tracking-tight text-white leading-none">
              Vode <span className="text-[#00D084] font-bold text-xs">Ops</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Control &amp; Ledger</div>
          </div>
        </Link>
        <Lock className="w-3.5 h-3.5 text-[#00D084]" />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const showBadge = item.badgeKey === "approvals" && pendingApprovalsCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#0E63F4] text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </span>
              {showBadge && (
                <Badge variant="warning" className="bg-amber-400 text-[#090D16] border-none px-1.5">
                  {pendingApprovalsCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00D084]" />
          <span>Maker–Checker Enforced</span>
        </div>
        <p className="mt-1 text-slate-500">admin.usevode.com</p>
      </div>
    </aside>
  );
}
