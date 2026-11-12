import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AdminRole } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  totpEnabled: boolean;
}

export interface AdminRequest extends Request {
  admin?: AuthenticatedAdmin;
}

export const ADMIN_COOKIE_NAME = "vode_admin_session";

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      result[key] = val;
    }
  }
  return result;
}

/**
 * Middleware: Require valid authenticated Admin JWT (from httpOnly cookie or Bearer header)
 */
export async function requireAdminAuth(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7).trim()
      : undefined;

    const token = cookies[ADMIN_COOKIE_NAME] || bearer;
    if (!token) {
      res.status(401).json({ error: "Admin authentication required." });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      adminId: string;
      stage?: string;
    };

    if (!decoded?.adminId || decoded.stage !== "AUTHENTICATED") {
      res.status(401).json({ error: "Invalid or incomplete admin session." });
      return;
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        totpEnabled: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      res.status(403).json({ error: "Admin account is disabled or not found." });
      return;
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      totpEnabled: admin.totpEnabled,
    };

    next();
  } catch (err: any) {
    logger.warn({ error: err.message }, "Admin JWT verification failed");
    res.status(401).json({ error: "Admin session expired or invalid." });
  }
}

/**
 * Middleware factory: Require one of the permitted AdminRoles
 */
export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
      });
      return;
    }

    next();
  };
}

/**
 * Append-only AuditLog writer
 */
export async function recordAuditLog(params: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  req?: Request;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        beforeState: params.beforeState ?? undefined,
        afterState: params.afterState ?? undefined,
        reason: params.reason || null,
        ipAddress: params.req?.ip || null,
        userAgent: params.req?.headers["user-agent"] || null,
      },
    });
  } catch (err: any) {
    logger.error({ error: err.message, params }, "Failed to write AuditLog");
  }
}

