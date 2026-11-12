import { Request, Response } from "express";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { WhatsAppService } from "../services/whatsapp.service";
import { BankingService } from "../services/banking/banking.service";
import { LedgerService } from "../services/ledger.service";
import { BankMatcher } from "../services/banking/bank-matcher";
import { BeneficiaryService } from "../services/beneficiary.service";
import { StatementService } from "../services/statement.service";
import { SupportTicketService } from "../services/support-ticket.service";
import { AIService } from "../services/ai/ai.service";

function parseAmount(raw: string): number {
  let cleaned = raw.toLowerCase().replace(/[,₦ngn\s]/g, "");
  if (cleaned.endsWith("k")) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? 0 : num * 1000;
  }
  if (cleaned.endsWith("m")) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? 0 : num * 1000000;
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export class WebhookController {
  /**
   * Meta Webhook Verification Handshake (GET /webhook)
   */
  static verifyWebhook(req: Request, res: Response): void {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      logger.info("✅ WhatsApp webhook successfully verified by Meta");
      res.status(200).send(challenge);
      return;
    }

    logger.warn({ token }, "❌ WhatsApp webhook verification failed: Invalid verify token");
    res.status(403).json({ error: "Verification token mismatch" });
  }

  /**
   * Universal Banking Inbound Credit Webhook (POST /webhook/banking/credit)
   * Decoupled from specific vendor rails (Nomba, Providus, Mock, etc.)
   */
  static async handleInboundCredit(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      logger.info({ payload }, "🔔 Inbound banking credit webhook callback received");

      const creditEvent = BankingService.parseInboundCredit(payload, req.headers);
      if (!creditEvent) {
        logger.warn({ payload }, "Could not parse inbound credit event with active banking provider");
        res.status(400).json({ status: "error", message: "Invalid or unrecognized credit event payload" });
        return;
      }

      const result = await LedgerService.processInboundDeposit(creditEvent);
      if (result.success) {
        res.status(200).json({ status: "success", message: result.message });
      } else {
        res.status(422).json({ status: "failed", message: result.message });
      }
    } catch (err: any) {
      logger.error({ error: err.message }, "Error handling banking credit webhook");
      res.status(500).json({ status: "error", message: "Internal server error processing deposit webhook" });
    }
  }

  /**
   * Fetch payment session details for the secure PIN sheet (GET /webhook/banking/token/:token)
   */
  static async getPaymentSession(req: Request, res: Response): Promise<void> {
    try {
      const token = String(req.params.token || "");
      if (!token) {
        res.status(400).json({ error: "Authorization token is required" });
        return;
      }

      const tokenRecord = await prisma.ephemeralToken.findUnique({
        where: { token },
      });

      if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt < new Date()) {
        res.status(404).json({
          error: "This payment authorization session has expired (90s limit) or has already been used.",
        });
        return;
      }

      if (tokenRecord.type !== "PIN_AUTHORIZATION" || !tokenRecord.payload) {
        res.status(400).json({ error: "Invalid payment token type." });
        return;
      }

      const payload: any = tokenRecord.payload;
      res.status(200).json({
        recipientName: payload.recipientName,
        recipientAccountNumber: payload.recipientAccountNumber,
        recipientBankName: payload.recipientBankName,
        amountInNaira: Number(payload.amountInNaira),
        feeInNaira: 10,
        totalDebitInNaira: Number(payload.amountInNaira) + 10,
        expiresAt: tokenRecord.expiresAt,
      });
    } catch (err: any) {
      logger.error({ error: err.message }, "Error fetching payment session");
      res.status(500).json({ error: "Internal server error fetching payment session" });
    }
  }

  /**
   * Execute an Outward Bank Transfer after Secure PIN Verification (POST /webhook/banking/execute-transfer)
   */
  static async executeTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { token, pin } = req.body;
      if (!token || !pin) {
        res.status(400).json({ error: "Token and 4-digit PIN are required." });
        return;
      }

      if (!/^\d{4}$/.test(pin)) {
        res.status(400).json({ error: "PIN must be exactly 4 digits." });
        return;
      }

      const result = await LedgerService.executeOutwardTransfer({ token, pin });

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.status(200).json({
        success: true,
        reference: result.reference,
        balanceNaira: result.balanceNaira,
        message: result.message,
      });
    } catch (err: any) {
      logger.error({ error: err.message }, "Error executing transfer");
      res.status(500).json({ error: "Internal server error executing transfer." });
    }
  }

  /**
   * Zero-SMS Emergency Account Freeze Kill-Switch (POST /webhook/freeze)
   */
  static async emergencyFreeze(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, secretType, secretValue } = req.body;

      if (!phoneNumber || !secretType || !secretValue) {
        res.status(400).json({ error: "Phone number and verification secret are required." });
        return;
      }

      // Normalize Nigerian phone numbers (+234..., 234..., 080...)
      let digits = String(phoneNumber).replace(/\D/g, "");
      if (digits.startsWith("0") && digits.length === 11) {
        digits = `234${digits.slice(1)}`;
      }
      const normalizedPhone = `+${digits}`;

      const user = await prisma.user.findUnique({
        where: { phoneNumber: normalizedPhone },
        include: { wallet: true },
      });

      if (!user) {
        // Generic error to avoid phone number enumeration
        res.status(400).json({ error: "Verification failed. Please check your phone number and secret." });
        return;
      }

      const cleanSecret = String(secretValue).replace(/\D/g, "");
      let isAuthorized = false;

      if (secretType === "pin" && user.pinHash && /^\d{4}$/.test(cleanSecret)) {
        isAuthorized = await bcrypt.compare(cleanSecret, user.pinHash);
      } else if (secretType === "bvn" && user.bvnLast4 && /^\d{4}$/.test(cleanSecret)) {
        isAuthorized = user.bvnLast4 === cleanSecret;
      }

      if (!isAuthorized) {
        logger.warn({ phoneNumber: normalizedPhone, ip: req.ip }, "🚫 Failed emergency freeze verification attempt");
        res.status(400).json({ error: "Verification failed. Please check your phone number and secret." });
        return;
      }

      const freezeRef = `VODE-LCK-${Math.floor(100000 + Math.random() * 900000)}`;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { status: "FROZEN" },
        });

        if (user.wallet) {
          await tx.wallet.update({
            where: { id: user.wallet.id },
            data: { isLocked: true },
          });
        }

        await tx.ephemeralToken.updateMany({
          where: { userId: user.id, isUsed: false },
          data: { isUsed: true },
        });

        await tx.emergencyFreezeLog.create({
          data: {
            userId: user.id,
            reference: freezeRef,
            channel: "WEB_KILL_SWITCH",
            ipAddress: req.ip || null,
            userAgent: req.headers["user-agent"] || null,
          },
        });
      });

      logger.warn({ userId: user.id, freezeRef, ip: req.ip }, "🚨 Emergency account freeze executed");

      // Best-effort WhatsApp notification
      const cleanPhone = normalizedPhone.replace("+", "");
      await WhatsAppService.sendTextMessage(
        cleanPhone,
        `🚨 *EMERGENCY LOCK ACTIVATED*\n\n` +
        `Your Vode account has been frozen immediately via our web kill-switch.\n` +
        `• *Lock Ref:* \`${freezeRef}\`\n\n` +
        `All outward transfers and payments are blocked. Inbound deposits remain safe. Contact support@usevode.com to verify your identity and unlock.`
      ).catch(() => {});

      res.status(200).json({
        success: true,
        freezeRef,
        message: "Account frozen immediately.",
      });
    } catch (err: any) {
      logger.error({ error: err.message }, "Error during emergency freeze");
      res.status(500).json({ error: "Internal server error processing emergency freeze." });
    }
  }

  /**
   * Complete Secure Onboarding via In-App Webview Sheet (POST /webhook/complete-onboarding)
   */
  static async completeOnboarding(req: Request, res: Response): Promise<void> {
    try {
      const { token, fullName, bvn, pin } = req.body;

      if (!token || !fullName || !bvn || !pin) {
        res.status(400).json({ error: "Missing required onboarding fields" });
        return;
      }

      const cleanBvn = String(bvn).replace(/\D/g, "");
      if (!/^\d{11}$/.test(cleanBvn)) {
        res.status(400).json({ error: "BVN or NIN must be exactly 11 digits." });
        return;
      }

      if (!/^\d{4}$/.test(String(pin))) {
        res.status(400).json({ error: "Transaction PIN must be exactly 4 digits." });
        return;
      }

      // 1. Verify ephemeral token
      const tokenRecord = await prisma.ephemeralToken.findUnique({
        where: { token },
      });

      if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt < new Date()) {
        res.status(400).json({
          error: "Onboarding session expired or invalid. Please message Vode on WhatsApp to get a fresh link.",
        });
        return;
      }

      const phoneNumber = tokenRecord.phoneNumber;
      const pinHash = await bcrypt.hash(pin, 10);
      const bvnHash = await bcrypt.hash(cleanBvn, 10);
      const bvnLast4 = cleanBvn.slice(-4);
      const [firstName, ...rest] = fullName.trim().split(" ");
      const lastName = rest.join(" ") || firstName;
      const accountRef = `vode_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      logger.info({ phoneNumber, fullName }, "🔒 Processing secure in-app onboarding submission");

      // 2. Call Active Core Banking Provider (Nomba / Providus / Mock)
      const virtualAcct = await BankingService.createVirtualAccount({
        accountRef,
        phoneNumber,
        firstName,
        lastName,
        bvn: cleanBvn,
      });

      if (!virtualAcct) {
        res.status(500).json({
          error: "Failed to provision bank account with payment partner. Please verify your BVN/NIN and try again.",
        });
        return;
      }

      // 3. Upsert User in database
      const user = await prisma.user.upsert({
        where: { phoneNumber },
        update: {
          fullName: fullName.trim(),
          bvn: bvnHash,
          bvnLast4,
          pinHash,
          pinFailedAttempts: 0,
          pinLockedUntil: null,
          status: "ACTIVE",
          kycTier: "TIER_1",
        },
        create: {
          phoneNumber,
          whatsappId: phoneNumber.replace("+", ""),
          fullName: fullName.trim(),
          bvn: bvnHash,
          bvnLast4,
          pinHash,
          status: "ACTIVE",
          kycTier: "TIER_1",
        },
      });

      // 4. Ensure Wallet exists
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balanceInKobo: 0n,
          currency: "NGN",
        },
      });

      // 5. Create DedicatedNuban entry
      await prisma.dedicatedNuban.create({
        data: {
          userId: user.id,
          accountNumber: virtualAcct.accountNumber,
          accountName: virtualAcct.accountName,
          bankName: virtualAcct.bankName,
          bankCode: virtualAcct.bankCode,
          partnerReference: accountRef,
        },
      });

      // 6. Mark token as used
      await prisma.ephemeralToken.update({
        where: { token },
        data: { isUsed: true },
      });

      // 7. Dispatch instant celebration plaque on WhatsApp
      const cleanPhone = phoneNumber.replace("+", "");
      await WhatsAppService.sendTextMessage(
        cleanPhone,
        `🎉 *Welcome to Vode, ${firstName}!* \n\n` +
        `Your dedicated Nigerian bank account is active and ready to receive money:\n\n` +
        `🏛️ *Bank:* ${virtualAcct.bankName}\n` +
        `💳 *Account No:* \`${virtualAcct.accountNumber}\` *(tap to copy)*\n` +
        `👤 *Account Name:* ${virtualAcct.accountName}\n\n` +
        `_Transfer any amount to this account from any banking app to fund your Vode wallet._\n\n` +
        `Type *"Balance"* anytime to check your funds, send a voice note to *Speak to Pay*, or type *"Send 5000 to 0123456789 GTBank"*!`
      );

      res.status(200).json({
        success: true,
        account: {
          accountNumber: virtualAcct.accountNumber,
          bankName: virtualAcct.bankName,
          accountName: virtualAcct.accountName,
        },
      });
    } catch (err: any) {
      logger.error({ error: err.message }, "Error during secure completeOnboarding");
      res.status(500).json({ error: "Internal server error during account setup." });
    }
  }

  /**
   * Inbound Message Ingestion (POST /webhook)
   */
  static async handleIncomingMessage(req: Request, res: Response): Promise<void> {
    // 1. Immediately acknowledge Meta with HTTP 200 OK (< 200ms)
    res.status(200).send("EVENT_RECEIVED");

    try {
      const body = req.body;

      if (!body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        return;
      }

      const messageData = body.entry[0].changes[0].value.messages[0];
      const senderPhone = messageData.from; // e.g. "2348012345678"
      const messageType = messageData.type; // "text", "audio", "image", "interactive"

      logger.info({ senderPhone, messageType }, "📩 Inbound WhatsApp message received");

      const formattedPhone = senderPhone.startsWith("+") ? senderPhone : `+${senderPhone}`;
      let user = null;

      try {
        user = await prisma.user.findUnique({
          where: { phoneNumber: formattedPhone },
          include: { wallet: true, dedicatedNubans: true },
        });
      } catch (dbErr: any) {
        logger.error({ error: dbErr.message }, "Database query error");
      }

      // 2. EMERGENCY FROZEN USER
      if (user && user.status === "FROZEN") {
        await WhatsAppService.sendTextMessage(
          senderPhone,
          `🚨 *Your Vode account is currently locked.*\n\n` +
          `All payment activity is paused for your safety. To unlock your account, visit our emergency portal:\n` +
          `${env.FRONTEND_URL}/freeze?action=unblock`
        );
        return;
      }

      // 3. UNREGISTERED OR INCOMPLETE USERS -> Send Secure In-App Sheet Link
      if (!user || user.status !== "ACTIVE") {
        let token = "";
        const existingToken = await prisma.ephemeralToken.findFirst({
          where: {
            phoneNumber: formattedPhone,
            isUsed: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

        if (existingToken) {
          token = existingToken.token;
        } else {
          token = crypto.randomBytes(24).toString("hex");
          await prisma.ephemeralToken.create({
            data: {
              token,
              phoneNumber: formattedPhone,
              type: "ONBOARDING",
              expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
          });
        }

        const onboardUrl = `${env.FRONTEND_URL || "https://www.usevode.com"}/onboard?token=${token}`;

        await WhatsAppService.sendTextMessage(
          senderPhone,
          `👋 *Welcome to Vode!*\n` +
          `Everyday money, right inside your WhatsApp.\n\n` +
          `🔒 *Bank-Grade Secure Setup:*\n` +
          `To protect your privacy and comply with CBN banking regulations, your BVN and 4-digit PIN are encrypted inside our secure verification portal:\n\n` +
          `👉 *Tap here to set up your account:*\n` +
          `${onboardUrl}\n\n` +
          `⏱️ _Takes less than 60 seconds. Your credentials are never typed in chat._`
        );
        return;
      }

      // 4. ACTIVE USERS: Financial Commands & Multimodal
      const textBody = messageType === "text" ? messageData.text?.body?.trim() || "" : "";

      if (messageType === "text") {
        const lowerText = textBody.toLowerCase();

        // A. Balance Inquiry
        if (lowerText === "balance" || lowerText === "bal") {
          const balanceNaira = Number(user.wallet?.balanceInKobo || 0n) / 100;
          await WhatsAppService.sendTextMessage(
            senderPhone,
            `💰 *Your Vode Balance:*\n` +
            `*₦${balanceNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}*\n\n` +
            `Type *"Send [amount] to [account] [bank]"* or *"Send 5k to [Name]"* to transfer funds.`
          );
          return;
        }

        // B. Dedicated NUBAN Inquiry
        if (lowerText === "account" || lowerText === "nuban") {
          const nuban = user.dedicatedNubans[0];
          if (nuban) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `🏦 *Your Permanent Vode Account:*\n\n` +
              `• *Bank:* ${nuban.bankName}\n` +
              `• *Account No:* \`${nuban.accountNumber}\` *(tap to copy)*\n` +
              `• *Account Name:* ${nuban.accountName}\n\n` +
              `_Transfer funds into this account from any banking app to top up your balance._`
            );
          } else {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `Your dedicated NUBAN account is being finalized. Please check back in a moment.`
            );
          }
          return;
        }

        // C. Customer Support / Help Query (e.g. "help", "support", "talk to human", "complaint")
        const isSupportQuery =
          lowerText.startsWith("help") ||
          lowerText.startsWith("support") ||
          lowerText.includes("complaint") ||
          lowerText.includes("scam") ||
          lowerText.includes("fraud") ||
          lowerText.includes("human") ||
          lowerText.includes("operator") ||
          lowerText.includes("issue") ||
          lowerText.includes("problem");

        if (isSupportQuery) {
          const category = lowerText.includes("scam") || lowerText.includes("fraud")
            ? "SECURITY_FRAUD"
            : lowerText.includes("transfer") || lowerText.includes("debit")
            ? "TRANSFER_ISSUE"
            : "GENERAL";

          const subject = textBody.length > 50 ? `${textBody.slice(0, 47)}...` : textBody;

          const { ticketNumber, isNew } = await SupportTicketService.handleInboundSupportMessage({
            phoneNumber: senderPhone,
            whatsappId: senderPhone,
            customerName: user?.fullName || undefined,
            subject,
            issueCategory: category,
            message: textBody,
          });

          if (isNew) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `🎫 *Support Ticket Created:* \`${ticketNumber}\`\n\n` +
              `We have received your message and logged an active case with our Operations Desk.\n\n` +
              `An operator will review and reply directly to you right here on WhatsApp shortly.\n\n` +
              `_You can send more details or screenshots anytime._`
            );
          } else {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `💬 Note added to your active ticket \`${ticketNumber}\`. Our team is reviewing this now.`
            );
          }
          return;
        }

        // D. Transaction History Command
        if (lowerText === "history" || lowerText === "transactions" || lowerText === "recent") {
          const historyText = await StatementService.getFormattedHistory(user.id);
          await WhatsAppService.sendTextMessage(senderPhone, historyText);
          return;
        }

        // D. Account Statement Summary
        if (lowerText === "statement" || lowerText === "summary" || lowerText === "mini statement") {
          const statementText = await StatementService.getMonthlyStatementSummary(user.id);
          await WhatsAppService.sendTextMessage(senderPhone, statementText);
          return;
        }

        // E. Saved Beneficiaries Directory Command
        if (lowerText === "beneficiaries" || lowerText === "saved" || lowerText === "contacts") {
          const beneficiaries = await BeneficiaryService.listTopBeneficiaries(user.id);
          if (beneficiaries.length === 0) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `👥 *Your Saved Beneficiaries*\n\n` +
              `You don't have any saved contacts yet.\n` +
              `When you send money to anyone, Vode automatically remembers them so you can say *"Send 5000 to [Name]"* next time!\n\n` +
              `_You can also type: "Save 0123456789 GTBank as Chioma"_`
            );
            return;
          }

          let bMsg = `👥 *Your Saved Beneficiaries (${beneficiaries.length})*\n\n`;
          for (const b of beneficiaries) {
            bMsg += `• *${b.nickname}* (${b.accountName.split(" ")[0]})\n`;
            bMsg += `  ${b.bankName} • \`${b.accountNumber}\`\n\n`;
          }
          bMsg += `_To send, just type: "Send 5000 to ${beneficiaries[0].nickname}"_`;
          await WhatsAppService.sendTextMessage(senderPhone, bMsg);
          return;
        }

        // F. Explicit Save Beneficiary Command (e.g. "Save 0123456789 GTBank as Chioma")
        const saveBeneficiaryMatch = textBody.match(
          /^save\s+(?:beneficiary\s+)?([0-9]{10})\s+(.+?)\s+as\s+([a-zA-Z0-9\s_-]+)$/i
        );

        if (saveBeneficiaryMatch) {
          const accNum = saveBeneficiaryMatch[1];
          const rawBank = saveBeneficiaryMatch[2].trim();
          const nickname = saveBeneficiaryMatch[3].trim();

          const bankMatch = await BankMatcher.resolveBank(rawBank);
          if (!bankMatch) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `🔍 Could not recognize bank "${rawBank}". Please use a known bank like GTBank, Access, Zenith, Kuda, OPay, etc.`
            );
            return;
          }

          const lookup = await BankingService.lookupAccount(accNum, bankMatch.code);
          if (!lookup || !lookup.accountName) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `❌ Could not verify account number ${accNum} at ${bankMatch.name}. Please check the details.`
            );
            return;
          }

          await BeneficiaryService.saveBeneficiary({
            userId: user.id,
            nickname,
            accountNumber: accNum,
            bankCode: bankMatch.code,
            bankName: bankMatch.name,
            accountName: lookup.accountName,
          });

          await WhatsAppService.sendTextMessage(
            senderPhone,
            `✅ *Beneficiary Saved!*\n\n` +
            `• *Nickname:* ${nickname}\n` +
            `• *Name:* ${lookup.accountName}\n` +
            `• *Bank:* ${bankMatch.name}\n` +
            `• *Account:* \`${accNum}\`\n\n` +
            `You can now send money quickly simply by typing:\n` +
            `👉 *"Send 5000 to ${nickname}"*`
          );
          return;
        }

        // G. Full Outward Transfer Intent with 10-Digit Account (e.g. "Send 5000 to 0123456789 GTBank")
        const transferMatch = textBody.match(
          /^(?:send|transfer|pay)\s+(?:(?:₦|ngn)\s*)?([0-9k,.]+)\s+(?:to\s+)?([0-9]{10})\s+(.+)$/i
        );

        if (transferMatch) {
          const rawAmount = transferMatch[1];
          const recipientAccountNumber = transferMatch[2];
          const rawBank = transferMatch[3].trim();

          const amountInNaira = parseAmount(rawAmount);
          if (amountInNaira <= 0) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `⚠️ Please provide a valid transfer amount (e.g. *Send 5000 to 0123456789 GTBank*).`
            );
            return;
          }

          const bankMatch = await BankMatcher.resolveBank(rawBank);
          if (!bankMatch) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `🔍 *Could not recognize bank "${rawBank}"*\n\n` +
              `Please provide a recognized Nigerian bank (e.g. *GTBank*, *Access*, *Zenith*, *Kuda*, *OPay*, *PalmPay*, *Moniepoint*, *First Bank*, *UBA*, *Wema*).\n\n` +
              `_Example: Send ${rawAmount} to ${recipientAccountNumber} GTBank_`
            );
            return;
          }

          // Prepare transfer, perform name enquiry & generate 90s authorization link
          const prep = await LedgerService.prepareOutwardTransfer({
            userId: user.id,
            amountInNaira,
            recipientAccountNumber,
            recipientBankCode: bankMatch.code,
            recipientBankName: bankMatch.name,
          });

          if (!prep.success || !prep.details) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `❌ *Transfer Request Failed*\n\n${prep.errorMessage || "Unable to prepare transfer."}`
            );
            return;
          }

          const details = prep.details;
          await WhatsAppService.sendTextMessage(
            senderPhone,
            `📋 *Confirm Transfer Details:*\n\n` +
            `👤 *Recipient:* ${details.recipientName}\n` +
            `💳 *Account:* \`${details.recipientAccountNumber}\`\n` +
            `🏛️ *Bank:* ${details.bankName}\n` +
            `💵 *Amount:* ₦${details.amountInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
            `🧾 *Fee:* ₦${details.feeInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
            `📊 *Total Debit:* ₦${details.totalDebitInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n\n` +
            `🔒 *Authorize with your PIN:*\n` +
            `${prep.authUrl}\n\n` +
            `⏱️ _This secure link expires in 90 seconds. Your 4-digit PIN is never typed in chat._`
          );
          return;
        }

        // H. Name-Based Transfer Command (e.g. "Send 5000 to Chioma" or "Transfer 2.5k to Mummy")
        const nameTransferMatch = textBody.match(
          /^(?:send|transfer|pay)\s+(?:(?:₦|ngn)\s*)?([0-9k,.]+)\s+(?:to\s+)?([a-zA-Z\s]{2,30})$/i
        );

        if (nameTransferMatch && !/^\d{10}$/.test(nameTransferMatch[2].trim())) {
          const rawAmount = nameTransferMatch[1];
          const targetName = nameTransferMatch[2].trim();

          const amountInNaira = parseAmount(rawAmount);
          if (amountInNaira <= 0) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `⚠️ Please provide a valid amount (e.g. *Send 5000 to ${targetName}*).`
            );
            return;
          }

          const beneficiary = await BeneficiaryService.findBeneficiary(user.id, targetName);
          if (!beneficiary) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `🔍 *Beneficiary Not Found: "${targetName}"*\n\n` +
              `You haven't saved a contact named "${targetName}" yet.\n\n` +
              `To send to them for the first time, please provide their 10-digit account number and bank, e.g.:\n` +
              `👉 *Send ${rawAmount} to [10-digit account] [bank]*\n\n` +
              `_Type *"Beneficiaries"* to see your saved contacts._`
            );
            return;
          }

          // Prepare transfer to saved beneficiary
          const prep = await LedgerService.prepareOutwardTransfer({
            userId: user.id,
            amountInNaira,
            recipientAccountNumber: beneficiary.accountNumber,
            recipientBankCode: beneficiary.bankCode,
            recipientBankName: beneficiary.bankName,
          });

          if (!prep.success || !prep.details) {
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `❌ *Transfer Request Failed*\n\n${prep.errorMessage || "Unable to prepare transfer."}`
            );
            return;
          }

          const details = prep.details;
          await WhatsAppService.sendTextMessage(
            senderPhone,
            `📋 *Confirm Transfer Details:*\n\n` +
            `👤 *Recipient:* ${details.recipientName} (${beneficiary.nickname})\n` +
            `💳 *Account:* \`${details.recipientAccountNumber}\`\n` +
            `🏛️ *Bank:* ${details.bankName}\n` +
            `💵 *Amount:* ₦${details.amountInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
            `🧾 *Fee:* ₦${details.feeInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
            `📊 *Total Debit:* ₦${details.totalDebitInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n\n` +
            `🔒 *Authorize with your PIN:*\n` +
            `${prep.authUrl}\n\n` +
            `⏱️ _This secure link expires in 90 seconds. Your 4-digit PIN is never typed in chat._`
          );
          return;
        }

        // I. Partial Transfer Command Missing Bank (e.g. "Send 5000 to 0123456789")
        const partialTransferMatch = textBody.match(
          /^(?:send|transfer|pay)\s+(?:(?:₦|ngn)\s*)?([0-9k,.]+)\s+(?:to\s+)?([0-9]{10})$/i
        );

        if (partialTransferMatch) {
          const rawAmount = partialTransferMatch[1];
          const recipientAccountNumber = partialTransferMatch[2];
          await WhatsAppService.sendTextMessage(
            senderPhone,
            `🏦 *Which bank is this account with?*\n\n` +
            `Please reply with the bank name included, for example:\n\n` +
            `• *Send ${rawAmount} to ${recipientAccountNumber} GTBank*\n` +
            `• *Send ${rawAmount} to ${recipientAccountNumber} Kuda*\n` +
            `• *Send ${rawAmount} to ${recipientAccountNumber} OPay*\n` +
            `• *Send ${rawAmount} to ${recipientAccountNumber} Access*`
          );
          return;
        }

        // Generic Menu / Fallback
        await WhatsAppService.sendTextMessage(
          senderPhone,
          `👋 *Hi ${user.fullName || "there"}!*\n\n` +
          `How can I help you today?\n` +
          `• Type *"Balance"* to check your funds\n` +
          `• Type *"History"* to see recent transactions\n` +
          `• Type *"Beneficiaries"* to see saved contacts\n` +
          `• Type *"Statement"* for a monthly summary\n` +
          `• Send *"Send 5000 to 0123456789 GTBank"*\n` +
          `• Send a voice note to *Speak to Pay*\n` +
          `• Forward a photo of an invoice to *Snap & Pay*`
        );
        return;
      }

      // ==========================================
      // MULTIMODAL VOICE NOTES (Speak to Pay)
      // ==========================================
      if (messageType === "audio") {
        const mediaId = messageData.audio?.id;
        if (!mediaId) {
          await WhatsAppService.sendTextMessage(senderPhone, "⚠️ Could not read audio note.");
          return;
        }

        const media = await WhatsAppService.downloadMedia(mediaId);
        if (!media) {
          await WhatsAppService.sendTextMessage(
            senderPhone,
            "⚠️ Unable to download your voice note right now. Please try typing your request."
          );
          return;
        }

        // Transcribe & Extract Intent with Plug-and-Play AI Engine
        const aiResult = await AIService.transcribeAndParseVoice(media.buffer, media.mimeType);
        logger.info({ transcription: aiResult.text, intent: aiResult.intent }, "Processed voice note");

        const intent = aiResult.intent;

        // A. Voice Balance
        if (intent.action === "BALANCE") {
          const balanceNaira = Number(user.wallet?.balanceInKobo || 0n) / 100;
          await WhatsAppService.sendTextMessage(
            senderPhone,
            `🎙️ _" ${aiResult.text} "_\n\n` +
            `💰 *Your Vode Balance:*\n` +
            `*₦${balanceNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}*`
          );
          return;
        }

        // B. Voice History
        if (intent.action === "HISTORY") {
          const historyMsg = await StatementService.getFormattedHistory(user.id);
          await WhatsAppService.sendTextMessage(
            senderPhone,
            `🎙️ _" ${aiResult.text} "_\n\n${historyMsg}`
          );
          return;
        }

        // C. Voice Transfer
        if (intent.action === "TRANSFER" && intent.amountInNaira && intent.amountInNaira > 0) {
          let targetAccount = intent.recipientAccountNumber;
          let targetBankCode = "";
          let targetBankName = intent.bankName || "";

          // Check if nickname spoken matches saved beneficiary
          if (intent.recipientNameOrNickname && !targetAccount) {
            const beneficiary = await BeneficiaryService.findBeneficiary(
              user.id,
              intent.recipientNameOrNickname
            );
            if (beneficiary) {
              targetAccount = beneficiary.accountNumber;
              targetBankCode = beneficiary.bankCode;
              targetBankName = beneficiary.bankName;
            } else {
              await WhatsAppService.sendTextMessage(
                senderPhone,
                `🎙️ _" ${aiResult.text} "_\n\n` +
                `🔍 I heard you want to send *₦${intent.amountInNaira.toLocaleString("en-NG")}* to *"${intent.recipientNameOrNickname}"*, but I couldn't find them in your saved beneficiaries.\n\n` +
                `Please provide their 10-digit account number and bank, e.g.:\n` +
                `👉 *Send ${intent.amountInNaira} to 0123456789 GTBank*`
              );
              return;
            }
          } else if (targetAccount && intent.bankName) {
            const matched = await BankMatcher.resolveBank(intent.bankName);
            if (matched) {
              targetBankCode = matched.code;
              targetBankName = matched.name;
            }
          }

          if (targetAccount && targetBankCode) {
            const prep = await LedgerService.prepareOutwardTransfer({
              userId: user.id,
              amountInNaira: intent.amountInNaira,
              recipientAccountNumber: targetAccount,
              recipientBankCode: targetBankCode,
              recipientBankName: targetBankName,
            });

            if (!prep.success || !prep.details) {
              await WhatsAppService.sendTextMessage(
                senderPhone,
                `❌ *Transfer Request Failed:*\n\n${prep.errorMessage || "Unable to prepare transfer."}`
              );
              return;
            }

            const details = prep.details;
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `🎙️ *Voice Note Recognized (Speak to Pay)*\n` +
              `_" ${aiResult.text} "_\n\n` +
              `📋 *Confirm Transfer Details:*\n` +
              `👤 *Recipient:* ${details.recipientName}\n` +
              `💳 *Account:* \`${details.recipientAccountNumber}\`\n` +
              `🏛️ *Bank:* ${details.bankName}\n` +
              `💵 *Amount:* ₦${details.amountInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
              `🧾 *Fee:* ₦${details.feeInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
              `📊 *Total Debit:* ₦${details.totalDebitInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n\n` +
              `🔒 *Authorize with your PIN:*\n` +
              `${prep.authUrl}\n\n` +
              `⏱️ _This secure link expires in 90 seconds. Your PIN is never typed in chat._`
            );
            return;
          }
        }

        // Voice Note ambiguous fallback
        await WhatsAppService.sendTextMessage(
          senderPhone,
          `🎙️ *Voice Note Transcribed:*\n` +
          `_" ${aiResult.text} "_\n\n` +
          `I couldn't detect a complete transfer command. You can speak naturally, like:\n` +
          `• *"Send 5,000 to Chioma"*\n` +
          `• *"Transfer 10k to 0123456789 GTBank"*\n` +
          `• *"Check my balance"*`
        );
        return;
      }

      // ==========================================
      // MULTIMODAL IMAGES (Snap & Pay)
      // ==========================================
      if (messageType === "image") {
        const mediaId = messageData.image?.id;
        if (!mediaId) {
          await WhatsAppService.sendTextMessage(senderPhone, "⚠️ Could not read image.");
          return;
        }

        const media = await WhatsAppService.downloadMedia(mediaId);
        if (!media) {
          await WhatsAppService.sendTextMessage(
            senderPhone,
            "⚠️ Unable to download your image right now. Please try typing the account details."
          );
          return;
        }

        // Parse Receipt OCR with Plug-and-Play AI Engine
        const ocr = await AIService.parseReceiptImage(media.buffer, media.mimeType);
        logger.info({ ocr }, "Processed receipt OCR");

        if (!ocr.success || (!ocr.recipientAccountNumber && !ocr.amountInNaira)) {
          await WhatsAppService.sendTextMessage(
            senderPhone,
            `📸 *Receipt Scan (Snap & Pay)*\n\n` +
            `We scanned your image but could not find clear bank account or invoice details.\n` +
            `Please ensure the 10-digit account number, bank, and amount are visible, or simply type:\n` +
            `👉 *Send [amount] to [account] [bank]*`
          );
          return;
        }

        let resolvedBank = null;
        if (ocr.bankName) {
          resolvedBank = await BankMatcher.resolveBank(ocr.bankName);
        }

        // If we found both an account number and a recognized bank
        if (ocr.recipientAccountNumber && resolvedBank) {
          const amountToTransfer = ocr.amountInNaira || 1000;
          const prep = await LedgerService.prepareOutwardTransfer({
            userId: user.id,
            amountInNaira: amountToTransfer,
            recipientAccountNumber: ocr.recipientAccountNumber,
            recipientBankCode: resolvedBank.code,
            recipientBankName: resolvedBank.name,
            narration: ocr.narration,
          });

          if (prep.success && prep.details) {
            const details = prep.details;
            await WhatsAppService.sendTextMessage(
              senderPhone,
              `📸 *Receipt Detected (Snap & Pay)*\n\n` +
              `👤 *Recipient:* ${details.recipientName}\n` +
              `💳 *Account:* \`${details.recipientAccountNumber}\`\n` +
              `🏛️ *Bank:* ${details.bankName}\n` +
              `💵 *Invoice Amount:* ₦${details.amountInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
              `🧾 *Fee:* ₦${details.feeInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n` +
              `📊 *Total Debit:* ₦${details.totalDebitInNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}\n\n` +
              `🔒 *Authorize Payment with your PIN:*\n` +
              `${prep.authUrl}\n\n` +
              `⏱️ _This secure link expires in 90 seconds. Your PIN is never typed in chat._`
            );
            return;
          }
        }

        // Partial OCR detection summary
        await WhatsAppService.sendTextMessage(
          senderPhone,
          `📸 *Receipt Details Detected:*\n\n` +
          (ocr.amountInNaira ? `• *Amount:* ₦${ocr.amountInNaira.toLocaleString("en-NG")}\n` : "") +
          (ocr.recipientAccountNumber ? `• *Account:* \`${ocr.recipientAccountNumber}\`\n` : "") +
          (ocr.bankName ? `• *Bank:* ${ocr.bankName}\n` : "") +
          (ocr.recipientName ? `• *Name:* ${ocr.recipientName}\n` : "") +
          `\nTo complete this transfer, please reply with:\n` +
          `👉 *Send ${ocr.amountInNaira || 5000} to ${ocr.recipientAccountNumber || "0123456789"} ${ocr.bankName || "GTBank"}*`
        );
        return;
      }
    } catch (err: any) {
      logger.error({ error: err.message }, "Error processing inbound WhatsApp message");
    }
  }
}
