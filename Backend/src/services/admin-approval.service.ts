import { AdminActionType } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { recordAuditLog } from "../middleware/admin-auth";
import { SystemConfigService } from "./system-config.service";
import { WhatsAppService } from "./whatsapp.service";
import { BankingService } from "./banking/banking.service";
import { MockBankingProvider } from "./banking/mock.provider";
import { NombaBankingProvider } from "./banking/nomba.provider";
import { ProvidusBankingProvider } from "./banking/providus.provider";

export class AdminApprovalService {
  static async createRequest(params: {
    type: AdminActionType;
    targetType: string;
    targetId: string;
    payload: any;
    reason: string;
    evidenceUrl?: string;
    makerId: string;
    req?: Request;
  }) {
    const created = await prisma.adminActionRequest.create({
      data: {
        type: params.type,
        targetType: params.targetType,
        targetId: params.targetId,
        payload: params.payload,
        reason: params.reason,
        evidenceUrl: params.evidenceUrl || null,
        makerId: params.makerId,
      },
    });

    await recordAuditLog({
      adminUserId: params.makerId,
      action: `CREATE_APPROVAL_REQUEST_${params.type}`,
      targetType: params.targetType,
      targetId: params.targetId,
      afterState: { requestId: created.id, payload: params.payload },
      reason: params.reason,
      req: params.req,
    });

    return created;
  }

  static async approveAndExecute(params: {
    requestId: string;
    checkerId: string;
    checkerNotes?: string;
    req?: Request;
  }): Promise<{ success: boolean; message: string; request?: any }> {
    const { requestId, checkerId, checkerNotes, req } = params;

    const actionReq = await prisma.adminActionRequest.findUnique({
      where: { id: requestId },
    });

    if (!actionReq) {
      return { success: false, message: "Approval request not found." };
    }

    if (actionReq.status !== "PENDING_APPROVAL") {
      return { success: false, message: `Request is already ${actionReq.status}.` };
    }

    if (actionReq.makerId === checkerId) {
      return {
        success: false,
        message: "Two-person rule violation: Maker cannot approve their own request.",
      };
    }

    const payload: any = actionReq.payload || {};

    try {
      await prisma.$transaction(async (tx) => {
        if (actionReq.type === "REVERSE_TRANSACTION") {
          const originalTx = await tx.transaction.findUnique({
            where: { id: actionReq.targetId },
            include: { user: { include: { wallet: true } } },
          });

          if (!originalTx || !originalTx.user?.wallet) {
            throw new Error("Target transaction or user wallet not found.");
          }

          if (originalTx.status === "REVERSED") {
            throw new Error("Transaction has already been reversed.");
          }

          const reversalIdempotency = `rev_${originalTx.id}`;
          const existingRev = await tx.transaction.findUnique({
            where: { idempotencyKey: reversalIdempotency },
          });
          if (existingRev) {
            throw new Error("Reversal already executed (idempotency guard).");
          }

          const wallet = originalTx.user.wallet;
          await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${wallet.id} FOR UPDATE`;

          const lockedWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
          const refundKobo = originalTx.amountInKobo + originalTx.feeInKobo;
          const newBalance = lockedWallet.balanceInKobo + refundKobo;

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balanceInKobo: newBalance },
          });

          await tx.transaction.update({
            where: { id: originalTx.id },
            data: { status: "REVERSED" },
          });

          const revTx = await tx.transaction.create({
            data: {
              reference: `VD_REV_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
              idempotencyKey: reversalIdempotency,
              userId: originalTx.userId,
              type: "REVERSAL",
              status: "SUCCESS",
              amountInKobo: refundKobo,
              feeInKobo: 0n,
              recipientName: originalTx.recipientName,
              narration: `Admin Reversal for ${originalTx.reference}: ${actionReq.reason}`,
            },
          });

          await tx.ledgerEntry.create({
            data: {
              walletId: wallet.id,
              transactionId: revTx.id,
              type: "CREDIT",
              amountInKobo: refundKobo,
              balanceAfterInKobo: newBalance,
              description: `Maker-Checker Reversal of ${originalTx.reference}`,
            },
          });
        } else if (actionReq.type === "UNFREEZE_USER") {
          const user = await tx.user.findUnique({
            where: { id: actionReq.targetId },
            include: { wallet: true },
          });
          if (!user) throw new Error("User not found.");

          await tx.user.update({
            where: { id: user.id },
            data: { status: "ACTIVE", pinFailedAttempts: 0, pinLockedUntil: null },
          });

          if (user.wallet) {
            await tx.wallet.update({
              where: { id: user.wallet.id },
              data: { isLocked: false },
            });
          }

          await tx.emergencyFreezeLog.updateMany({
            where: { userId: user.id, unfrozenAt: null },
            data: { unfrozenAt: new Date(), unfrozenBy: checkerId },
          });
        } else if (actionReq.type === "MANUAL_ADJUSTMENT") {
          const user = await tx.user.findUnique({
            where: { id: actionReq.targetId },
            include: { wallet: true },
          });
          if (!user || !user.wallet) throw new Error("User or wallet not found.");

          const direction = payload.direction === "DEBIT" ? "DEBIT" : "CREDIT";
          const amountKobo = BigInt(payload.amountInKobo || 0);
          if (amountKobo <= 0n) throw new Error("Adjustment amount must be positive.");

          await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${user.wallet.id} FOR UPDATE`;
          const lockedWallet = await tx.wallet.findUniqueOrThrow({ where: { id: user.wallet.id } });

          if (direction === "DEBIT" && lockedWallet.balanceInKobo < amountKobo) {
            throw new Error("Insufficient balance for manual debit adjustment.");
          }

          const newBalance =
            direction === "CREDIT"
              ? lockedWallet.balanceInKobo + amountKobo
              : lockedWallet.balanceInKobo - amountKobo;

          await tx.wallet.update({
            where: { id: user.wallet.id },
            data: { balanceInKobo: newBalance },
          });

          const adjTx = await tx.transaction.create({
            data: {
              reference: `VD_ADJ_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
              idempotencyKey: `adj_${actionReq.id}`,
              userId: user.id,
              type: "ADJUSTMENT",
              status: "SUCCESS",
              amountInKobo: amountKobo,
              feeInKobo: 0n,
              narration: `Admin ${direction} Adjustment: ${actionReq.reason}`,
            },
          });

          await tx.ledgerEntry.create({
            data: {
              walletId: user.wallet.id,
              transactionId: adjTx.id,
              type: direction,
              amountInKobo: amountKobo,
              balanceAfterInKobo: newBalance,
              description: `Admin Adjustment (${direction}): ${actionReq.reason}`,
            },
          });
        } else if (actionReq.type === "SWITCH_BANKING_PROVIDER") {
          const nextProvider = String(payload.provider || "").toLowerCase();
          if (!["nomba", "providus", "mock"].includes(nextProvider)) {
            throw new Error(`Unsupported banking provider: ${nextProvider}`);
          }
          await SystemConfigService.setConfig("ACTIVE_BANKING_PROVIDER", nextProvider, checkerId);
          if (nextProvider === "mock") BankingService.setProvider(new MockBankingProvider());
          else if (nextProvider === "providus") BankingService.setProvider(new ProvidusBankingProvider());
          else BankingService.setProvider(new NombaBankingProvider());
        }

        await tx.adminActionRequest.update({
          where: { id: actionReq.id },
          data: {
            status: "EXECUTED",
            checkerId,
            checkerNotes: checkerNotes || null,
            reviewedAt: new Date(),
            executedAt: new Date(),
          },
        });
      });

      await recordAuditLog({
        adminUserId: checkerId,
        action: `APPROVE_EXECUTE_${actionReq.type}`,
        targetType: actionReq.targetType,
        targetId: actionReq.targetId,
        afterState: { requestId: actionReq.id, status: "EXECUTED" },
        reason: checkerNotes || actionReq.reason,
        req,
      });

      // Notify user on WhatsApp for user-facing actions (best effort)
      if (actionReq.type === "UNFREEZE_USER") {
        const u = await prisma.user.findUnique({ where: { id: actionReq.targetId } });
        if (u) {
          await WhatsAppService.sendTextMessage(
            u.phoneNumber.replace("+", ""),
            `🔓 *Your Vode account has been unlocked!*\n\nYour identity verification is complete and your wallet is active again.`
          ).catch(() => {});
        }
      }

      return { success: true, message: "Action approved and executed successfully." };
    } catch (err: any) {
      logger.error({ error: err.message, requestId }, "Failed executing approved AdminActionRequest");
      await prisma.adminActionRequest.update({
        where: { id: actionReq.id },
        data: { status: "FAILED", errorMessage: err.message, checkerId, reviewedAt: new Date() },
      });
      return { success: false, message: err.message || "Execution failed." };
    }
  }

  static async rejectRequest(params: {
    requestId: string;
    checkerId: string;
    checkerNotes: string;
    req?: Request;
  }) {
    const actionReq = await prisma.adminActionRequest.findUnique({
      where: { id: params.requestId },
    });
    if (!actionReq) return { success: false, message: "Request not found." };
    if (actionReq.status !== "PENDING_APPROVAL") {
      return { success: false, message: `Request is already ${actionReq.status}.` };
    }
    if (actionReq.makerId === params.checkerId) {
      return { success: false, message: "Maker cannot reject their own request; wait for a Checker." };
    }

    const updated = await prisma.adminActionRequest.update({
      where: { id: actionReq.id },
      data: {
        status: "REJECTED",
        checkerId: params.checkerId,
        checkerNotes: params.checkerNotes,
        reviewedAt: new Date(),
      },
    });

    await recordAuditLog({
      adminUserId: params.checkerId,
      action: `REJECT_${actionReq.type}`,
      targetType: actionReq.targetType,
      targetId: actionReq.targetId,
      afterState: { requestId: actionReq.id, status: "REJECTED" },
      reason: params.checkerNotes,
      req: params.req,
    });

    return { success: true, message: "Request rejected.", request: updated };
  }
}

