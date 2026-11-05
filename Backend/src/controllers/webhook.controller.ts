import { Request, Response } from "express";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { WhatsAppService } from "../services/whatsapp.service";
import { OnboardingService } from "../services/onboarding.service";
import { NombaService } from "../services/nomba.service";

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
   * Complete Secure Onboarding via In-App Webview Sheet (POST /webhook/complete-onboarding)
   */
  static async completeOnboarding(req: Request, res: Response): Promise<void> {
    try {
      const { token, fullName, bvn, pin } = req.body;

      if (!token || !fullName || !bvn || !pin) {
        res.status(400).json({ error: "Missing required onboarding fields" });
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
      const [firstName, ...rest] = fullName.trim().split(" ");
      const lastName = rest.join(" ") || firstName;
      const accountRef = `vode_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      logger.info({ phoneNumber, fullName }, "🔒 Processing secure in-app onboarding submission");

      // 2. Call Nomba to create permanent dedicated virtual account
      const virtualAcct = await NombaService.createVirtualAccount({
        accountRef,
        phoneNumber,
        firstName,
        lastName,
        bvn,
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
          pinHash,
          status: "ACTIVE",
          kycTier: "TIER_1",
        },
        create: {
          phoneNumber,
          whatsappId: phoneNumber.replace("+", ""),
          fullName: fullName.trim(),
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
        `Type *"Balance"* anytime to check your funds, or send a voice note to make a transfer!`
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

      const textBody =
        messageType === "text" ? messageData.text?.body?.trim() || "" : "";

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
        // Find existing valid token or generate a fresh one
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

        const onboardUrl = `https://www.usevode.com/onboard?token=${token}`;

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
      if (messageType === "text") {
        const lowerText = textBody.toLowerCase();

        // Balance Inquiry
        if (lowerText === "balance" || lowerText === "bal") {
          const balanceNaira = Number(user.wallet?.balanceInKobo || 0n) / 100;
          await WhatsAppService.sendTextMessage(
            senderPhone,
            `💰 *Your Vode Balance:*\n` +
            `*₦${balanceNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}*\n\n` +
            `Type *"Send [amount] to [account] [bank]"* to transfer funds.`
          );
          return;
        }

        // Dedicated NUBAN Inquiry
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

        // Generic Menu
        await WhatsAppService.sendTextMessage(
          senderPhone,
          `👋 *Hi ${user.fullName || "there"}!*\n\n` +
          `How can I help you today?\n` +
          `• Type *"Balance"* to check your funds\n` +
          `• Type *"Account"* to see your dedicated NUBAN\n` +
          `• Send a voice note to *Speak to Pay*\n` +
          `• Send a photo of any receipt to *Snap & Pay*`
        );
        return;
      }

      // Multimodal Voice Notes (Speak to Pay)
      if (messageType === "audio") {
        await WhatsAppService.sendTextMessage(
          senderPhone,
          `🎙️ *Voice Note Received (Speak to Pay)*\n\n` +
          `Processing your voice request... (e.g. "Send 5,000 to Chioma")`
        );
        return;
      }

      // Multimodal Images (Snap & Pay)
      if (messageType === "image") {
        await WhatsAppService.sendTextMessage(
          senderPhone,
          `📸 *Receipt / Bill Received (Snap & Pay)*\n\n` +
          `Scanning invoice details and recipient account...`
        );
        return;
      }
    } catch (err: any) {
      logger.error({ error: err.message }, "Error processing inbound WhatsApp message");
    }
  }
}
