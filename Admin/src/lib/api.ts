export type AdminRole = "SUPER_ADMIN" | "OPERATIONS" | "FINANCE" | "SUPPORT";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  totpEnabled: boolean;
  isActive?: boolean;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  createdAt?: string;
}

export interface SystemFlags {
  outwardTransfersEnabled: boolean;
  [key: string]: unknown;
}

export interface OverviewResponse {
  kpis: {
    totalUsers: number;
    activeUsers: number;
    frozenUsers: number;
    pendingApprovals: number;
    inflow24hKobo: string;
    outflow24hKobo: string;
    totalFeesEarnedKobo: string;
  };
  health: {
    database: string;
    bankingProvider: string;
    aiProvider: string;
    outwardTransfersEnabled: boolean;
  };
  recentTransactions: TransactionRecord[];
}

export interface CustomerSummary {
  id: string;
  phoneNumber: string;
  fullName: string | null;
  bvnLast4: string | null;
  status: string;
  kycTier: number;
  pinFailedAttempts: number;
  pinLockedUntil: string | null;
  createdAt: string;
  wallet: {
    id: string;
    balanceInKobo: string;
    isLocked: boolean;
  } | null;
  dedicatedNubans: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  }[];
}

export interface CustomerDetail extends CustomerSummary {
  updatedAt: string;
  beneficiaries: {
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    transferCount: number;
  }[];
  emergencyFreezeLogs: {
    id: string;
    reference: string;
    channel: string;
    ipAddress: string | null;
    createdAt: string;
  }[];
  transactions: TransactionRecord[];
}

export interface TransactionRecord {
  id: string;
  reference: string;
  partnerReference: string | null;
  type: string;
  status: string;
  amountInKobo: string;
  feeInKobo: string;
  recipientBankCode: string | null;
  recipientBankName: string | null;
  recipientAccountNumber: string | null;
  recipientName: string | null;
  narration: string | null;
  createdAt: string;
  user?: {
    id?: string;
    fullName: string | null;
    phoneNumber: string;
    kycTier?: number;
  };
  ledgerEntries?: LedgerEntryRecord[];
}

export interface ApprovalRequestRecord {
  id: string;
  type: string;
  status: string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
  reason: string;
  evidenceUrl: string | null;
  checkerNotes: string | null;
  executedAt: string | null;
  createdAt: string;
  maker: { id: string; fullName: string; email: string; role: AdminRole };
  checker: { id: string; fullName: string; email: string; role: AdminRole } | null;
}

export interface LedgerEntryRecord {
  id: string;
  type: "CREDIT" | "DEBIT";
  amountInKobo: string;
  balanceBeforeKobo: string;
  balanceAfterKobo: string;
  description: string | null;
  createdAt: string;
  wallet?: {
    user?: {
      fullName: string | null;
      phoneNumber: string;
    };
  };
  transaction?: {
    reference: string;
    type: string;
    status: string;
  };
}

export interface TrialBalance {
  totalCreditsKobo: string;
  totalDebitsKobo: string;
  netLedgerKobo: string;
  totalWalletLiabilitiesKobo: string;
  isBalanced: boolean;
}

export interface ReconciliationBatch {
  id: string;
  providerName: string;
  fileName: string;
  totalRows: number;
  matchedCount: number;
  discrepancyCount: number;
  uploadedBy: string;
  createdAt: string;
  discrepancies?: {
    id: string;
    type: string;
    reference: string;
    partnerRef: string | null;
    internalAmount: string | null;
    partnerAmount: string | null;
    internalStatus: string | null;
    partnerStatus: string | null;
    resolved: boolean;
  }[];
}

export interface SupportTicketMessage {
  id: string;
  sender: "CUSTOMER" | "ADMIN" | "SYSTEM";
  senderId: string | null;
  message: string;
  createdAt: string;
}

export interface SupportTicketRecord {
  id: string;
  ticketNumber: string;
  userId: string | null;
  phoneNumber: string;
  customerName: string | null;
  subject: string;
  issueCategory: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  lastMessage: string;
  transactionRef: string | null;
  assignedAdminId: string | null;
  assignedAdmin?: { fullName: string; email: string } | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: SupportTicketMessage[];
}

export interface AuditLogRecord {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeState: unknown;
  afterState: unknown;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  adminUser: {
    fullName: string;
    email: string;
    role: AdminRole;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7050";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const adminApi = {
  // Auth
  bootstrapStatus: () =>
    apiFetch<{ needsBootstrap: boolean }>("/admin/auth/bootstrap-status"),
  bootstrap: (body: { email: string; fullName: string; password: string }) =>
    apiFetch<{ success: boolean; admin: AdminUser; totpSecret: string; otpauthUri: string }>(
      "/admin/auth/bootstrap",
      { method: "POST", body: JSON.stringify(body) }
    ),
  login: (body: { email: string; password: string }) =>
    apiFetch<{ requires2fa: boolean; challengeToken?: string; admin?: AdminUser }>(
      "/admin/auth/login",
      { method: "POST", body: JSON.stringify(body) }
    ),
  verify2fa: (body: { challengeToken: string; code: string }) =>
    apiFetch<{ success: boolean; admin: AdminUser }>("/admin/auth/verify-2fa", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => apiFetch<{ success: boolean }>("/admin/auth/logout", { method: "POST" }),
  me: () => apiFetch<{ admin: AdminUser }>("/admin/auth/me"),
  setup2fa: () =>
    apiFetch<{ secret: string; otpauthUri: string }>("/admin/auth/setup-2fa", { method: "POST" }),
  confirm2fa: (code: string) =>
    apiFetch<{ success: boolean }>("/admin/auth/confirm-2fa", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  // Overview & Kill Switch
  getOverview: () => apiFetch<OverviewResponse>("/admin/overview"),
  getSystemConfig: () => apiFetch<{ flags: SystemFlags }>("/admin/system-config"),
  toggleKillSwitch: (outwardTransfersEnabled: boolean, reason: string) =>
    apiFetch<{ success: boolean; outwardTransfersEnabled: boolean }>(
      "/admin/system-config/kill-switch",
      { method: "POST", body: JSON.stringify({ outwardTransfersEnabled, reason }) }
    ),

  // Customers
  listCustomers: (params?: { q?: string; status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    return apiFetch<{ customers: CustomerSummary[]; total: number }>(
      `/admin/customers?${qs.toString()}`
    );
  },
  getCustomerDetail: (id: string) =>
    apiFetch<{ customer: CustomerDetail }>(`/admin/customers/${id}`),
  freezeCustomer: (id: string, reason: string) =>
    apiFetch<{ success: boolean; freezeRef: string }>(`/admin/customers/${id}/freeze`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  requestUnfreezeCustomer: (id: string, reason: string, evidenceUrl?: string) =>
    apiFetch<{ success: boolean; request: ApprovalRequestRecord }>(
      `/admin/customers/${id}/request-unfreeze`,
      { method: "POST", body: JSON.stringify({ reason, evidenceUrl }) }
    ),

  // Transactions
  listTransactions: (params?: {
    q?: string;
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status) qs.set("status", params.status);
    if (params?.type) qs.set("type", params.type);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    return apiFetch<{ transactions: TransactionRecord[]; total: number }>(
      `/admin/transactions?${qs.toString()}`
    );
  },
  getTransactionDetail: (id: string) =>
    apiFetch<{ transaction: TransactionRecord }>(`/admin/transactions/${id}`),
  requeryTransaction: (id: string) =>
    apiFetch<{
      reference: string;
      internalStatus: string;
      providerStatus: Record<string, unknown>;
    }>(`/admin/transactions/${id}/requery`, { method: "POST" }),

  // Approvals (Maker-Checker)
  listApprovals: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetch<{ requests: ApprovalRequestRecord[] }>(`/admin/approvals${qs}`);
  },
  createApprovalRequest: (body: {
    type: string;
    targetType: string;
    targetId: string;
    payload?: Record<string, unknown>;
    reason: string;
    evidenceUrl?: string;
  }) =>
    apiFetch<{ success: boolean; request: ApprovalRequestRecord }>("/admin/approvals", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  approveRequest: (id: string, checkerNotes?: string) =>
    apiFetch<{ success: boolean; message: string }>(`/admin/approvals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ checkerNotes }),
    }),
  rejectRequest: (id: string, checkerNotes: string) =>
    apiFetch<{ success: boolean; message: string }>(`/admin/approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ checkerNotes }),
    }),

  // Ledger
  getLedger: (params?: { type?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    return apiFetch<{ entries: LedgerEntryRecord[]; total: number; trialBalance: TrialBalance }>(
      `/admin/ledger?${qs.toString()}`
    );
  },

  // Reconciliation
  listReconciliations: () => apiFetch<{ batches: ReconciliationBatch[] }>("/admin/reconciliation"),
  uploadReconciliationCsv: (body: {
    providerName: string;
    fileName: string;
    rows: { reference: string; amountInNaira: number; status: string }[];
  }) =>
    apiFetch<{ batch: ReconciliationBatch }>("/admin/reconciliation/upload", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getReconciliationBatch: (batchId: string) =>
    apiFetch<{ batch: ReconciliationBatch }>(`/admin/reconciliation/${batchId}`),

  // Audit Logs
  getAuditLogs: (params?: { action?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set("action", params.action);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    return apiFetch<{ logs: AuditLogRecord[]; total: number }>(
      `/admin/audit-logs?${qs.toString()}`
    );
  },

  // Team
  listTeam: () => apiFetch<{ members: AdminUser[] }>("/admin/team"),
  createAdminUser: (body: {
    email: string;
    fullName: string;
    password: string;
    role: AdminRole;
  }) =>
    apiFetch<{ member: AdminUser }>("/admin/team", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAdminUser: (id: string, body: { isActive?: boolean; role?: AdminRole }) =>
    apiFetch<{ member: AdminUser }>(`/admin/team/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // Support Tickets
  listTickets: (params?: { q?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status) qs.set("status", params.status);
    return apiFetch<{ tickets: SupportTicketRecord[] }>(`/admin/tickets?${qs.toString()}`);
  },
  replyTicket: (ticketId: string, message: string) =>
    apiFetch<{ success: boolean }>(`/admin/tickets/${ticketId}/reply`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  updateTicketStatus: (
    ticketId: string,
    body: { status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"; resolutionNotes?: string }
  ) =>
    apiFetch<{ ticket: SupportTicketRecord }>(`/admin/tickets/${ticketId}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

