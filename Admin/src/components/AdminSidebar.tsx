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
import { Badge } from "@/components/ui/badge";
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
  { href: "/settings", label: "Team & 2FA", icon: Settings },
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#090D16] text-white min-h-screen flex flex-col border-r border-white/10 transform transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Lockup */}
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
                Vode <span className="text-slate-400 font-medium text-xs">Ops</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Control &amp; Ledger</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items (Sleek Obsidian/Mint selection instead of bright blue) */}
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  {item.label}
                </span>
                {showBadge && (
                  <Badge variant="outline" className="bg-white/10 text-white border-white/15 px-1.5 text-[10px]">
                    {pendingApprovalsCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Footer & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {admin?.fullName || "Operator"}
              </div>
              <div className="text-[11px] text-slate-400 truncate">{admin?.role}</div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out of Admin"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="text-slate-400">Solo Override Active</span>
            <span className="font-mono text-slate-500">v1.0</span>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#090D16]">
                  Sign Out of Ops?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your active admin session will be terminated.
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
                Yes, Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
