import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";

export const webhookRouter = Router();

// Meta verification handshake
webhookRouter.get("/", WebhookController.verifyWebhook);

// Inbound WhatsApp messages from users
webhookRouter.post("/", WebhookController.handleIncomingMessage);

// Secure In-App Webview Sheet Onboarding Submission
webhookRouter.post("/complete-onboarding", WebhookController.completeOnboarding);

// Universal Banking Provider Inbound Credit Webhook (Nomba / Providus / Mock / Any Partner)
webhookRouter.post("/banking/credit", WebhookController.handleInboundCredit);

// Session metadata for Secure PIN Sheet (/pay?tx=...)
webhookRouter.get("/banking/token/:token", WebhookController.getPaymentSession);

// Execute Outward Bank Transfer after PIN entry
webhookRouter.post("/banking/execute-transfer", WebhookController.executeTransfer);
