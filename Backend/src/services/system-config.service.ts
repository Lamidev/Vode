import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

export interface SystemFlags {
  outwardTransfersEnabled: boolean;
  activeBankingProvider: string;
}

export class SystemConfigService {
  private static cache: { flags: SystemFlags; expiresAt: number } | null = null;
  private static CACHE_TTL_MS = 10_000;

  static invalidateCache(): void {
    this.cache = null;
  }

  static async getFlags(): Promise<SystemFlags> {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.flags;
    }

    try {
      const configs = await prisma.systemConfig.findMany({
        where: {
          key: { in: ["OUTWARD_TRANSFERS_ENABLED", "ACTIVE_BANKING_PROVIDER"] },
        },
      });

      const map = new Map(configs.map((c) => [c.key, c.value]));
      const outwardRaw = map.get("OUTWARD_TRANSFERS_ENABLED");
      const providerRaw = map.get("ACTIVE_BANKING_PROVIDER");

      const flags: SystemFlags = {
        outwardTransfersEnabled: outwardRaw === undefined ? true : Boolean(outwardRaw),
        activeBankingProvider:
          typeof providerRaw === "string"
            ? providerRaw
            : process.env.CORE_BANKING_PROVIDER || "nomba",
      };

      this.cache = { flags, expiresAt: Date.now() + this.CACHE_TTL_MS };
      return flags;
    } catch (err: any) {
      logger.warn({ error: err.message }, "Failed to read SystemConfig, using defaults");
      return {
        outwardTransfersEnabled: true,
        activeBankingProvider: process.env.CORE_BANKING_PROVIDER || "nomba",
      };
    }
  }

  static async setConfig(key: string, value: any, adminId: string): Promise<void> {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value, updatedBy: adminId },
      create: { key, value, updatedBy: adminId },
    });
    this.invalidateCache();
  }
}

