import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";
import { createRateLimiter } from "../middleware/rate-limit";
import {
  verifyMetaWebhookSignature,
  verifyBankingWebhookSignature,
} from "../middleware/webhook-signature";

export const webhookRouter = Router();

const authSheetLimiter = createRateLimiter({
  name: "auth-sheet",
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 15,
  message: "Too many authorization attempts. Please wait a minute.",
});

const freezeLimiter = createRateLimiter({
  name: "emergency-freeze",
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10,
  message: "Too many freeze requests. Please wait a few minutes or email support@usevode.com.",
});

// Meta verification handshake
webhookRouter.get("/", WebhookController.verifyWebhook);

// Inbound WhatsApp messages from users (protected with Meta HMAC signature when configured)
webhookRouter.post("/", verifyMetaWebhookSignature, WebhookController.handleIncomingMessage);

// Secure In-App Webview Sheet Onboarding Submission
webhookRouter.post("/complete-onboarding", authSheetLimiter, WebhookController.completeOnboarding);

// Zero-SMS Emergency Account Freeze Kill-Switch (/freeze)
webhookRouter.post("/freeze", freezeLimiter, WebhookController.emergencyFreeze);

// Universal Banking Provider Inbound Credit Webhook (protected with HMAC signature)
webhookRouter.post(
  "/banking/credit",
  verifyBankingWebhookSignature,
  WebhookController.handleInboundCredit
);

// Session metadata for Secure PIN Sheet (/pay?tx=...)
webhookRouter.get("/banking/token/:token", WebhookController.getPaymentSession);

// Execute Outward Bank Transfer after PIN entry
webhookRouter.post("/banking/execute-transfer", authSheetLimiter, WebhookController.executeTransfer);
