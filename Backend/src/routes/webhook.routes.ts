import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";

export const webhookRouter = Router();

// Meta verification handshake
webhookRouter.get("/", WebhookController.verifyWebhook);

// Inbound WhatsApp messages from users
webhookRouter.post("/", WebhookController.handleIncomingMessage);

// Secure In-App Webview Sheet Onboarding Submission
webhookRouter.post("/complete-onboarding", WebhookController.completeOnboarding);
