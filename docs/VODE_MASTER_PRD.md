# VODE
## Master Product Requirements Document (PRD) & Technical Architecture Blueprint v2.0

**Document Type:** Master Product Requirements Document & Engineering Specification  
**Product:** Vode  
**Entity:** VODE SYSTEMS AND TECHNOLOGIES LIMITED  
**Product Category:** Fintech / Digital Financial Services  
**Target Market:** Nigeria (NGN / Kobo)  
**Primary Customer Channel:** WhatsApp (Meta WhatsApp Cloud API)  
**Public Web Channel:** Marketing & Lead Generation Landing Page (Next.js)  
**Internal Operations Channel:** Admin & Operations Dashboard (Next.js)  
**Backend & Engine:** Node.js, Express, TypeScript  
**Database:** PostgreSQL (Authoritative Financial Store)  
**ORM:** Prisma  
**Asynchronous & Queue Infrastructure:** Redis + BullMQ  
**Initial Deployment:** Contabo VPS (Ubuntu, Docker Compose / PM2, Nginx)  
**Status:** Approved Master Architecture Baseline

---

# 1. Executive Summary & Core Positioning

### 1.1 The Vision
Vode is a **WhatsApp-first financial utility platform** designed for everyday Nigerians. By turning WhatsApp into a frictionless financial interface, Vode eliminates app-switching, complex navigation, and clunky banking apps. Users can send money, receive money into dedicated virtual accounts, generate payment requests, buy airtime/data, and settle bills directly inside the chat app they use every single day.

### 1.2 Channel Strategy
* **Customer Channel:** **100% WhatsApp-First.** There is **no customer web portal or mobile app** in this phase. All customer onboarding, account inquiries, transaction authorization, and alerts occur inside WhatsApp.
* **Public Web Channel:** High-converting, mobile-optimized marketing landing page built on Next.js (`usevode.com`). Its sole conversion objective is educating users and launching them straight into the WhatsApp onboarding flow via `wa.me` action links.
* **Internal Operations Channel:** Next.js Admin & Operations Dashboard (`admin.usevode.com`). This is a restricted, authenticated portal allowing operations, finance, and support teams to monitor transactions, inspect the double-entry ledger, manage customer accounts, handle reconciliation discrepancies, review failed jobs, and trigger emergency controls.

### 1.3 Core Engineering Tenets
1. **Financial Immutability:** Absolute reliance on double-entry bookkeeping recorded in integer minor units (`kobo`). Balance changes are atomic and driven exclusively by ledger postings.
2. **PostgreSQL as the Single Source of Truth:** Balances are never cached authoritatively in Redis or kept in memory.
3. **Pessimistic Concurrency:** Row-level locks (`SELECT ... FOR UPDATE`) prevent race conditions and double-spending across concurrent WhatsApp messages or duplicate webhook arrivals.
4. **Zero Blind Retries:** If an external partner API times out or returns an ambiguous status, Vode never blindly re-executes the transfer. The transaction remains in an intermediate state until status polling or reconciliation establishes the definitive outcome.
5. **Decoupled Architecture:** Business logic is decoupled from WhatsApp. The WhatsApp engine translates chat inputs into core commands, which run through the same financial engine that could power any future channel.

---

# 2. System Architecture & Component Interaction

```text
                                  +-------------------------------------------------------------+
                                  |                     PUBLIC TRAFFIC                          |
                                  +-------------------------------------------------------------+
                                            |                                         |
                                            v                                         v
                      +------------------------------------------+       +-----------------------------+
                      |         usevode.com (Next.js)            |       |     Meta WhatsApp Servers   |
                      |   Marketing Landing Page (SEO/Public)    |       |   (WhatsApp Cloud API)      |
                      |   Direct CTA -> wa.me/234xxxxxxxxxx      |       +-----------------------------+
                      +------------------------------------------+                      |
                                                                                        | Inbound Webhooks
                                            +-------------------------------------------+ (Messages, Statuses)
                                            |
                                            v
                      +-------------------------------------------------------------------------+
                      |                        NGINX REVERSE PROXY                              |
                      |                  (SSL Termination, Rate Limiting)                       |
                      +-------------------------------------------------------------------------+
                                 |                                                   |
             /api/v1/* (and /webhooks/*)                                             | /admin/*
                                 v                                                   v
+---------------------------------------------------------------+   +------------------------------------+
|               VODE BACKEND API & FINANCIAL ENGINE             |   |      ADMIN OPERATIONS PORTAL       |
|                  (Node.js + Express + TypeScript)             |   |        (Next.js + Tailwind)        |
+---------------------------------------------------------------+   +------------------------------------+
|  * WhatsApp FSM Router (State Machine & Interactive UI)       |   |  * Executive KPI Metrics           |
|  * Customer & Virtual Account Services                        |   |  * Customer & KYC Directory        |
|  * Transfer, Bill, Airtime & Request Orchestrator             |   |  * Real-Time Transaction Monitor   |
|  * Double-Entry Ledger Engine                                 |   |  * Double-Entry Ledger Inspector   |
|  * Idempotency, Concurrency & Risk Control                    |   |  * Dead-Letter & Failed Job Queue  |
|  * Provider Adapters (BaaS, NIP, Bills, SMS, Verification)    |   |  * Partner Reconciliation Tool     |
|  * Inbox / Outbox Event Dispatcher                            |   |  * Maker-Checker & Audit Trails    |
+---------------------------------------------------------------+   +------------------------------------+
                   |                               |                                   |
                   | Atomic DB Transactions        | Publish/Consume Jobs              | Secure API Query
                   v                               v                                   v
+--------------------------------------+   +-------------------------------------------------------------+
|              POSTGRESQL              |   |                       REDIS + BULLMQ                        |
|   (Authoritative Financial Store)    |   |       (Distributed Queue & Ephemeral State Store)           |
+--------------------------------------+   +-------------------------------------------------------------+
|  * users, accounts, virtual_accounts |   |  * `webhook-processing-queue` (Inbox processor)            |
|  * transactions, transaction_events  |   |  * `transfer-execution-queue` (Outbox publisher)           |
|  * ledger_accounts, ledger_entries   |   |  * `status-poller-queue` (Checks ambiguous transfers)       |
|  * idempotency_keys                  |   |  * `notification-queue` (WhatsApp outbound dispatcher)     |
|  * webhook_inbox, outbox_events      |   |  * WhatsApp 10-minute session state & TTL cache             |
|  * admin_users, audit_logs           |   +-------------------------------------------------------------+
+--------------------------------------+                                   |
                                                                           | Outbound HTTP Requests
                                                                           v
                                           +-------------------------------------------------------------+
                                           |                      EXTERNAL PROVIDERS                     |
                                           +-------------------------------------------------------------+
                                           |  * BaaS & Virtual Accounts (e.g. Monnify / SafeHaven / etc) |
                                           |  * NIP Outward Transfers (NIBSS rails via partner)          |
                                           |  * Identity & KYC (Prembly / Dojah / QoreID)                |
                                           |  * Utility & Airtime Aggregators                            |
                                           |  * Meta WhatsApp Cloud API (Outbound messages)              |
                                           +-------------------------------------------------------------+
```

---

# 3. Product Scope & Functional Modules

| Module | Purpose | Priority |
|---|---|---|
| **WhatsApp Conversational Engine** | Finite-state machine (FSM) routing user messages, buttons, and lists | P0 |
| **Virtual Account Issuance** | Automatic generation of dedicated NUBAN virtual accounts for wallet funding | P0 |
| **Send Money (NIP Outward)** | Instant outward bank transfers with name verification and status tracking | P0 |
| **Payment Requests** | Generation of payment links / account details for peer-to-peer collection | P0 |
| **Double-Entry Ledger Engine** | Immutable debit/credit accounting with balance locking | P0 |
| **Transaction Security & PIN** | Secure transaction authorization without leaking plain-text PINs in chat | P0 |
| **Emergency Freeze & Kill-Switch** | Zero-SMS web kill-switch (`usevode.com/freeze`) to lock account upon phone loss | P0 |
| **Inbox/Outbox Queueing** | Guaranteed delivery of webhooks and event-driven background tasks | P0 |
| **Admin Operations Dashboard** | Web-based operations portal for managing customers, transactions & ledger | P0 |
| **Marketing Landing Page** | Conversion-optimized Next.js marketing site with WhatsApp entry points | P0 |
| **Airtime & Data Purchases** | Direct top-ups across MTN, Airtel, Glo, and 9mobile | P1 |
| **Utility Bill Payments** | Electricity, Cable TV (DSTV, GOTV, Startimes), and Internet services | P1 |
| **Automated Reconciliation** | Daily comparison between internal ledger and provider settlement sheets | P1 |
| **Customer Web App / Mobile App** | Self-service portals for customers (Deferred) | P3 |

---

# 4. WhatsApp Conversational Interface Architecture

Fintech on WhatsApp requires absolute precision. Free-form text and ambiguous prompts create risk. Vode implements a **deterministic Finite-State Machine (FSM)** utilizing WhatsApp Interactive Messages (Lists and Quick Reply Buttons) wherever possible.

```
       [User Message: "Hi" / New User]
                       |
                       v
         +----------------------------+
         |     Is User Registered?    |
         +----------------------------+
            /                      \
          No                        Yes
          /                            \
         v                              v
+------------------+         +-------------------------------+
|  Onboarding FSM  |         |        Main Menu (List)       |
|  - Terms Consent |         | 1. Send Money                 |
|  - Full Name     |         | 2. Add Money (Virtual Account)|
|  - BVN/NIN Check |         | 3. Request Payment            |
|  - PIN Setup     |         | 4. Buy Airtime/Data           |
+------------------+         | 5. Check Balance & History    |
                             +-------------------------------+
```

### 4.1 State Machine Management
Conversation state is stored in **Redis with a 10-minute sliding TTL**. If a user goes inactive mid-transaction, the conversation expires back to `IDLE` to prevent accidental submissions later.

**Core States:**
* `IDLE`: Listening for menu trigger or command keywords.
* `ONBOARDING_TERMS` -> `ONBOARDING_NAME` -> `ONBOARDING_IDENTITY` -> `ONBOARDING_PIN_PENDING`.
* `TRANSFER_SELECT_BANK`: Displays searchable bank list.
* `TRANSFER_ENTER_ACCOUNT`: Accepts 10-digit NUBAN account number.
* `TRANSFER_CONFIRM_RECIPIENT`: Displays verified name via Name Inquiry API; awaits confirmation.
* `TRANSFER_ENTER_AMOUNT`: Accepts transfer amount in Naira.
* `TRANSFER_AWAITING_AUTH`: Awaiting secure PIN authorization.
* `TRANSFER_PROCESSING`: Transaction posted and awaiting provider feedback.

### 4.2 Handling Meta's 24-Hour Customer Care Window
* **Within 24 Hours:** When a user initiates a conversation, Vode has 24 hours to send free-form interactive messages and transaction updates.
* **Outside 24 Hours:** If a transfer is delayed and settles after the 24-hour window, Vode uses pre-approved **Meta Utility Message Templates** with dynamic parameters (e.g., `{{1}}` for amount, `{{2}}` for recipient, `{{3}}` for reference).

---

# 5. Security & Transaction Authorization (No Plaintext PINs in Chat)

### 5.1 The Risk
WhatsApp messages are visible in lock-screen notifications, displayed in plain chat history, synced across devices (WhatsApp Web), and backed up unencrypted to third-party clouds. **Under no circumstances may a user type `"My PIN is 1234"` in chat.**

### 5.2 The Vode Authorization Protocol (Dual Options)
To ensure compliance and security, Vode implements a hybrid authorization model:

#### Model A: One-Time Secure Webview Sheet (Recommended Primary)
1. When user clicks `[Confirm Transfer]` in chat, the backend generates a short-lived (90 seconds), single-use cryptographic token:
   `https://auth.usevode.com/authorize?token=eyJh...`
2. Vode sends an interactive WhatsApp message with a button: `[Enter Secure PIN to Authorize]`.
3. The user taps the link, which opens in WhatsApp's in-app browser.
4. The user sees the transaction summary and enters their 4-digit PIN on a hardened, scrambled numeric keypad with biometric support (Face ID / Fingerprint via WebAuthn).
5. The PIN is hashed, verified against the user's stored bcrypt/argon2 hash in PostgreSQL, and upon success, the sheet automatically closes with an immediate WhatsApp notification: *"Transaction authorized and processing."*

#### Model B: Meta WhatsApp Flows (Native In-App Sheet)
1. Utilizes Meta’s official WhatsApp Flows API to open an encrypted, native sheet directly inside WhatsApp.
2. The user inputs their PIN into an obfuscated password field.
3. The flow payload is transmitted back to Vode’s webhook over an encrypted channel without ever appearing in the plain-text chat stream.

### 5.3 Emergency Account Freeze Protocol ("Kill-Switch" for Lost Phone or SIM Theft)

#### The Threat Vector
When a user loses their phone, has their device stolen, or suffers a SIM-swap fraud, **the attacker has physical control of their phone number and WhatsApp**. 
* Under this threat scenario, **standard SMS OTP is completely compromised** because any SMS sent to verify the user will be intercepted by the thief holding the phone.
* Vode implements a zero-SMS web kill-switch adhering to the fintech security maxim: **"Low friction to freeze, high friction to unfreeze."**

#### The Emergency Freeze Workflow (`usevode.com/freeze`)
1. **Access:** The victim accesses `usevode.com/freeze` from any computer or borrowed device.
2. **Zero-SMS Identity Challenge:**
   The user enters:
   * Registered WhatsApp Phone Number (`+234...`).
   * Knowledge-based secret: 4-digit Transaction PIN **OR** Last 4 digits of registered BVN/NIN **OR** Date of Birth.
3. **Instant Backend Kill-Switch (Atomic Execution):**
   * **Database Status:** User record updated to `FROZEN_EMERGENCY` with timestamp and IP address.
   * **Redis Session Eviction:** The user's active WhatsApp session in Redis is evicted and blacklisted. Any incoming message from the stolen phone receives a blocked response:
     > ⛔ *"This Vode account has been locked due to an emergency security request. All transactions are disabled. To recover your account, visit usevode.com/recover."*
   * **Financial Block:** Outward transfers (NIP, Airtime, Bills) are strictly halted at the database transaction layer. Inbound virtual account deposits continue to be accepted and credited safely to prevent payment bounces from third parties.
   * **Real-Time Notification:** Emergency alert dispatched to the internal Admin Operations Dashboard.

#### The Unfreeze & Identity Recovery Protocol
To prevent attackers from easily reversing an emergency lock, unfreezing requires strict identity verification:
* **Path 1 (Automated Face Liveness Match):** User visits `usevode.com/recover`, submits their BVN, and completes an active biometric liveness selfie test (via Prembly / Dojah / QoreID) matched against government BVN database photos. Upon $>90\%$ confidence match, the account is restored.
* **Path 2 (Admin Operations Review):** User contacts emergency support (`support@usevode.com`). An authorized Operations Officer conducts an identity verification check (valid photo ID upload or video call) and executes an audited unfreeze via the Admin Dashboard.

---

# 6. Financial Architecture & Double-Entry Ledger

Vode operates under strict double-entry accounting principles. Money is never created or destroyed; it is moved between explicit accounts.

### 6.1 Ledger Integrity Rules
1. **Integer Minor Units:** All monetary values are stored in **Kobo** as 64-bit integers (`bigint`).
   * Example: ₦1,500.50 is stored as `150050`. Float or decimal types are strictly prohibited in financial math.
2. **Balanced Journal Entries:** Every posted journal entry contains at least one debit and one credit.
   $$\sum \text{Debits} = \sum \text{Credits}$$
3. **Pessimistic Concurrency (`SELECT ... FOR UPDATE`):**
   ```sql
   -- Checking and locking user's ledger account balance inside an atomic transaction:
   SELECT id, balance, status 
   FROM ledger_accounts 
   WHERE user_id = $1 AND type = 'CUSTOMER_WALLET' 
   FOR UPDATE;
   ```
   This serializes concurrent transactions and guarantees that a user cannot spend the same balance twice.
4. **Ledger Immutability:** Once a `ledger_entry` is written, it is **never updated or deleted**. Corrections are executed via compensating reversal entries referencing the original transaction ID.

### 6.2 Accounting Flow Examples

#### Scenario 1: Customer Wallet Funding (Virtual Account Inbound)
When a user deposits ₦10,000 via their dedicated virtual account:
* **Debit:** `PARTNER_SETTLEMENT_CLEARING` (Asset) — ₦10,000 (1,000,000 kobo)
* **Credit:** `CUSTOMER_WALLET:<user_id>` (Liability) — ₦10,000 (1,000,000 kobo)

#### Scenario 2: Outward Bank Transfer (Send Money)
When a customer sends ₦5,000 to an external bank (Fee: ₦20):
* **Debit:** `CUSTOMER_WALLET:<user_id>` — ₦5,020 (502,000 kobo)
* **Credit:** `PARTNER_DISBURSEMENT_CLEARING` — ₦5,000 (500,000 kobo)
* **Credit:** `VODE_REVENUE_FEES` — ₦20 (2,000 kobo)

---

# 7. Resilient Provider Integration & Webhook Processing

### 7.1 Idempotency Enforcement
All state-modifying endpoints and transfer execution jobs require an `Idempotency-Key`.
* Keys are scoped by operation and stored in PostgreSQL with a unique constraint.
* Duplicate requests with an active or completed idempotency key return the existing transaction record without re-executing money movement.

### 7.2 Transactional Inbox / Outbox Pattern

```
Partner Webhook ---> [Nginx] ---> Express Router
                                       |
                   +-------------------+--------------------+
                   | 1. Verify HMAC Signature               |
                   | 2. Insert into `webhook_inbox`         |
                   |    (Status: PENDING, Unique Event ID)  |
                   | 3. Return HTTP 200 OK immediately      |
                   +----------------------------------------+
                                       |
                                       v (Asynchronous BullMQ Job)
                     +------------------------------------+
                     | Process Webhook Payload            |
                     | - Start DB Transaction             |
                     | - Lock Transaction Row             |
                     | - Update Transaction Status        |
                     | - Post Double-Entry Ledger Entries |
                     | - Insert into `outbox_events`      |
                     | - Commit DB Transaction            |
                     +------------------------------------+
                                       |
                                       v (Outbox Publisher)
                     +------------------------------------+
                     | Dispatch WhatsApp Notification     |
                     +------------------------------------+
```

### 7.3 Safe Failure & Ambiguous Status Handling
* **Network Timeout during Outward Transfer:**
  If the partner API does not respond within 15 seconds, the transaction status is marked `PENDING_PROVIDER`.
  - The funds remain in a `RESERVED` state.
  - Vode does **not** re-send the money.
  - A BullMQ status-poller job queries the partner’s `GET /transfers/{ref}` endpoint using exponential backoff (15s, 1m, 5m, 15m).
  - Only when the partner returns a final status does Vode either finalize the debit or reverse the reservation.

---

# 8. Admin Operations Dashboard Specifications

The Admin Portal is a dedicated Next.js application served on `admin.usevode.com`. It provides operations, finance, and engineering teams with total visibility and control.

### 8.1 Roles and Access Control (RBAC)
* **Super Admin:** Full access to all systems, settings, API key rotation, manual adjustments (maker-checker), and user role management.
* **Operations Officer:** Can view all users and transactions, trigger re-queries on stuck transactions, and freeze/unfreeze accounts.
* **Finance & Reconciliation Agent:** Read-only access to customer PII; full access to the Double-Entry Ledger, partner clearing balances, fee revenues, and reconciliation reports.
* **Support Agent:** View customer basic profiles, WhatsApp interaction history, and transaction statuses. Restricted from initiating adjustments or viewing raw API keys.

### 8.2 Admin Dashboard Modules

#### 1. Real-Time Command Center (Overview)
* **KPI Metrics Cards:** Total Volume Processed (24h), Net Inflows vs. Outflows, Total Fees Earned, Active WhatsApp Users, Current Partner Account Float.
* **Health Indicators:** Webhook Processing Latency, Queue Backlog count, Provider API status (Green/Degraded/Down).
* **Live Activity Feed:** Real-time stream of incoming virtual account deposits and outward transfers.

#### 2. Customer & Identity Directory
* Search by WhatsApp Phone Number, Name, NUBAN Virtual Account, or Internal ID.
* View assigned Dedicated Virtual Account details (Bank Name, Account Number, Account Name).
* Profile details, Tier status, Verification state, and risk flags.
* Action buttons: `[Freeze Account]`, `[Unfreeze Account]`, `[Reset Security PIN Session]`.

#### 3. Transaction & Settlement Manager
* Search & filter transactions by internal reference, provider reference, date range, amount, status, and transaction type.
* Detailed Transaction Drawer:
  - Exact timeline (Initiated -> Authorized -> Dispatched to Provider -> Webhook Received -> Settled).
  - Associated double-entry ledger journal entries.
  - Raw provider request/response logs (sanitized of sensitive card/PIN data).
  - Action buttons: `[Force Status Re-Query]`, `[Flag for Reconciliation]`.

#### 4. Double-Entry Ledger Inspector
* Live trial balance verification: Instant check confirming $\sum \text{Debits} = \sum \text{Credits}$ across the system.
* Account balance views for system accounts (`CUSTOMER_WALLETS`, `PARTNER_CLEARING`, `FEES_EARNED`).
* Full immutable audit ledger with drill-down into individual debit and credit entries.

#### 5. Queue & Dead-Letter Job Manager
* Monitor BullMQ queues (`webhook-processing`, `transfer-execution`, `notifications`).
* Inspect failed and stalled jobs.
* View exception stack traces and payload data.
* Safe action button: `[Retry Failed Job]` (strictly guarded against duplicate financial execution).

#### 6. Partner Reconciliation Tool
* Upload or auto-fetch daily bank/provider settlement CSV statements.
* Automated matching algorithm comparing internal transactions against provider settlement records.
* Discrepancy flagging:
  - Internal Success $\leftrightarrow$ Provider Missing.
  - Internal Pending $\leftrightarrow$ Provider Success.
  - Amount mismatch or fee discrepancies.
* Maker-Checker adjustment workflow for resolving discrepancies.

#### 7. Audit & Compliance Logs
* Complete chronological log of every administrative action (who viewed which customer, who authorized a freeze, who modified limits).
* Immutable records containing IP address, user agent, and timestamp.

---

# 9. Database Schema Blueprint (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  FROZEN
  FROZEN_EMERGENCY
}

enum KycLevel {
  TIER_0
  TIER_1
  TIER_2
}

enum TransactionType {
  DEPOSIT
  TRANSFER
  AIRTIME
  DATA
  BILL_PAYMENT
  FEE
  REVERSAL
}

enum TransactionStatus {
  CREATED
  AWAITING_AUTH
  PROCESSING
  PENDING_PROVIDER
  SUCCESSFUL
  FAILED
  REVERSED
}

enum LedgerAccountType {
  CUSTOMER_WALLET
  PARTNER_CLEARING
  COMPANY_REVENUE
  SYSTEM_EXPENSE
}

enum EntryDirection {
  DEBIT
  CREDIT
}

enum AdminRole {
  SUPER_ADMIN
  OPERATIONS
  FINANCE
  SUPPORT
}

model User {
  id              String           @id @default(uuid())
  phoneNumber     String           @unique // E.164 formatted WhatsApp number (e.g. +234...)
  firstName       String?
  lastName        String?
  dateOfBirth     DateTime?
  backupEmail     String?
  pinHash         String?
  pinFailedAttempts Int            @default(0)
  pinLockedUntil  DateTime?
  kycLevel        KycLevel         @default(TIER_0)
  bvnEncrypted    String?
  status          UserStatus       @default(ACTIVE)
  frozenReason    String?
  frozenAt        DateTime?
  virtualAccount  VirtualAccount?
  ledgerAccount   LedgerAccount?
  transactions    Transaction[]
  freezeLogs      EmergencyFreezeLog[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([phoneNumber])
}

model VirtualAccount {
  id              String      @id @default(uuid())
  userId          String      @unique
  user            User        @relation(fields: [userId], references: [id])
  provider        String      // e.g. MONNIFY, SAFEHAVEN
  accountNumber   String      @unique
  accountName     String
  bankName        String
  bankCode        String
  providerRef     String?
  createdAt       DateTime    @default(now())
}

model LedgerAccount {
  id              String            @id @default(uuid())
  userId          String?           @unique
  user            User?             @relation(fields: [userId], references: [id])
  accountNumber   String            @unique // e.g. VODE-1000293
  type            LedgerAccountType
  currency        String            @default("NGN")
  balance         BigInt            @default(0) // In minor units (Kobo)
  ledgerEntries   LedgerEntry[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model Transaction {
  id              String            @id @default(uuid())
  reference       String            @unique // Internal unique ref: VODE-TX-...
  idempotencyKey  String?           @unique
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  type            TransactionType
  status          TransactionStatus @default(CREATED)
  amount          BigInt            // In minor units (Kobo)
  fee             BigInt            @default(0)
  totalAmount     BigInt            // amount + fee
  currency        String            @default("NGN")
  
  // Destination Info
  recipientBank   String?
  recipientAccount String?
  recipientName   String?
  
  // Provider Info
  provider        String?
  providerRef     String?
  providerResponse Json?
  
  ledgerEntries   LedgerEntry[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([reference])
  @@index([userId, status])
}

model LedgerEntry {
  id              String         @id @default(uuid())
  transactionId   String
  transaction     Transaction    @relation(fields: [transactionId], references: [id])
  ledgerAccountId String
  ledgerAccount   LedgerAccount  @relation(fields: [ledgerAccountId], references: [id])
  direction       EntryDirection
  amount          BigInt         // In minor units (Kobo)
  balanceAfter    BigInt         // Snapshot for auditing
  createdAt       DateTime       @default(now())

  @@index([transactionId])
  @@index([ledgerAccountId])
}

model WebhookInbox {
  id              String         @id @default(uuid())
  provider        String
  providerEventId String         @unique
  eventType       String
  payload         Json
  status          String         @default("PENDING") // PENDING, PROCESSED, FAILED
  attempts        Int            @default(0)
  lastError       String?
  receivedAt      DateTime       @default(now())
  processedAt     DateTime?

  @@index([provider, providerEventId])
}

model OutboxEvent {
  id              String         @id @default(uuid())
  aggregateType   String         // TRANSACTION, USER, NOTIFICATION
  aggregateId     String
  eventType       String
  payload         Json
  published       Boolean        @default(false)
  createdAt       DateTime       @default(now())
  publishedAt     DateTime?

  @@index([published])
}

model AdminUser {
  id              String         @id @default(uuid())
  email           String         @unique
  passwordHash    String
  fullName        String
  role            AdminRole
  isActive        Boolean        @default(true)
  auditLogs       AuditLog[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model AuditLog {
  id              String         @id @default(uuid())
  adminUserId     String
  adminUser       AdminUser      @relation(fields: [adminUserId], references: [id])
  action          String
  targetResource  String
  resourceId      String?
  metadata        Json?
  ipAddress       String?
  createdAt       DateTime       @default(now())

  @@index([adminUserId])
}

model EmergencyFreezeLog {
  id              String         @id @default(uuid())
  userId          String
  user            User           @relation(fields: [userId], references: [id])
  channel         String         // WEB_KILL_SWITCH, ADMIN_PANEL, SOS_WHATSAPP
  ipAddress       String?
  userAgent       String?
  unfrozenAt      DateTime?
  unfrozenBy      String?        // Admin User ID or "SELF_LIVENESS_RECOVERY"
  unfreezeNotes   String?
  createdAt       DateTime       @default(now())

  @@index([userId])
}
```

---

# 10. Deployment & Contabo VPS Infrastructure Blueprint

The system runs on the initial Contabo VPS (Ubuntu 22.04 LTS), configured for rock-solid stability, containerization, and automated recovery.

```text
                               Contabo VPS (Ubuntu 22.04 LTS)
+-----------------------------------------------------------------------------------------+
|                                    NGINX (Reverse Proxy)                                |
|                           Port 80/443 (Let's Encrypt SSL Certificates)                  |
|          usevode.com  --> Next.js Marketing App (Port 3000)                             |
|          admin.usevode.com --> Next.js Admin Dashboard (Port 3001)                      |
|          api.usevode.com   --> Node.js Express API & WhatsApp Webhook (Port 4000)       |
+-----------------------------------------------------------------------------------------+
                                              |
                +-----------------------------+-----------------------------+
                |                                                           |
                v                                                           v
+-------------------------------+                           +-------------------------------+
|     PM2 PROCESS MANAGER       |                           |     DOCKER COMPOSE SYSTEM     |
|                               |                           |                               |
|  - `vode-api` (Port 4000)     |                           |  - PostgreSQL 16 Container    |
|  - `vode-worker-inbox`        |                           |    (Persisted Volume on Host) |
|  - `vode-worker-transfers`    |                           |  - Redis 7 Container          |
|  - `vode-worker-poller`       |                           |    (AOF persistence enabled)  |
|  - `vode-marketing` (Port 3000|                           +-------------------------------+
|  - `vode-admin` (Port 3001)   |                                           |
+-------------------------------+                                           v
                                                            +-------------------------------+
                                                            |  AUTOMATED DAILY BACKUP CRON  |
                                                            |  - pg_dump -> Encrypted       |
                                                            |  - Push offsite to Cloud/S3   |
                                                            +-------------------------------+
```

---

# 11. Phased Development Roadmap

### Phase 1: Core Financial Engine & Database (Weeks 1–2)
* Initialize backend repository with TypeScript, ESLint, and Prettier.
* Set up Dockerized PostgreSQL and Redis.
* Implement Prisma schema with migrations.
* Build the Double-Entry Ledger module with pessimistic row-locking (`SELECT FOR UPDATE`).
* Write comprehensive unit tests for balanced entries, zero balance overdraft protection, and idempotency.

### Phase 2: BaaS & Partner Integration (Weeks 3–4)
* Implement Partner Adapter Interface (e.g. Monnify or SafeHaven).
* Integrate Account Verification (Name Inquiry API).
* Implement Virtual Account generation webhook listener.
* Build Outward Transfer API call with signature verification and webhook inbox queue.
* Configure BullMQ worker queues for asynchronous webhook processing.

### Phase 3: WhatsApp Conversational Bot (Weeks 5–6)
* Connect to Meta WhatsApp Cloud API.
* Build FSM Router for WhatsApp interactive buttons and list menus.
* Implement User Onboarding, Terms acceptance, and Virtual Account presentation.
* Implement Send Money flow with Recipient Name Confirmation.
* Implement the Secure Transaction Authorization Sheet (Model A or B).

### Phase 4: Next.js Frontend Development (Weeks 7–8)
* **Marketing Landing Page (`usevode.com`):** Hero section, feature walkthroughs, security disclosures, FAQs, and WhatsApp launch buttons.
* **Admin Operations Dashboard (`admin.usevode.com`):** Secure authentication, KPI overview, Customer management, Transaction Inspector, Double-entry Ledger audit tool, and Failed Job retry UI.

### Phase 5: Testing, Hardening & Contabo Deployment (Weeks 9–10)
* Financial failure simulation testing (killing worker mid-transfer, handling duplicate webhooks).
* Load testing critical paths via k6.
* VPS deployment: Nginx configuration, SSL setup, Docker containerization, PM2 process configuration, and automated off-site database backup crons.
* Live pilot with internal test accounts and real funds.

---

# 12. Architecture Sign-Off & Next Actions

This Master PRD aligns the WhatsApp-first vision with financial correctness and provides clear operational control via the internal Admin Dashboard.

**Immediate Next Step:**  
Initialize the project repositories (`Backend/` and `Frontend/`) with the base Prisma schema, Express API scaffold, and BullMQ worker queues.

