import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Periodic cleanup of expired rate-limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const store of stores.values()) {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }
}, 5 * 60 * 1000).unref();

export interface RateLimitOptions {
  name: string;
  windowMs: number;
  maxRequests: number;
  message?: string;
}

/**
 * Lightweight sliding/fixed window rate limiter middleware for Express 5
 */
export function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();
  stores.set(options.name, store);

  return (req: Request, res: Response, next: NextFunction): void => {
    const forwarded = req.headers["x-forwarded-for"];
    const clientIp =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim()) ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const existing = store.get(clientIp);

    if (!existing || existing.resetAt <= now) {
      store.set(clientIp, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      next();
      return;
    }

    existing.count += 1;

    if (existing.count > options.maxRequests) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      logger.warn({ clientIp, limiter: options.name, count: existing.count }, "Rate limit exceeded");
      res.status(429).json({
        error: options.message || "Too many requests. Please wait a moment and try again.",
      });
      return;
    }

    next();
  };
}

