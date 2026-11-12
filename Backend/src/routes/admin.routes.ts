import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { requireAdminAuth, requireRole } from "../middleware/admin-auth";
import { createRateLimiter } from "../middleware/rate-limit";

const router = Router();

const authRateLimiter = createRateLimiter({
  name: "admin-auth",
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
});

// Auth & 2FA
router.get("/auth/bootstrap-status", AdminController.bootstrapStatus);
router.post("/auth/bootstrap", authRateLimiter, AdminController.bootstrapFirstAdmin);
router.post("/auth/login", authRateLimiter, AdminController.login);
router.post("/auth/verify-2fa", authRateLimiter, AdminController.verify2fa);
router.post("/auth/logout", requireAdminAuth, AdminController.logout);
router.get("/auth/me", requireAdminAuth, AdminController.me);
router.post("/auth/setup-2fa", requireAdminAuth, AdminController.setup2fa);
router.post("/auth/confirm-2fa", requireAdminAuth, AdminController.confirm2fa);

// Command Center & Kill-Switches
router.get("/overview", requireAdminAuth, AdminController.getOverview);
router.get("/system-config", requireAdminAuth, AdminController.getSystemConfig);
router.post(
  "/system-config/kill-switch",
  requireAdminAuth,
  requireRole("SUPER_ADMIN", "OPERATIONS"),
  AdminController.toggleKillSwitch
);

// Customers
router.get("/customers", requireAdminAuth, AdminController.listCustomers);
router.get("/customers/:id", requireAdminAuth, AdminController.getCustomerDetail);
router.post(
  "/customers/:id/freeze",
  requireAdminAuth,
  requireRole("SUPER_ADMIN", "OPERATIONS"),
  AdminController.freezeCustomer
);
router.post(
  "/customers/:id/request-unfreeze",
  requireAdminAuth,
  requireRole("SUPER_ADMIN", "OPERATIONS", "SUPPORT"),
  AdminController.requestUnfreezeCustomer
);

// Transactions & Provider Re-query
router.get("/transactions", requireAdminAuth, AdminController.listTransactions);
router.get("/transactions/:id", requireAdminAuth, AdminController.getTransactionDetail);
router.post(
  "/transactions/:id/requery",
  requireAdminAuth,
  requireRole("SUPER_ADMIN", "OPERATIONS", "FINANCE", "SUPPORT"),
  AdminController.requeryTransaction
);

// Maker-Checker Review & Revert Queue
router.get("/approvals", requireAdminAuth, AdminController.listApprovals);
router.post(
  "/approvals",
  requireAdminAuth,
  requireRole("SUPER_ADMIN", "OPERATIONS", "FINANCE", "SUPPORT"),
  AdminController.createApprovalRequest
);
router.post(
  "/approvals/:id/approve",
  requireAdminAuth,
  requireRole("SUPER_ADMIN", "OPERATIONS", "FINANCE"),
  AdminController.approveRequest
);
router.post(
  "/approvals/:id/reject",
  requireAdminAuth,
  requireRole("SUPER_ADMIN", "OPERATIONS", "FINANCE"),
  AdminController.rejectRequest
);

// Double-Entry Ledger
router.get("/ledger", requireAdminAuth, AdminController.getLedger);

// Partner Reconciliation
router.get("/reconciliation", requireAdminAuth, AdminController.listReconciliations);
router.post(
  "/reconciliation/upload",
  requireAdminAuth,
  requireRole("SUPER_ADMIN", "OPERATIONS", "FINANCE"),
  AdminController.uploadReconciliationCsv
);
router.get("/reconciliation/:batchId", requireAdminAuth, AdminController.getReconciliationBatch);

// Audit Logs
router.get("/audit-logs", requireAdminAuth, AdminController.getAuditLogs);

// Admin Team
router.get(
  "/team",
  requireAdminAuth,
  requireRole("SUPER_ADMIN", "OPERATIONS"),
  AdminController.listTeam
);
router.post(
  "/team",
  requireAdminAuth,
  requireRole("SUPER_ADMIN"),
  AdminController.createAdminUser
);
router.patch(
  "/team/:id",
  requireAdminAuth,
  requireRole("SUPER_ADMIN"),
  AdminController.updateAdminUser
);

// Support Tickets & Customer Queries
router.get("/tickets", requireAdminAuth, AdminController.listTickets);
router.post("/tickets/:id/reply", requireAdminAuth, AdminController.replyToTicket);
router.patch("/tickets/:id/status", requireAdminAuth, AdminController.updateTicketStatus);

export { router as adminRouter };
