import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

export interface SaveBeneficiaryParams {
  userId: string;
  nickname: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountName: string;
}

export class BeneficiaryService {
  /**
   * Save or update a recipient beneficiary for a user
   */
  static async saveBeneficiary(params: SaveBeneficiaryParams) {
    const { userId, nickname, accountNumber, bankCode, bankName, accountName } = params;
    const cleanNickname = nickname.trim();

    try {
      const beneficiary = await prisma.beneficiary.upsert({
        where: {
          userId_accountNumber_bankCode: {
            userId,
            accountNumber,
            bankCode,
          },
        },
        update: {
          nickname: cleanNickname,
          accountName,
          bankName,
          transferCount: { increment: 1 },
          lastTransferredAt: new Date(),
        },
        create: {
          userId,
          nickname: cleanNickname,
          accountNumber,
          bankCode,
          bankName,
          accountName,
          transferCount: 1,
        },
      });

      logger.info(
        { userId, nickname: cleanNickname, accountNumber },
        "👤 Beneficiary saved/updated successfully"
      );
      return beneficiary;
    } catch (err: any) {
      logger.error({ error: err.message, params }, "Failed to save beneficiary");
      return null;
    }
  }

  /**
   * Search for a beneficiary by nickname (e.g. "Chioma", "Mummy", "Alhaji Musa")
   */
  static async findBeneficiary(userId: string, query: string) {
    const cleanQuery = query.trim().toLowerCase();

    try {
      // 1. Direct nickname exact or case-insensitive match
      const allUserBeneficiaries = await prisma.beneficiary.findMany({
        where: { userId },
        orderBy: { transferCount: "desc" },
      });

      // Exact match
      const exact = allUserBeneficiaries.find(
        (b) => b.nickname.toLowerCase() === cleanQuery
      );
      if (exact) return exact;

      // Partial/fuzzy contains match
      const partial = allUserBeneficiaries.find(
        (b) =>
          b.nickname.toLowerCase().includes(cleanQuery) ||
          cleanQuery.includes(b.nickname.toLowerCase())
      );
      if (partial) return partial;

      return null;
    } catch (err: any) {
      logger.error({ error: err.message, userId, query }, "Error finding beneficiary");
      return null;
    }
  }

  /**
   * Retrieve top saved beneficiaries for a user
   */
  static async listTopBeneficiaries(userId: string, limit = 5) {
    try {
      return await prisma.beneficiary.findMany({
        where: { userId },
        orderBy: [{ transferCount: "desc" }, { lastTransferredAt: "desc" }],
        take: limit,
      });
    } catch (err: any) {
      logger.error({ error: err.message, userId }, "Failed to list beneficiaries");
      return [];
    }
  }
}

