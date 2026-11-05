import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { webhookRouter } from "./routes/webhook.routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, "https://usevode.com", "http://localhost:3050"],
    credentials: true,
  })
);

// Body parser
app.use(express.json());
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

// Start server
const PORT = parseInt(env.PORT, 10) || 4000;
app.listen(PORT, () => {
  logger.info(`🚀 Vode backend running on http://localhost:${PORT}`);
  logger.info(`📡 WhatsApp Webhook URL: http://localhost:${PORT}/webhook`);
});

export default app;
