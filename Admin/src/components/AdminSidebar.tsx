"use client";

import React, { useState } from "react";
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
  MessageSquare,
  X,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/approvals", label: "Review & Revert", icon: ShieldCheck, badgeKey: "approvals" as const },
  { href: "/tickets", label: "Support & Tickets", icon: MessageSquare },
  { href: "/ledger", label: "Double-Entry Ledger", icon: BookOpen },
  { href: "/reconciliation", label: "Reconciliation", icon: FileSpreadsheet },
  { href: "/audit", label: "Audit Logs", icon: History },
  { href: "/settings", label: "Settings & System", icon: Settings },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { pendingApprovalsCount, logout, admin } = useAdminAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#090D16] text-white min-h-screen flex flex-col border-r border-white/10 transform transition-transform duration-150 ease-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Lockup */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Vode"
              width={26}
              height={26}
              className="rounded-none object-contain"
            />
            <div>
              <div className="font-display font-extrabold text-sm tracking-tight text-white leading-none">
                VODE <span className="text-slate-400 font-medium text-[11px]">OPS</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Control &amp; Ledger</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 rounded-none text-slate-400 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items (Square, sleek, high contrast) */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
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
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                  isActive
                    ? "bg-white/12 text-white font-bold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {item.label}
                </span>
                {showBadge && (
                  <span className="px-1.5 py-0.2 bg-white text-[#090D16] text-[10px] font-bold">
                    {pendingApprovalsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Admin Name & Role displayed clearly on both mobile and desktop */}
        <div className="p-3.5 border-t border-white/10 bg-black/40">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white font-bold text-xs uppercase">
                {admin?.fullName ? admin.fullName.charAt(0) : "A"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate leading-tight">
                  {admin?.fullName || "Operator"}
                </div>
                <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider truncate mt-0.5">
                  {admin?.role?.replace(/_/g, " ") || "SUPPORT"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out of Ops"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[#090D16]">
                  Sign Out of Ops?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm ending your admin session.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
