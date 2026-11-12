import { Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AdminRole, AdminActionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import {
  AdminRequest,
  ADMIN_COOKIE_NAME,
  recordAuditLog,
} from "../middleware/admin-auth";
import { generateTotpSecret, buildTotpUri, verifyTotpCode } from "../lib/totp";
import { SystemConfigService } from "../services/system-config.service";
import { BankingService } from "../services/banking/banking.service";
import { AIService } from "../services/ai/ai.service";
import { AdminApprovalService } from "../services/admin-approval.service";
import { WhatsAppService } from "../services/whatsapp.service";

function serialize(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === "bigint" ? value.toString() : value))
  );
}

function setSessionCookie(res: Response, adminId: string): string {
  const token = jwt.sign({ adminId, stage: "AUTHENTICATED" }, env.JWT_SECRET, {
    expiresIn: "8h",
  });

  const isProd = env.NODE_ENV === "production";
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
  return token;
}

export class AdminController {
  // ==========================================
  // 1. AUTH & 2FA
  // ==========================================

  /**
   * Public check for whether initial SUPER_ADMIN bootstrap is still needed
   */
  static async bootstrapStatus(_req: AdminRequest, res: Response): Promise<void> {
    try {
      const existingCount = await prisma.adminUser.count();
      res.status(200).json({ needsBootstrap: existingCount === 0 });
    } catch {
      res.status(200).json({ needsBootstrap: false });
    }
  }

  /**
   * One-time bootstrap to create the very first SUPER_ADMIN when zero AdminUsers exist
   */
  static async bootstrapFirstAdmin(req: AdminRequest, res: Response): Promise<void> {
    try {
      const existingCount = await prisma.adminUser.count();
      if (existingCount > 0) {
        res.status(403).json({ error: "Bootstrap disabled: Admin users already exist." });
        return;
      }

      const { email, fullName, password } = req.body;
      if (!email || !fullName || !password || String(password).length < 8) {
        res.status(400).json({ error: "Valid email, fullName, and password (8+ chars) required." });
        return;
      }

      const passwordHash = await bcrypt.hash(String(password), 12);
      const totpSecret = generateTotpSecret();

      const admin = await prisma.adminUser.create({
        data: {
          email: String(email).trim().toLowerCase(),
          fullName: String(fullName).trim(),
          passwordHash,
          role: "SUPER_ADMIN",
          totpSecret,
          totpEnabled: false,
        },
      });

      res.status(201).json({
        success: true,
        admin: { id: admin.id, email: admin.email, role: admin.role },
        totpSecret,
        otpauthUri: buildTotpUri(admin.email, totpSecret),
      });
    } catch (err: any) {
      logger.error({ error: err.message }, "Admin bootstrap error");
      res.status(500).json({ error: "Failed to bootstrap admin." });
    }
  }

  static async login(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const admin = await prisma.adminUser.findUnique({
        where: { email: String(email).trim().toLowerCase() },
      });

      if (!admin || !admin.isActive) {
        res.status(401).json({ error: "Invalid credentials or account disabled." });
        return;
      }

      const valid = await bcrypt.compare(String(password), admin.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      // If 2FA is enabled, require TOTP challenge
      if (admin.totpEnabled && admin.totpSecret) {
        const challengeToken = jwt.sign(
          { adminId: admin.id, stage: "TOTP_CHALLENGE" },
          env.JWT_SECRET,
          { expiresIn: "5m" }
        );
        res.status(200).json({
          requires2fa: true,
          challengeToken,
        });
        return;
      }

      // If 2FA not yet enabled, sign authenticated session & flag setup prompt
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date(), lastLoginIp: req.ip || null },
      });

      const token = setSessionCookie(res, admin.id);
      await recordAuditLog({
        adminUserId: admin.id,
        action: "ADMIN_LOGIN",
        targetType: "ADMIN_USER",
        targetId: admin.id,
        req,
      });

      res.status(200).json({
        requires2fa: false,
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          totpEnabled: admin.totpEnabled,
        },
      });
    } catch (err: any) {
      logger.error({ error: err.message }, "Admin login error");
      res.status(500).json({ error: "Login failed." });
    }
  }

  static async verify2fa(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { challengeToken, code } = req.body;
      if (!challengeToken || !code) {
        res.status(400).json({ error: "Challenge token and 6-digit code required." });
        return;
      }

      const decoded = jwt.verify(String(challengeToken), env.JWT_SECRET) as {
        adminId: string;
        stage: string;
      };

      if (decoded.stage !== "TOTP_CHALLENGE") {
        res.status(401).json({ error: "Invalid 2FA challenge token." });
        return;
      }

      const admin = await prisma.adminUser.findUnique({ where: { id: decoded.adminId } });
      if (!admin || !admin.isActive || !admin.totpSecret) {
        res.status(401).json({ error: "Admin not found or 2FA unconfigured." });
        return;
      }

      if (!verifyTotpCode(admin.totpSecret, String(code))) {
        res.status(401).json({ error: "Invalid 6-digit authenticator code." });
        return;
      }

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date(), lastLoginIp: req.ip || null },
      });

      const token = setSessionCookie(res, admin.id);
      await recordAuditLog({
        adminUserId: admin.id,
        action: "ADMIN_LOGIN_2FA",
        targetType: "ADMIN_USER",
        targetId: admin.id,
        req,
      });

      res.status(200).json({
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          totpEnabled: admin.totpEnabled,
        },
      });
    } catch (err: any) {
      res.status(401).json({ error: "2FA challenge expired or invalid." });
    }
  }

  static async setup2fa(req: AdminRequest, res: Response): Promise<void> {
    try {
      const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: req.admin!.id } });
      const secret = admin.totpSecret || generateTotpSecret();
      if (!admin.totpSecret) {
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { totpSecret: secret },
        });
      }

      res.status(200).json({
        secret,
        otpauthUri: buildTotpUri(admin.email, secret),
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to initialize 2FA setup." });
    }
  }

  static async confirm2fa(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: req.admin!.id } });
      if (!admin.totpSecret || !verifyTotpCode(admin.totpSecret, String(code || ""))) {
        res.status(400).json({ error: "Invalid 6-digit code. Please try again." });
        return;
      }

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { totpEnabled: true },
      });

      await recordAuditLog({
        adminUserId: admin.id,
        action: "ENABLE_2FA",
        targetType: "ADMIN_USER",
        targetId: admin.id,
        req,
      });

      res.status(200).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to confirm 2FA." });
    }
  }

  static async logout(req: AdminRequest, res: Response): Promise<void> {
    if (req.admin) {
      await recordAuditLog({
        adminUserId: req.admin.id,
        action: "ADMIN_LOGOUT",
        targetType: "ADMIN_USER",
        targetId: req.admin.id,
        req,
      });
    }
    res.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
    res.status(200).json({ success: true });
  }

  static async me(req: AdminRequest, res: Response): Promise<void> {
    res.status(200).json({ admin: req.admin });
  }

  // ==========================================
  // 2. COMMAND CENTER & KILL-SWITCHES
  // ==========================================

  static async getOverview(_req: AdminRequest, res: Response): Promise<void> {
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        frozenUsers,
        pendingApprovals,
        inflow24h,
        outflow24h,
        totalFees,
        recentTransactions,
        flags,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { status: "FROZEN" } }),
        prisma.adminActionRequest.count({ where: { status: "PENDING_APPROVAL" } }),
        prisma.transaction.aggregate({
          where: { type: "TRANSFER_IN", status: "SUCCESS", createdAt: { gte: since24h } },
          _sum: { amountInKobo: true },
        }),
        prisma.transaction.aggregate({
          where: { type: "TRANSFER_OUT", status: "SUCCESS", createdAt: { gte: since24h } },
          _sum: { amountInKobo: true },
        }),
        prisma.transaction.aggregate({
          where: { status: "SUCCESS" },
          _sum: { feeInKobo: true },
        }),
        prisma.transaction.findMany({
          take: 12,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { fullName: true, phoneNumber: true } } },
        }),
        SystemConfigService.getFlags(),
      ]);

      res.status(200).json(
        serialize({
          kpis: {
            totalUsers,
            activeUsers,
            frozenUsers,
            pendingApprovals,
            inflow24hKobo: inflow24h._sum.amountInKobo || 0n,
            outflow24hKobo: outflow24h._sum.amountInKobo || 0n,
            totalFeesEarnedKobo: totalFees._sum.feeInKobo || 0n,
          },
          health: {
            database: "ONLINE",
            bankingProvider: BankingService.getProvider().providerName,
            aiProvider: AIService.getProvider().providerName,
            outwardTransfersEnabled: flags.outwardTransfersEnabled,
          },
          recentTransactions,
        })
      );
    } catch (err: any) {
      logger.error({ error: err.message }, "Admin overview error");
      res.status(500).json({ error: "Failed to load overview metrics." });
    }
  }

  static async getSystemConfig(_req: AdminRequest, res: Response): Promise<void> {
    const flags = await SystemConfigService.getFlags();
    const configs = await prisma.systemConfig.findMany();
    res.status(200).json({ flags, configs });
  }

  static async toggleKillSwitch(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { outwardTransfersEnabled, reason } = req.body;
      if (typeof outwardTransfersEnabled !== "boolean" || !reason) {
        res.status(400).json({ error: "outwardTransfersEnabled (boolean) and reason are required." });
        return;
      }

      const before = await SystemConfigService.getFlags();
      await SystemConfigService.setConfig(
        "OUTWARD_TRANSFERS_ENABLED",
        outwardTransfersEnabled,
        req.admin!.id
      );

      await recordAuditLog({
        adminUserId: req.admin!.id,
        action: outwardTransfersEnabled ? "RESUME_OUTWARD_TRANSFERS" : "PAUSE_OUTWARD_TRANSFERS",
        targetType: "SYSTEM_CONFIG",
        targetId: "OUTWARD_TRANSFERS_ENABLED",
        beforeState: { outwardTransfersEnabled: before.outwardTransfersEnabled },
        afterState: { outwardTransfersEnabled },
        reason: String(reason),
        req,
      });

      res.status(200).json({ success: true, outwardTransfersEnabled });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update kill-switch." });
    }
  }

  // ==========================================
  // 3. CUSTOMERS & EMERGENCY CONTROLS
  // ==========================================

  static async listCustomers(req: AdminRequest, res: Response): Promise<void> {
    try {
      const search = String(req.query.q || "").trim();
      const status = req.query.status ? String(req.query.status) : undefined;
      const limit = Math.min(Number(req.query.limit || 25), 100);
      const offset = Number(req.query.offset || 0);

      const where: any = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { phoneNumber: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } },
          { dedicatedNubans: { some: { accountNumber: { contains: search } } } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            phoneNumber: true,
            fullName: true,
            bvnLast4: true,
            status: true,
            kycTier: true,
            pinFailedAttempts: true,
            pinLockedUntil: true,
            createdAt: true,
            wallet: { select: { id: true, balanceInKobo: true, isLocked: true } },
            dedicatedNubans: {
              select: { accountNumber: true, bankName: true, accountName: true },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.status(200).json(serialize({ customers, total, limit, offset }));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch customers." });
    }
  }

  static async getCustomerDetail(req: AdminRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const customer = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          phoneNumber: true,
          fullName: true,
          bvnLast4: true,
          status: true,
          kycTier: true,
          pinFailedAttempts: true,
          pinLockedUntil: true,
          createdAt: true,
          updatedAt: true,
          wallet: true,
          dedicatedNubans: true,
          beneficiaries: { orderBy: { transferCount: "desc" }, take: 10 },
          emergencyFreezeLogs: { orderBy: { createdAt: "desc" }, take: 10 },
          transactions: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      });

      if (!customer) {
        res.status(404).json({ error: "Customer not found." });
        return;
      }

      await recordAuditLog({
        adminUserId: req.admin!.id,
        action: "VIEW_CUSTOMER_DETAIL",
        targetType: "USER",
        targetId: id,
        req,
      });

      res.status(200).json(serialize({ customer }));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch customer details." });
    }
  }

  static async freezeCustomer(req: AdminRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ error: "A mandatory reason is required to freeze an account." });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id },
        include: { wallet: true },
      });
      if (!user) {
        res.status(404).json({ error: "Customer not found." });
        return;
      }

      const freezeRef = `VODE-ADM-${Math.floor(100000 + Math.random() * 900000)}`;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data: { status: "FROZEN" } });
        if (user.wallet) {
          await tx.wallet.update({ where: { id: user.wallet.id }, data: { isLocked: true } });
        }
        await tx.ephemeralToken.updateMany({
          where: { userId: id, isUsed: false },
          data: { isUsed: true },
        });
        await tx.emergencyFreezeLog.create({
          data: {
            userId: id,
            reference: freezeRef,
            channel: "ADMIN_PANEL",
            ipAddress: req.ip || null,
            userAgent: req.headers["user-agent"] || null,
          },
        });
      });

      await recordAuditLog({
        adminUserId: req.admin!.id,
        action: "FREEZE_CUSTOMER",
        targetType: "USER",
        targetId: id,
        beforeState: { status: user.status },
        afterState: { status: "FROZEN", freezeRef },
        reason: String(reason),
        req,
      });

      await WhatsAppService.sendTextMessage(
        user.phoneNumber.replace("+", ""),
        `🚨 *Your Vode account has been locked by Security Operations.*\nRef: \`${freezeRef}\`\nContact support@usevode.com for assistance.`
      ).catch(() => {});

      res.status(200).json({ success: true, freezeRef });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to freeze customer account." });
    }
  }

  static async requestUnfreezeCustomer(req: AdminRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { reason, evidenceUrl } = req.body;
      if (!reason) {
        res.status(400).json({ error: "Verification notes / reason required to request unfreeze." });
        return;
      }

      const created = await AdminApprovalService.createRequest({
        type: "UNFREEZE_USER",
        targetType: "USER",
        targetId: id,
        payload: { userId: id },
        reason: String(reason),
        evidenceUrl,
        makerId: req.admin!.id,
        req,
      });

      res.status(201).json(serialize({ success: true, request: created }));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create unfreeze request." });
    }
  }

  // ==========================================
  // 4. TRANSACTIONS & PROVIDER RE-QUERY
  // ==========================================

  static async listTransactions(req: AdminRequest, res: Response): Promise<void> {
    try {
      const q = String(req.query.q || "").trim();
      const status = req.query.status ? String(req.query.status) : undefined;
      const type = req.query.type ? String(req.query.type) : undefined;
      const limit = Math.min(Number(req.query.limit || 25), 100);
      const offset = Number(req.query.offset || 0);

      const where: any = {};
      if (status) where.status = status;
      if (type) where.type = type;
      if (q) {
        where.OR = [
          { reference: { contains: q, mode: "insensitive" } },
          { partnerReference: { contains: q, mode: "insensitive" } },
          { recipientAccountNumber: { contains: q } },
          { recipientName: { contains: q, mode: "insensitive" } },
        ];
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, fullName: true, phoneNumber: true } } },
        }),
        prisma.transaction.count({ where }),
      ]);

      res.status(200).json(serialize({ transactions, total, limit, offset }));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch transactions." });
    }
  }

  static async getTransactionDetail(req: AdminRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, fullName: true, phoneNumber: true, kycTier: true } },
          ledgerEntries: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!transaction) {
        res.status(404).json({ error: "Transaction not found." });
        return;
      }

      res.status(200).json(serialize({ transaction }));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load transaction detail." });
    }
  }

  static async requeryTransaction(req: AdminRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const txRecord = await prisma.transaction.findUnique({ where: { id } });
      if (!txRecord) {
        res.status(404).json({ error: "Transaction not found." });
        return;
      }

      const providerStatus = await BankingService.getProvider().verifyTransfer(txRecord.reference);

      await recordAuditLog({
        adminUserId: req.admin!.id,
        action: "REQUERY_TRANSACTION_STATUS",
        targetType: "TRANSACTION",
        targetId: id,
        afterState: providerStatus,
        req,
      });

      res.status(200).json({
        reference: txRecord.reference,
        internalStatus: txRecord.status,
        providerStatus,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to re-query banking provider." });
    }
  }

  // ==========================================
  // 5. MAKER-CHECKER REVIEW & REVERT QUEUE
  // ==========================================

  static async listApprovals(req: AdminRequest, res: Response): Promise<void> {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      const where: any = status ? { status } : {};

      const requests = await prisma.adminActionRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          maker: { select: { id: true, fullName: true, email: true, role: true } },
          checker: { select: { id: true, fullName: true, email: true, role: true } },
        },
      });

      res.status(200).json(serialize({ requests }));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch approval queue." });
    }
  }

  static async createApprovalRequest(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { type, targetType, targetId, payload, reason, evidenceUrl } = req.body;
      if (!type || !targetType || !targetId || !reason) {
        res.status(400).json({ error: "type, targetType, targetId, and reason are required." });
        return;
      }

      const created = await AdminApprovalService.createRequest({
        type: type as AdminActionType,
        targetType: String(targetType),
        targetId: String(targetId),
        payload: payload || {},
        reason: String(reason),
        evidenceUrl: evidenceUrl ? String(evidenceUrl) : undefined,
        makerId: req.admin!.id,
        req,
      });

      res.status(201).json(serialize({ success: true, request: created }));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create Maker request." });
    }
  }

  static async approveRequest(req: AdminRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const { checkerNotes } = req.body || {};

    const result = await AdminApprovalService.approveAndExecute({
      requestId: id,
      checkerId: req.admin!.id,
      checkerNotes,
      req,
    });

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.status(200).json(result);
  }

  static async rejectRequest(req: AdminRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const { checkerNotes } = req.body || {};
    if (!checkerNotes) {
      res.status(400).json({ error: "Checker notes are required when rejecting a request." });
      return;
    }

    const result = await AdminApprovalService.rejectRequest({
      requestId: id,
      checkerId: req.admin!.id,
      checkerNotes: String(checkerNotes),
      req,
    });

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.status(200).json(serialize(result));
  }

  // ==========================================
  // 6. DOUBLE-ENTRY LEDGER INSPECTOR
  // ==========================================

  static async getLedger(req: AdminRequest, res: Response): Promise<void> {
    try {
      const limit = Math.min(Number(req.query.limit || 50), 100);
      const offset = Number(req.query.offset || 0);
      const type = req.query.type ? String(req.query.type) : undefined;
      const where: any = type ? { type } : {};

      const [entries, totalEntries, creditsSum, debitsSum, walletSum] = await Promise.all([
        prisma.ledgerEntry.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
          include: {
            wallet: { include: { user: { select: { fullName: true, phoneNumber: true } } } },
            transaction: { select: { reference: true, type: true, status: true } },
          },
        }),
        prisma.ledgerEntry.count({ where }),
        prisma.ledgerEntry.aggregate({ where: { type: "CREDIT" }, _sum: { amountInKobo: true } }),
        prisma.ledgerEntry.aggregate({ where: { type: "DEBIT" }, _sum: { amountInKobo: true } }),
        prisma.wallet.aggregate({ _sum: { balanceInKobo: true } }),
      ]);

      const totalCredits = creditsSum._sum.amountInKobo || 0n;
      const totalDebits = debitsSum._sum.amountInKobo || 0n;
      const netLedgerKobo = totalCredits - totalDebits;
      const totalWalletLiabilitiesKobo = walletSum._sum.balanceInKobo || 0n;

      res.status(200).json(
        serialize({
          entries,
          total: totalEntries,
          trialBalance: {
            totalCreditsKobo: totalCredits,
            totalDebitsKobo: totalDebits,
            netLedgerKobo,
            totalWalletLiabilitiesKobo,
            isBalanced: netLedgerKobo === totalWalletLiabilitiesKobo,
          },
        })
      );
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load ledger." });
    }
  }

  // ==========================================
  // 7. PARTNER RECONCILIATION
  // ==========================================

  static async listReconciliations(_req: AdminRequest, res: Response): Promise<void> {
    const batches = await prisma.reconciliationBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    res.status(200).json({ batches });
  }

  static async uploadReconciliationCsv(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { providerName, fileName, rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        res.status(400).json({ error: "rows array of settlement records is required." });
        return;
      }

      const discrepancies: any[] = [];
      let matchedCount = 0;

      for (const row of rows) {
        const ref = String(row.reference || "").trim();
        const partnerAmountKobo = BigInt(Math.round(Number(row.amountInNaira || 0) * 100));
        const partnerStatus = String(row.status || "SUCCESS").toUpperCase();

        const tx = await prisma.transaction.findFirst({
          where: {
            OR: [{ reference: ref }, { partnerReference: ref }],
          },
        });

        if (!tx) {
          discrepancies.push({
            type: "PARTNER_ONLY",
            reference: ref || "UNKNOWN",
            partnerRef: ref,
            partnerAmount: partnerAmountKobo,
            partnerStatus,
          });
          continue;
        }

        if (tx.amountInKobo !== partnerAmountKobo) {
          discrepancies.push({
            type: "AMOUNT_MISMATCH",
            reference: tx.reference,
            partnerRef: ref,
            internalAmount: tx.amountInKobo,
            partnerAmount: partnerAmountKobo,
            internalStatus: tx.status,
            partnerStatus,
          });
          continue;
        }

        if (tx.status !== partnerStatus) {
          discrepancies.push({
            type: "STATUS_MISMATCH",
            reference: tx.reference,
            partnerRef: ref,
            internalAmount: tx.amountInKobo,
            partnerAmount: partnerAmountKobo,
            internalStatus: tx.status,
            partnerStatus,
          });
          continue;
        }

        matchedCount += 1;
      }

      const batch = await prisma.reconciliationBatch.create({
        data: {
          providerName: String(providerName || BankingService.getProvider().providerName),
          fileName: String(fileName || "settlement.csv"),
          totalRows: rows.length,
          matchedCount,
          discrepancyCount: discrepancies.length,
          uploadedBy: req.admin!.id,
          discrepancies: {
            create: discrepancies,
          },
        },
        include: { discrepancies: true },
      });

      await recordAuditLog({
        adminUserId: req.admin!.id,
        action: "UPLOAD_RECONCILIATION_BATCH",
        targetType: "RECONCILIATION_BATCH",
        targetId: batch.id,
        afterState: { totalRows: rows.length, matchedCount, discrepancyCount: discrepancies.length },
        req,
      });

      res.status(201).json(serialize({ batch }));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to process reconciliation batch." });
    }
  }

  static async getReconciliationBatch(req: AdminRequest, res: Response): Promise<void> {
    const batch = await prisma.reconciliationBatch.findUnique({
      where: { id: String(req.params.batchId) },
      include: { discrepancies: true },
    });
    if (!batch) {
      res.status(404).json({ error: "Reconciliation batch not found." });
      return;
    }
    res.status(200).json(serialize({ batch }));
  }

  // ==========================================
  // 8. AUDIT LOGS & TEAM MANAGEMENT
  // ==========================================

  static async getAuditLogs(req: AdminRequest, res: Response): Promise<void> {
    try {
      const limit = Math.min(Number(req.query.limit || 50), 100);
      const offset = Number(req.query.offset || 0);
      const action = req.query.action ? String(req.query.action) : undefined;

      const where: any = action ? { action: { contains: action, mode: "insensitive" } } : {};

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
          include: { adminUser: { select: { fullName: true, email: true, role: true } } },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.status(200).json(serialize({ logs, total }));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch audit logs." });
    }
  }

  static async listTeam(_req: AdminRequest, res: Response): Promise<void> {
    const members = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        totpEnabled: true,
        isActive: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
      },
    });
    res.status(200).json({ members });
  }

  static async createAdminUser(req: AdminRequest, res: Response): Promise<void> {
    try {
      const { email, fullName, password, role } = req.body;
      if (!email || !fullName || !password || String(password).length < 8) {
        res.status(400).json({ error: "Valid email, fullName, and password (8+ chars) required." });
        return;
      }

      const validRoles: AdminRole[] = ["SUPER_ADMIN", "OPERATIONS", "FINANCE", "SUPPORT"];
      const assignedRole: AdminRole = validRoles.includes(role) ? role : "SUPPORT";

      const passwordHash = await bcrypt.hash(String(password), 12);
      const created = await prisma.adminUser.create({
        data: {
          email: String(email).trim().toLowerCase(),
          fullName: String(fullName).trim(),
          passwordHash,
          role: assignedRole,
        },
        select: { id: true, email: true, fullName: true, role: true, isActive: true },
      });

      await recordAuditLog({
        adminUserId: req.admin!.id,
        action: "CREATE_ADMIN_USER",
        targetType: "ADMIN_USER",
        targetId: created.id,
        afterState: created,
        req,
      });

      res.status(201).json({ member: created });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create admin user." });
    }
  }

  static async updateAdminUser(req: AdminRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { isActive, role } = req.body;
      if (id === req.admin!.id && isActive === false) {
        res.status(400).json({ error: "You cannot deactivate your own admin account." });
        return;
      }

      const updated = await prisma.adminUser.update({
        where: { id },
        data: {
          ...(typeof isActive === "boolean" ? { isActive } : {}),
          ...(role ? { role } : {}),
        },
        select: { id: true, email: true, fullName: true, role: true, isActive: true },
      });

      await recordAuditLog({
        adminUserId: req.admin!.id,
        action: "UPDATE_ADMIN_USER",
        targetType: "ADMIN_USER",
        targetId: id,
        afterState: updated,
        req,
      });

      res.status(200).json({ member: updated });
    } catch (err: any) {
      res.status(400).json({ error: "Failed to update admin user." });
    }
  }
}

