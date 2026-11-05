import { Request, Response } from "express";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import { WhatsAppService } from "../services/whatsapp.service";
import { OnboardingService } from "../services/onboarding.service";

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
   * Inbound Message Ingestion (POST /webhook)
   */
  static async handleIncomingMessage(req: Request, res: Response): Promise<void> {
    // 1. Immediately acknowledge Meta with HTTP 200 OK (< 200ms)
    res.status(200).send("EVENT_RECEIVED");

    try {
      const body = req.body;

      if (!body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        // Status update (sent, delivered, read) or ping
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

      // 2. NEW USER: Initialize In-Chat Onboarding Flow
      if (!user) {
        try {
          user = await prisma.user.create({
            data: {
              phoneNumber: formattedPhone,
              whatsappId: senderPhone,
              status: "ONBOARDING_NAME",
            },
            include: { wallet: true, dedicatedNubans: true },
          });
        } catch {
          // Dev fallback if DB is offline
          user = {
            id: `temp_${Date.now()}`,
            phoneNumber: formattedPhone,
            status: "ONBOARDING_NAME",
          };
        }

        await WhatsAppService.sendTextMessage(
          senderPhone,
          `👋 *Welcome to Vode!*\n` +
          `Everyday money, right inside your WhatsApp.\n\n` +
          `To create your dedicated 10-digit bank account in under 60 seconds, what is your *Full Legal Name* (First and Last name as on your bank account)?`
        );
        return;
      }

      // 3. IN-CHAT ONBOARDING PROGRESSION (100% inside WhatsApp)
      if (
        user.status === "ONBOARDING_NAME" ||
        user.status === "ONBOARDING_BVN" ||
        user.status === "ONBOARDING_PIN"
      ) {
        if (!textBody) {
          await WhatsAppService.sendTextMessage(
            senderPhone,
            `Please reply with text to continue setting up your account.`
          );
          return;
        }

        await OnboardingService.handleOnboardingStep(user, textBody, senderPhone);
        return;
      }

      // 4. EMERGENCY FROZEN USER
      if (user.status === "FROZEN") {
        await WhatsAppService.sendTextMessage(
          senderPhone,
          `🚨 *Your Vode account is currently locked.*\n\n` +
          `All payment activity is paused for your safety. To unlock your account, visit our emergency portal:\n` +
          `${env.FRONTEND_URL}/freeze?action=unblock`
        );
        return;
      }

      // 5. ACTIVE USERS: Financial Commands & Multimodal
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
