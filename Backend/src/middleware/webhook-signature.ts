import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

/**
 * Constant-time HMAC-SHA256 verification supporting hex (with/without sha256= prefix) and base64 digests
 */
export function verifyHmacSignature(
  rawBody: Buffer | string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const cleanSig = signatureHeader.trim().replace(/^sha256=/i, "");
  const hmacHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const hmacBase64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

  const sigBuf = Buffer.from(cleanSig, "utf8");
  const hexBuf = Buffer.from(hmacHex, "utf8");
  const b64Buf = Buffer.from(hmacBase64, "utf8");

  if (sigBuf.length === hexBuf.length && crypto.timingSafeEqual(sigBuf, hexBuf)) {
    return true;
  }
  if (sigBuf.length === b64Buf.length && crypto.timingSafeEqual(sigBuf, b64Buf)) {
    return true;
  }

  return false;
}

/**
 * Verifies Meta WhatsApp Cloud API webhook signatures when WHATSAPP_APP_SECRET is configured
 */
export function verifyMetaWebhookSignature(
  req: RawBodyRequest,
  res: Response,
  next: NextFunction
): void {
  if (!env.WHATSAPP_APP_SECRET) {
    next();
    return;
  }

  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const payload = req.rawBody || JSON.stringify(req.body);

  if (!signature || !verifyHmacSignature(payload, signature, env.WHATSAPP_APP_SECRET)) {
    logger.warn({ hasSignature: Boolean(signature) }, "🚫 Rejected Meta webhook: Invalid X-Hub-Signature-256");
    res.status(401).json({ error: "Invalid Meta webhook signature" });
    return;
  }

  next();
}

/**
 * Verifies inbound banking partner deposit webhook signatures
 */
export function verifyBankingWebhookSignature(
  req: RawBodyRequest,
  res: Response,
  next: NextFunction
): void {
  if (env.CORE_BANKING_PROVIDER.toLowerCase() === "mock" && env.NODE_ENV !== "production") {
    next();
    return;
  }

  const secret = env.BANKING_WEBHOOK_SECRET || env.NOMBA_WEBHOOK_SECRET;
  const signature =
    (req.headers["x-nomba-signature"] as string | undefined) ||
    (req.headers["x-rubies-signature"] as string | undefined) ||
    (req.headers["x-webhook-signature"] as string | undefined);

  const payload = req.rawBody || JSON.stringify(req.body);

  if (!signature || !verifyHmacSignature(payload, signature, secret)) {
    logger.warn(
      { hasSignature: Boolean(signature), ip: req.ip },
      "🚫 Rejected banking credit webhook: Invalid or missing HMAC signature"
    );
    res.status(401).json({ status: "error", message: "Unauthorized webhook signature" });
    return;
  }

  next();
}

