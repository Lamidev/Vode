import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

export class StatementService {
  /**
   * Format the last N transactions for WhatsApp chat delivery
   */
  static async getFormattedHistory(userId: string, limit = 5): Promise<string> {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      if (!transactions || transactions.length === 0) {
        return (
          `📜 *Your Transaction History*\n\n` +
          `No transactions recorded on your Vode account yet.\n` +
          `Transfer funds to your dedicated account or make a payment to see activity here!`
        );
      }

      let historyText = `📜 *Recent Activity (Last ${transactions.length})*\n\n`;

      for (const tx of transactions) {
        const isCredit = tx.type === "TRANSFER_IN" || tx.type === "ACCOUNT_FUNDING";
        const amountNaira = (Number(tx.amountInKobo) / 100).toLocaleString("en-NG", {
          minimumFractionDigits: 2,
        });
        const dateStr = new Date(tx.createdAt).toLocaleDateString("en-NG", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const icon = isCredit ? "🟢" : "🔴";
        const direction = isCredit ? "IN" : "OUT";
        const counterparty = tx.recipientName || "Vode Transfer";
        const statusBadge = tx.status === "SUCCESS" ? "✅" : tx.status === "PENDING" ? "⏳" : "❌";

        historyText += `${icon} *₦${amountNaira}* (${direction}) ${statusBadge}\n`;
        historyText += `   👤 ${counterparty}\n`;
        historyText += `   🗓️ ${dateStr} • Ref: \`${tx.reference}\`\n\n`;
      }

      historyText += `_Type *"Statement"* for a monthly summary or *"Balance"* to check funds._`;
      return historyText;
    } catch (err: any) {
      logger.error({ error: err.message, userId }, "Failed to generate transaction history");
      return "⚠️ Unable to load your transaction history right now. Please try again shortly.";
    }
  }

  /**
   * Generate an official 30-day Account Statement Summary
   */
  static async getMonthlyStatementSummary(userId: string, days = 30): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true, dedicatedNubans: true },
      });

      if (!user) return "User account not found.";

      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          createdAt: { gte: sinceDate },
          status: "SUCCESS",
        },
      });

      let totalInflowKobo = 0n;
      let totalOutflowKobo = 0n;
      let totalFeesKobo = 0n;

      for (const tx of transactions) {
        if (tx.type === "TRANSFER_IN" || tx.type === "ACCOUNT_FUNDING") {
          totalInflowKobo += tx.amountInKobo;
        } else if (tx.type === "TRANSFER_OUT" || tx.type === "BILL_PAYMENT" || tx.type === "AIRTIME") {
          totalOutflowKobo += tx.amountInKobo;
          totalFeesKobo += tx.feeInKobo;
        }
      }

      const balanceNaira = (Number(user.wallet?.balanceInKobo || 0n) / 100).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      });
      const inflowNaira = (Number(totalInflowKobo) / 100).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      });
      const outflowNaira = (Number(totalOutflowKobo + totalFeesKobo) / 100).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      });

      const nuban = user.dedicatedNubans[0];
      const nubanText = nuban
        ? `${nuban.bankName} • \`${nuban.accountNumber}\``
        : "Standard Vode Wallet";

      return (
        `📑 *Vode Account Statement Summary*\n` +
        `_Period: Last ${days} Days_\n\n` +
        `👤 *Account Holder:* ${user.fullName || "Valued Customer"}\n` +
        `🏛️ *Account:* ${nubanText}\n\n` +
        `📊 *Financial Summary:*\n` +
        `• 🟢 *Total Inflow:* ₦${inflowNaira}\n` +
        `• 🔴 *Total Outflow:* ₦${outflowNaira}\n` +
        `• 📝 *Transactions Settled:* ${transactions.length}\n\n` +
        `💰 *Current Available Balance:* *₦${balanceNaira}*\n\n` +
        `_Vode Technologies Limited • Regulated by CBN Partners & NDIC Insured_`
      );
    } catch (err: any) {
      logger.error({ error: err.message, userId }, "Failed to generate monthly statement");
      return "⚠️ Unable to generate your statement summary right now. Please try again shortly.";
    }
  }
}

