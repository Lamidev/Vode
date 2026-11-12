"use client";

import React from "react";
import { AdminRole } from "@/lib/api";
import { useAdminAuth } from "@/context/admin-auth-context";

interface RoleGuardProps {
  allowed: AdminRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowed, children, fallback = null }: RoleGuardProps) {
  const { admin } = useAdminAuth();
  if (!admin || !allowed.includes(admin.role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

