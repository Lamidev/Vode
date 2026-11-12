# VODE ADMIN OPERATIONS PORTAL
## Product Requirements & Component Blueprint (`admin.usevode.com`)

**Product:** Vode Admin & Control Center  
**Entity:** VODE SYSTEMS AND TECHNOLOGIES LIMITED  
**Frontend App:** Dedicated Next.js App (`Admin/`) served at `admin.usevode.com`  
**Backend API:** Express `/admin/*` router inside `Backend/` (`api.usevode.com/admin/*`)  
**Database:** PostgreSQL via Prisma (`Backend/prisma/schema.prisma`)  
**Status:** Ready for Implementation  

---

## 1. Purpose & Core Principles

The Vode Admin Portal is the **control-centered operations, finance, and security plane** for Vode. Every component is designed around four non-negotiable fintech principles:

1. **Zero-Trust Perimeter:** Separate domain (`admin.usevode.com`), `httpOnly` cookie JWT sessions, mandatory TOTP 2FA, strict RBAC, and PII masking.
2. **No Silent Edits or Deletes:** Wallet balances and `LedgerEntry` rows are never edited or deleted. Every "revert" executes as an auditable **compensating reversal entry** (`REVERSAL` + `CREDIT`/`DEBIT`).
3. **Maker–Checker (Two-Person Rule):** High-risk actions (reversals, manual adjustments, unfreezing accounts, switching banking providers) require a **Maker** to propose and a *different* **Checker** to approve.
4. **Instant Blast-Radius Control:** Global kill-switches allow Operations/Super Admins to pause outward transfers or switch banking rails in one click without redeploying code.

---

## 2. Roles & Access Control (RBAC)

| Role | Access Scope | Restricted From |
|---|---|---|
| `SUPER_ADMIN` | Full access: kill-switches, admin user management, Maker & Checker approvals, system limits | Approving their own Maker requests (`makerId !== checkerId`) |
| `OPERATIONS` | Customers, freeze/unfreeze, provider transaction re-query, creating reversal requests, job retries | Final approval of financial adjustments, managing admin accounts, raw API secrets |
| `FINANCE` | Double-entry ledger, trial balance, fee revenue, settlement reconciliation, approving/reviewing financial requests | Freezing accounts, modifying system infrastructure flags |
| `SUPPORT` | Read-only customer profile (masked BVN/NIN), transaction status lookup, freeze-log view | Balances adjustments, reversals, kill-switches, unfreezing |

---

## 3. Database Schema Additions (`Backend/prisma/schema.prisma`)

Before building UI components, the following models will be added to Prisma:

1. **`AdminRole` (enum):** `SUPER_ADMIN`, `OPERATIONS`, `FINANCE`, `SUPPORT`
2. **`AdminActionStatus` (enum):** `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `EXECUTED`, `FAILED`
3. **`AdminActionType` (enum):** `REVERSE_TRANSACTION`, `UNFREEZE_USER`, `MANUAL_ADJUSTMENT`, `SWITCH_BANKING_PROVIDER`, `UPDATE_SYSTEM_LIMITS`
4. **`AdminUser`:** `id`, `email`, `fullName`, `passwordHash`, `role`, `totpSecret` (encrypted), `totpEnabled`, `isActive`, `lastLoginAt`, `lastLoginIp`, `createdAt`, `updatedAt`
5. **`AuditLog`:** `id`, `adminUserId`, `action`, `targetType`, `targetId`, `beforeState` (Json), `afterState` (Json), `reason`, `ipAddress`, `userAgent`, `createdAt` *(append-only)*
6. **`AdminActionRequest` (Maker–Checker):** `id`, `type`, `status`, `targetType`, `targetId`, `payload` (Json), `reason`, `evidenceUrl`, `makerId`, `checkerId`, `checkerNotes`, `reviewedAt`, `executedAt`, `createdAt`
7. **`SystemConfig`:** `id`, `key` (unique, e.g. `OUTWARD_TRANSFERS_ENABLED`, `ACTIVE_BANKING_PROVIDER`, `TIER_1_DAILY_LIMIT_KOBO`), `value` (Json), `updatedBy`, `updatedAt`
8. **`ReconciliationBatch` & `ReconciliationDiscrepancy`:** Tracks uploaded/fetched partner settlement files and mismatched items (`INTERNAL_ONLY`, `PARTNER_ONLY`, `AMOUNT_MISMATCH`, `STATUS_MISMATCH`).

---

## 4. Backend Admin API Endpoints (`Backend/src/routes/admin.routes.ts`)

All `/admin/*` routes (except `/admin/auth/login` and `/admin/auth/verify-2fa`) pass through `requireAdminAuth`, `requireRole(...)`, and `adminRateLimiter`.

### A. Auth & Session
* `POST /admin/auth/login` — Email + password check (returns temporary 2FA challenge token).
* `POST /admin/auth/verify-2fa` — Verifies TOTP 6-digit code and sets `httpOnly`, `Secure`, `SameSite=Strict` session cookie.
* `POST /admin/auth/setup-2fa` — Generates QR/TOTP secret for first-time admin onboarding.
* `POST /admin/auth/logout` — Clears session cookie + logs audit event.
* `GET /admin/auth/me` — Returns current admin profile and permissions.

### B. Command Center & Kill-Switches
* `GET /admin/overview` — 24h volume, inflows vs. outflows, fee revenue, active users, frozen count, pending approvals count, and provider/DB/Redis health checks.
* `GET /admin/system-config` — Current runtime flags and tier limits.
* `POST /admin/system-config/kill-switch` — Immediate toggle for `OUTWARD_TRANSFERS_ENABLED` (`SUPER_ADMIN` only, audit-logged).

### C. Customers & Emergency Controls
* `GET /admin/customers` — Paginated search by phone, name, NUBAN, or status (`ACTIVE`, `FROZEN`).
* `GET /admin/customers/:id` — Full profile (masked PII), wallet, `DedicatedNuban`, `Beneficiary[]`, `EmergencyFreezeLog[]`, and recent transactions.
* `POST /admin/customers/:id/freeze` — Immediate account freeze (`OPERATIONS` / `SUPER_ADMIN`, audit-logged).
* `POST /admin/customers/:id/unfreeze-request` — Submits Maker request to unfreeze a frozen user (requires Checker approval).

### D. Transactions & Provider Re-Query
* `GET /admin/transactions` — Filter by reference, partnerReference, status, type, date range, min/max amount.
* `GET /admin/transactions/:id` — Full transaction detail + linked `LedgerEntry[]` + audit trail.
* `POST /admin/transactions/:id/requery` — Calls `BankingService.verifyTransfer(reference)` to check live status with Nomba/Rubies/Providus.

### E. Review & Revert (Maker–Checker Queue)
* `GET /admin/approvals` — List `PENDING_APPROVAL` and historical `AdminActionRequest` items.
* `POST /admin/approvals` — Create a Maker request (e.g., `REVERSE_TRANSACTION` with reason & proof).
* `POST /admin/approvals/:id/approve` — Checker approves & atomically executes (enforces `checkerId !== makerId`, uses `SELECT ... FOR UPDATE` + idempotency key `rev_<txId>`).
* `POST /admin/approvals/:id/reject` — Checker rejects with mandatory notes.

### F. Double-Entry Ledger & Reconciliation
* `GET /admin/ledger` — Paginated `LedgerEntry` stream + live trial balance summary ($\sum \text{Credits} - \sum \text{Debits}$).
* `POST /admin/reconciliation/upload` — Parses partner CSV settlement sheet and compares against `Transaction` table.
* `GET /admin/reconciliation/:batchId` — Lists matched count and flagged discrepancies.

### G. Audit Logs & Admin Team
* `GET /admin/audit-logs` — Filterable chronological log of all admin reads/mutations.
* `GET /admin/team` / `POST /admin/team` / `PATCH /admin/team/:id` — Manage admin staff and active status (`SUPER_ADMIN` only).

---

## 5. Complete List of Frontend Components to Build (`Admin/`)

### 5.1 Shared Shell & Security Components (`Admin/src/components/layout/` & `auth/`)
| Component | Purpose |
|---|---|
| `AdminSidebar` | Role-aware navigation menu with live badge count for pending Maker–Checker approvals |
| `AdminTopbar` | Current environment badge (`PRODUCTION` / `MOCK`), active banking rail indicator (`Nomba` / `Rubies`), admin role pill, logout |
| `EmergencyKillSwitchBanner` | Persistent red top alert across all pages whenever `OUTWARD_TRANSFERS_ENABLED === false` |
| `RoleGuard` | Client-side route/action wrapper hiding unauthorized buttons (enforced server-side as well) |
| `LoginForm` | Email + password step with rate-limit feedback |
| `TwoFactorVerifyCard` | 6-digit TOTP authenticator verification + QR setup flow |

### 5.2 Module 1 — Command Center (`Admin/src/app/page.tsx`)
| Component | Purpose |
|---|---|
| `KpiSummaryGrid` | 24h Volume, Net Inflow/Outflow, Fees Earned, Active Users, Frozen Accounts |
| `InfrastructureHealthBar` | Live status indicators for PostgreSQL, Redis, Core Banking Rail, and Gemini AI |
| `QuickKillSwitchPanel` | `SUPER_ADMIN` emergency toggle to pause all outward payouts or view active rail |
| `LiveTransactionStream` | Auto-refreshing feed of latest deposits and outward transfers |

### 5.3 Module 2 — Customer & Identity Directory (`Admin/src/app/customers/page.tsx`)
| Component | Purpose |
|---|---|
| `CustomerSearchFilters` | Search by phone, full name, 10-digit NUBAN, KYC tier, and account status |
| `CustomerTable` | Paginated table showing name, phone, NUBAN, wallet balance (₦), tier, and status badge |
| `CustomerDetailDrawer` | Slide-over panel with KYC summary (masked BVN), virtual NUBAN, saved beneficiaries, and freeze history |
| `FreezeAccountModal` | One-click freeze modal requiring mandatory reason (logged to `AuditLog` & `EmergencyFreezeLog`) |
| `RequestUnfreezeModal` | Submits a Maker–Checker `UNFREEZE_USER` request with verification notes |

### 5.4 Module 3 — Transaction & Settlement Manager (`Admin/src/app/transactions/page.tsx`)
| Component | Purpose |
|---|---|
| `TransactionFilterBar` | Filter by `VD_TX_` / `VD_DEP_` reference, status, type, date range |
| `TransactionTable` | Clean table with amount, fee, counterparty, bank, status pill, and timestamps |
| `TransactionDetailDrawer` | Shows full timeline, counterparty details, linked double-entry `LedgerEntry` rows |
| `ProviderRequeryButton` | Calls banking partner API to fetch live settlement status for `PROCESSING` transfers |
| `RequestRevertModal` | Opens a Maker–Checker `REVERSE_TRANSACTION` request for failed/disputed debits |

### 5.5 Module 4 — Review & Revert Queue (`Admin/src/app/approvals/page.tsx`)
| Component | Purpose |
|---|---|
| `ApprovalTabs` | Filter tabs: `Pending Review`, `Approved / Executed`, `Rejected` |
| `ApprovalQueueTable` | Shows action type, target reference, requested amount, Maker name, and timestamp |
| `ApprovalReviewDrawer` | Side-by-side comparison of original transaction/user state, Maker's reason, and evidence |
| `ApproveRejectPanel` | Enforces two-person rule (disables Approve if current admin === Maker) with Checker notes |

### 5.6 Module 5 — Double-Entry Ledger Inspector (`Admin/src/app/ledger/page.tsx`)
| Component | Purpose |
|---|---|
| `TrialBalanceCard` | Live math verification showing total wallet liabilities, inflows, outflows, and fee revenue |
| `LedgerFilterBar` | Filter by wallet/user, `CREDIT`/`DEBIT`, transaction reference, date range |
| `LedgerEntryTable` | Immutable table displaying `amountInKobo` (formatted ₦), `balanceAfterInKobo`, and description |

### 5.7 Module 6 — Partner Reconciliation (`Admin/src/app/reconciliation/page.tsx`)
| Component | Purpose |
|---|---|
| `SettlementUploadDropzone` | Upload daily RubiesMFB / Nomba CSV settlement reports |
| `ReconciliationStatsCards` | Matched count, Internal-Only count, Partner-Only count, Amount Mismatches |
| `DiscrepancyTable` | Lists flagged transactions with quick link to create a Maker–Checker resolution request |

### 5.8 Module 7 — Audit & Compliance Logs (`Admin/src/app/audit/page.tsx`)
| Component | Purpose |
|---|---|
| `AuditFilterBar` | Filter by admin user, action type, target ID, and date range |
| `AuditLogTable` | Chronological immutable log with IP address, user agent, reason, and timestamp |
| `AuditDiffModal` | Clean JSON diff viewer showing `beforeState` vs. `afterState` for any mutation |

### 5.9 Module 8 — Admin Team & System Settings (`Admin/src/app/settings/page.tsx`)
| Component | Purpose |
|---|---|
| `AdminTeamTable` | List staff accounts, roles, 2FA status, last login IP, active toggle |
| `CreateAdminModal` | Create new admin user with assigned role |
| `TierLimitsConfigForm` | Configure Tier 1 / 2 / 3 single & daily limits (via Maker–Checker approval) |

*(Note: A **Queue & Dead-Letter Job Manager** component `/queues` will be added alongside the Redis + BullMQ worker rollout.)*

---

## 6. Phased Implementation Plan

1. **Milestone 1 — Backend Admin Foundation:**
   * Add Prisma models (`AdminUser`, `AuditLog`, `AdminActionRequest`, `SystemConfig`, `EmergencyFreezeLog` updates) and run `prisma db push` / migration.
   * Build Admin Auth (JWT `httpOnly` cookie + TOTP 2FA), RBAC middleware, Audit Logger, and Maker–Checker execution engine.
2. **Milestone 2 — Core `Admin/` Next.js App & Control Pages:**
   * Scaffold `Admin/` Next.js app (matching Vode's design system) with Login/2FA, Command Center + Kill-Switch, Customers, Transactions + Re-query, Review & Revert Queue, Ledger Inspector, and Audit Logs.
3. **Milestone 3 — Reconciliation, Team Settings & Nginx Deployment:**
   * Add CSV Partner Reconciliation tool, Admin Team management, and deploy `admin.usevode.com` behind Nginx SSL + optional IP allowlisting on the Contabo VPS.

