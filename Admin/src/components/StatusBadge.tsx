"use client";

import React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";

const VARIANT_MAP: Record<string, BadgeProps["variant"]> = {
  SUCCESS: "success",
  ACTIVE: "success",
  EXECUTED: "success",
  APPROVED: "success",
  CREDIT: "success",
  PENDING: "warning",
  PENDING_APPROVAL: "warning",
  DEBIT: "outline",
  FAILED: "destructive",
  FROZEN: "destructive",
  REJECTED: "destructive",
  REVERSED: "info",
  REVERSAL: "info",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = VARIANT_MAP[status?.toUpperCase()] || "outline";
  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}
