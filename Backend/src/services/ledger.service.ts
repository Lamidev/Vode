import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { BankingService } from "./banking/banking.service";
import { WhatsAppService } from "./whatsapp.service";
import { InboundCreditEvent } from "./banking/banking.interface";
import { env } from "../config/env";
import { BeneficiaryService } from "./beneficiary.service";
import { SystemConfigService } from "./system-config.service";

export interface PrepareTransferParams {
  userId: string;
  amountInNaira: number;
  recipientAccountNumber: string;
  recipientBankCode: string;
  recipientBankName?: string;
  narration?: string;
}

export class LedgerService {
  private static NOMINAL_TRANSFER_FEE_KOBO = 1000n; // ₦10.00 flat NIP clearing fee

  private static TIER_LIMITS_KOBO: Record<string, { singleKobo: bigint; dailyKobo: bigint }> = {
    TIER_0: { singleKobo: 0n, dailyKobo: 0n },
    TIER_1: { singleKobo: 50_000_00n, dailyKobo: 50_000_00n },       // ₦50,000 single & daily
    TIER_2: { singleKobo: 200_000_00n, dailyKobo: 500_000_00n },     // ₦200,000 single / ₦500,000 daily
    TIER_3: { singleKobo: 1_000_000_00n, dailyKobo: 5_000_000_00n }, // ₦1,000,000 single / ₦5,000,000 daily
  };

  /**
   * Enforce CBN KYC Tier single-transaction and 24-hour rolling daily transfer limits
   */
  private static async checkTierTransferLimits(
    db: any,
    userId: string,
    kycTier: string,
    amountInKobo: bigint
  ): Promise<string | null> {
    const limits = this.TIER_LIMITS_KOBO[kycTier] || this.TIER_LIMITS_KOBO.TIER_1;

    if (amountInKobo > limits.singleKobo) {
      const singleNaira = (Number(limits.singleKobo) / 100).toLocaleString("en-NG");
      return `Single transfer limit for your ${kycTier.replace("_", " ")} account is ₦${singleNaira}. Please send a smaller amount or upgrade your KYC tier.`;
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOutward = await db.transaction.aggregate({
      where: {
        userId,
        type: "TRANSFER_OUT",
        status: { in: ["SUCCESS", "PROCESSING"] },
        createdAt: { gte: since24h },
      },
      _sum: { amountInKobo: true },
    });

    const spent24h = recentOutward._sum?.amountInKobo || 0n;
    if (spent24h + amountInKobo > limits.dailyKobo) {
      const dailyNaira = (Number(limits.dailyKobo) / 100).toLocaleString("en-NG");
      const remainingNaira = Math.max(0, Number(limits.dailyKobo - spent24h) / 100).toLocaleString("en-NG");
      return `24-hour transfer limit reached (₦${dailyNaira} max for ${kycTier.replace("_", " ")}). Remaining daily allowance: ₦${remainingNaira}.`;
    }

    return null;
  }

  /**
   * Process an Inbound Deposit (Universal Core Webhook Handler)
   * Idempotent & Atomic double-entry bookkeeping.
   */
  static async processInboundDeposit(event: InboundCreditEvent): Promise<{ success: boolean; message: string }> {
    const { accountNumber, amountInNaira, senderName, senderBank, partnerReference, narration } = event;

    if (!accountNumber || amountInNaira <= 0) {
      return { success: false, message: "Invalid deposit payload" };
    }

    const amountInKobo = BigInt(Math.round(amountInNaira * 100));
    const idempotencyKey = `dep_${partnerReference}`;

    logger.info(
      { accountNumber, amountInNaira, partnerReference },
      "📥 Processing inbound deposit ledger event"
    );

    try {
      // 1. Check if this deposit was already credited (Idempotency)
      const existingTx = await prisma.transaction.findUnique({
        where: { idempotencyKey },
      });

      if (existingTx && existingTx.status === "SUCCESS") {
        logger.warn({ idempotencyKey }, "Duplicate deposit webhook ignored (already credited)");
        return { success: true, message: "Deposit already processed" };
      }

      // 2. Resolve the owner of this NUBAN
      const dedicatedNuban = await prisma.dedicatedNuban.findUnique({
        where: { accountNumber },
        include: { user: { include: { wallet: true } } },
      });

      if (!dedicatedNuban || !dedicatedNuban.user || !dedicatedNuban.user.wallet) {
        logger.error({ accountNumber }, "Inbound deposit to unrecognized NUBAN");
        return { success: false, message: "NUBAN not found in Vode system" };
      }

      const user = dedicatedNuban.user;
      const wallet = user.wallet!;
      const reference = `VD_DEP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Atomic Database Transaction: Credit Wallet + Ledger Entry + Transaction
      const result = await prisma.$transaction(async (tx) => {
        // Pessimistic row-level lock on wallet to serialize concurrent credits/debits
        await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${wallet.id} FOR UPDATE`;

        const currentWallet = await tx.wallet.findUniqueOrThrow({
          where: { id: wallet.id },
        });

        const newBalanceInKobo = currentWallet.balanceInKobo + amountInKobo;

        // Update Wallet Balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceInKobo: newBalanceInKobo },
        });

        // Create Transaction record
        const transaction = await tx.transaction.create({
          data: {
            reference,
            idempotencyKey,
            userId: user.id,
            type: "TRANSFER_IN",
            status: "SUCCESS",
            amountInKobo,
            feeInKobo: 0n,
            recipientBankCode: dedicatedNuban.bankCode,
            recipientAccountNumber: dedicatedNuban.accountNumber,
            recipientName: dedicatedNuban.accountName,
            narration: narration || `Deposit from ${senderName}`,
            partnerReference,
          },
        });

        // Create Double-Entry Ledger Entry
        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            transactionId: transaction.id,
            type: "CREDIT",
            amountInKobo,
            balanceAfterInKobo: newBalanceInKobo,
            description: `Deposit: ₦${amountInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })} from ${senderName} (${senderBank})`,
          },
        });

        return { newBalanceInKobo, transaction };
      });

      const newBalanceNaira = (Number(result.newBalanceInKobo) / 100).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      });

      // 4. Dispatch Instant Celebration Alert to User on WhatsApp
      const cleanPhone = user.phoneNumber.replace("+", "");
      await WhatsAppService.sendTextMessage(
        cleanPhone,
        `🔔 *Money Received!*\n\n` +
        `*₦${amountInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}* has been credited to your Vode wallet.\n\n` +
        `👤 *From:* ${senderName.toUpperCase()}\n` +
        `🏛️ *Bank:* ${senderBank}\n` +
        `💳 *To Account:* \`${dedicatedNuban.accountNumber}\`\n\n` +
        `💰 *New Balance:* *₦${newBalanceNaira}*\n\n` +
        `_Reply *"Send"* to make a transfer or *"Airtime"* to recharge._`
      );

      logger.info(
        { userId: user.id, newBalance: newBalanceNaira },
        "✅ Inbound deposit successfully credited and WhatsApp alert delivered"
      );

      return { success: true, message: "Deposit processed successfully" };
    } catch (err: any) {
      logger.error({ error: err.message, event }, "Failed to process inbound deposit");
      return { success: false, message: err.message };
    }
  }

  /**
   * Prepare an Outward Bank Transfer (Initiated via WhatsApp Chat)
   * Runs Name Enquiry, validates sufficient funds, and generates a 90-second payment token.
   */
  static async prepareOutwardTransfer(params: PrepareTransferParams): Promise<{
    success: boolean;
    token?: string;
    authUrl?: string;
    details?: any;
    errorMessage?: string;
  }> {
    const { userId, amountInNaira, recipientAccountNumber, recipientBankCode, recipientBankName, narration } = params;

    try {
      const flags = await SystemConfigService.getFlags();
      if (!flags.outwardTransfersEnabled) {
        return {
          success: false,
          errorMessage: "Outward transfers are temporarily paused for scheduled maintenance. Your funds are safe.",
        };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user || user.status !== "ACTIVE" || !user.wallet) {
        return { success: false, errorMessage: "Your account is not active or is currently locked." };
      }

      if (user.wallet.isLocked) {
        return { success: false, errorMessage: "Your wallet is temporarily locked. Please visit usevode.com/freeze." };
      }

      const amountInKobo = BigInt(Math.round(amountInNaira * 100));
      const totalDebitInKobo = amountInKobo + this.NOMINAL_TRANSFER_FEE_KOBO;

      // Enforce CBN KYC Tier Single & Daily Transfer Limits
      const limitError = await this.checkTierTransferLimits(prisma, user.id, user.kycTier, amountInKobo);
      if (limitError) {
        return { success: false, errorMessage: limitError };
      }

      if (user.wallet.balanceInKobo < totalDebitInKobo) {
        const currentBalanceNaira = Number(user.wallet.balanceInKobo) / 100;
        return {
          success: false,
          errorMessage: `Insufficient funds. Your current balance is ₦${currentBalanceNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}, but this transfer requires ₦${(Number(totalDebitInKobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })} (including ₦10 fee).`,
        };
      }

      // 1. Perform Name Enquiry via Active Core Banking Provider
      logger.info({ recipientAccountNumber, recipientBankCode }, "🔍 Performing Name Enquiry");
      const lookup = await BankingService.lookupAccount(recipientAccountNumber, recipientBankCode);

      if (!lookup || !lookup.accountName) {
        return {
          success: false,
          errorMessage: `Could not verify account number ${recipientAccountNumber}. Please double-check the account number and bank.`,
        };
      }

      // 2. Generate a 90-second Ephemeral Authorization Token
      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 90 * 1000); // 90 seconds
      const idempotencyKey = `tx_out_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      await prisma.ephemeralToken.create({
        data: {
          token,
          userId: user.id,
          phoneNumber: user.phoneNumber,
          type: "PIN_AUTHORIZATION",
          expiresAt,
          payload: {
            amountInNaira,
            amountInKobo: amountInKobo.toString(),
            feeInKobo: this.NOMINAL_TRANSFER_FEE_KOBO.toString(),
            recipientAccountNumber,
            recipientBankCode,
            recipientBankName: lookup.bankName || recipientBankName || "Commercial Bank",
            recipientName: lookup.accountName,
            narration: narration || `Transfer from ${user.fullName || "Vode"}`,
            idempotencyKey,
          },
        },
      });

      const authUrl = `${env.FRONTEND_URL || "https://www.usevode.com"}/pay?tx=${token}`;

      return {
        success: true,
        token,
        authUrl,
        details: {
          recipientName: lookup.accountName,
          recipientAccountNumber,
          bankName: lookup.bankName || recipientBankName,
          amountInNaira,
          feeInNaira: 10,
          totalDebitInNaira: amountInNaira + 10,
        },
      };
    } catch (err: any) {
      logger.error({ error: err.message, params }, "Error preparing outward transfer");
      return { success: false, errorMessage: err.message };
    }
  }

  /**
   * Execute an Outward Bank Transfer after Secure PIN Verification
   */
  static async executeOutwardTransfer(params: {
    token: string;
    pin: string;
  }): Promise<{ success: boolean; reference?: string; message: string; balanceNaira?: number }> {
    const { token, pin } = params;

    try {
      const flags = await SystemConfigService.getFlags();
      if (!flags.outwardTransfersEnabled) {
        return {
          success: false,
          message: "Outward transfers are temporarily paused by system administrators. Your funds have not been debited.",
        };
      }

      // 1. Validate Token
      const tokenRecord = await prisma.ephemeralToken.findUnique({
        where: { token },
        include: { user: { include: { wallet: true } } },
      });

      if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt < new Date()) {
        return {
          success: false,
          message: "Payment session has expired (90s limit). Please initiate the transfer again in WhatsApp.",
        };
      }

      if (tokenRecord.type !== "PIN_AUTHORIZATION" || !tokenRecord.user || !tokenRecord.user.wallet) {
        return { success: false, message: "Invalid payment token structure." };
      }

      const user = tokenRecord.user;
      const wallet = user.wallet!;
      const payload: any = tokenRecord.payload;

      if (user.status !== "ACTIVE" || wallet.isLocked) {
        return {
          success: false,
          message: "Your account is currently frozen or locked. Visit usevode.com/freeze for assistance.",
        };
      }

      // 2. Check PIN Brute-Force Lockout
      if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
        const minsLeft = Math.ceil((user.pinLockedUntil.getTime() - Date.now()) / 60000);
        return {
          success: false,
          message: `Too many incorrect PIN attempts. Please wait ${minsLeft} minute(s) before trying again.`,
        };
      }

      // 3. Verify 4-Digit PIN Hash
      if (!user.pinHash) {
        return { success: false, message: "No security PIN set. Please re-onboard on WhatsApp." };
      }

      const isPinValid = await bcrypt.compare(pin, user.pinHash);
      if (!isPinValid) {
        const nextAttempts = (user.pinFailedAttempts || 0) + 1;
        const lockUntil = nextAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            pinFailedAttempts: nextAttempts,
            ...(lockUntil ? { pinLockedUntil: lockUntil } : {}),
          },
        });
        logger.warn({ userId: user.id, attempts: nextAttempts }, "❌ Incorrect PIN entered for payment authorization");
        if (lockUntil) {
          return {
            success: false,
            message: "Too many incorrect PIN attempts. Payment authorization is locked for 15 minutes.",
          };
        }
        return {
          success: false,
          message: `Incorrect PIN (${5 - nextAttempts} attempt(s) remaining before temporary lock).`,
        };
      }

      // Reset failed PIN attempts on valid PIN
      if (user.pinFailedAttempts > 0 || user.pinLockedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: { pinFailedAttempts: 0, pinLockedUntil: null },
        });
      }

      const amountInKobo = BigInt(payload.amountInKobo);
      const feeInKobo = BigInt(payload.feeInKobo);
      const totalDebitInKobo = amountInKobo + feeInKobo;
      const reference = `VD_TX_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Atomic Debit Transaction in Database with Pessimistic Row Lock
      const debitResult = await prisma.$transaction(async (tx) => {
        // Claim single-use token atomically inside transaction
        const claimed = await tx.ephemeralToken.updateMany({
          where: { token, isUsed: false },
          data: { isUsed: true },
        });
        if (claimed.count === 0) {
          throw new Error("Payment session has already been used.");
        }

        // Lock wallet row to prevent concurrent double-spend
        await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${wallet.id} FOR UPDATE`;

        const currentWallet = await tx.wallet.findUniqueOrThrow({
          where: { id: wallet.id },
        });

        if (currentWallet.isLocked) {
          throw new Error("Wallet is currently locked.");
        }

        // Re-check tier limits under lock
        const limitErr = await this.checkTierTransferLimits(tx, user.id, user.kycTier, amountInKobo);
        if (limitErr) {
          throw new Error(limitErr);
        }

        if (currentWallet.balanceInKobo < totalDebitInKobo) {
          throw new Error("Insufficient funds at execution time.");
        }

        const newBalanceInKobo = currentWallet.balanceInKobo - totalDebitInKobo;

        // Debit Wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceInKobo: newBalanceInKobo },
        });

        // Create Transaction in PROCESSING status
        const transaction = await tx.transaction.create({
          data: {
            reference,
            idempotencyKey: payload.idempotencyKey || `tx_${reference}`,
            userId: user.id,
            type: "TRANSFER_OUT",
            status: "PROCESSING",
            amountInKobo,
            feeInKobo,
            recipientBankCode: payload.recipientBankCode,
            recipientAccountNumber: payload.recipientAccountNumber,
            recipientName: payload.recipientName,
            narration: payload.narration,
          },
        });

        // Debit Ledger Entry
        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            transactionId: transaction.id,
            type: "DEBIT",
            amountInKobo,
            balanceAfterInKobo: newBalanceInKobo + feeInKobo,
            description: `Transfer to ${payload.recipientName} (${payload.recipientBankName})`,
          },
        });

        // Fee Ledger Entry
        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            transactionId: transaction.id,
            type: "DEBIT",
            amountInKobo: feeInKobo,
            balanceAfterInKobo: newBalanceInKobo,
            description: `Network clearing fee for ${reference}`,
          },
        });

        return { newBalanceInKobo, transaction };
      });

      // 5. Execute Interbank Transfer on Active Core Banking Provider
      const transferResponse = await BankingService.sendTransfer({
        transactionReference: reference,
        amountInNaira: Number(payload.amountInNaira),
        recipientAccountNumber: payload.recipientAccountNumber,
        recipientBankCode: payload.recipientBankCode,
        recipientName: payload.recipientName,
        senderName: user.fullName || "Vode User",
        narration: payload.narration,
      });

      const balanceNaira = Number(debitResult.newBalanceInKobo) / 100;
      const cleanPhone = user.phoneNumber.replace("+", "");

      // 6. Handle Provider Status (SUCCESS vs PENDING vs FAILED)
      if (transferResponse.status === "PENDING") {
        await prisma.transaction.update({
          where: { reference },
          data: {
            status: "PROCESSING",
            partnerReference: transferResponse.partnerReference,
          },
        });

        await WhatsAppService.sendTextMessage(
          cleanPhone,
          `⏳ *Transfer Processing*\n\n` +
          `Your transfer of *₦${Number(payload.amountInNaira).toLocaleString("en-NG", { minimumFractionDigits: 2 })}* to *${payload.recipientName}* is awaiting confirmation from the banking network.\n` +
          `• *Ref:* \`${reference}\`\n\n` +
          `_Do not re-send. We will notify you as soon as the bank confirms settlement._`
        );

        return {
          success: true,
          reference,
          balanceNaira,
          message: "Transfer submitted and awaiting banking network confirmation.",
        };
      }

      if (transferResponse.success && transferResponse.status === "SUCCESS") {
        await prisma.transaction.update({
          where: { reference },
          data: {
            status: "SUCCESS",
            partnerReference: transferResponse.partnerReference,
          },
        });
      } else {
        // Only reverse when provider confirms FAILED (never on ambiguous PENDING)
        logger.error({ reference, error: transferResponse.errorMessage }, "Settlement rail failed, reversing debit");
        await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${wallet.id} FOR UPDATE`;
          const lockedWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
          const refundedBalance = lockedWallet.balanceInKobo + totalDebitInKobo;

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balanceInKobo: refundedBalance },
          });
          await tx.transaction.update({
            where: { reference },
            data: { status: "FAILED" },
          });
          await tx.ledgerEntry.create({
            data: {
              walletId: wallet.id,
              transactionId: debitResult.transaction.id,
              type: "CREDIT",
              amountInKobo: totalDebitInKobo,
              balanceAfterInKobo: refundedBalance,
              description: `Reversal for failed transfer ${reference}`,
            },
          });
        });

        return {
          success: false,
          message: "Transfer could not be completed by banking network. Your funds have been refunded.",
        };
      }

      // Auto-save recipient as a saved beneficiary
      try {
        const defaultNickname = payload.recipientName.split(" ")[0] || payload.recipientName;
        await BeneficiaryService.saveBeneficiary({
          userId: user.id,
          nickname: defaultNickname,
          accountNumber: payload.recipientAccountNumber,
          bankCode: payload.recipientBankCode,
          bankName: payload.recipientBankName,
          accountName: payload.recipientName,
        });
      } catch (saveErr: any) {
        logger.warn({ error: saveErr.message }, "Non-blocking beneficiary save error");
      }

      // 7. Send Instant Transaction Receipt via WhatsApp
      await WhatsAppService.sendTextMessage(
        cleanPhone,
        `✅ *Transfer Successful!*\n\n` +
        `• *Amount:* ₦${Number(payload.amountInNaira).toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
        `• *Recipient:* ${payload.recipientName}\n` +
        `• *Bank:* ${payload.recipientBankName}\n` +
        `• *Account:* \`${payload.recipientAccountNumber}\`\n` +
        `• *Ref:* \`${reference}\`\n\n` +
        `💰 *Remaining Balance:* *₦${balanceNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}*\n\n` +
        `_Thank you for banking with Vode!_`
      );

      return {
        success: true,
        reference,
        balanceNaira,
        message: "Transfer completed successfully",
      };
    } catch (err: any) {
      logger.error({ error: err.message, token }, "Fatal error executing outward transfer");
      return { success: false, message: err.message || "Failed to process transfer" };
    }
  }
}
