import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { webhookRouter } from "./routes/webhook.routes";
import { adminRouter } from "./routes/admin.routes";

const app = express();

// Trust Nginx reverse proxy for accurate client IP & rate limiting
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      env.FRONTEND_URL,
      "https://usevode.com",
      "https://www.usevode.com",
      "https://admin.usevode.com",
      "http://localhost:3050",
      "http://localhost:3060",
    ],
    credentials: true,
  })
);

// Body parser (preserve rawBody buffer for HMAC webhook signature verification)
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "vode-backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// WhatsApp Meta Webhook route
app.use("/webhook", webhookRouter);
app.use("/admin", adminRouter);

// Start server
const PORT = parseInt(env.PORT, 10) || 4000;
app.listen(PORT, () => {
  logger.info(`🚀 Vode backend running on http://localhost:${PORT}`);
  logger.info(`📡 WhatsApp Webhook URL: http://localhost:${PORT}/webhook`);
});

export default app;
