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
  X,
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

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { pendingApprovalsCount } = useAdminAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#090D16] text-white min-h-screen flex flex-col border-r border-white/10 transform transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
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

          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#00D084] hidden lg:block" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            const showBadge = item.badgeKey === "approvals" && pendingApprovalsCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
    </>
  );
}
