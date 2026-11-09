import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import {
  ICoreBankingProvider,
  CreateVirtualAccountParams,
  VirtualAccountResult,
  AccountLookupResult,
  SendTransferParams,
  TransferResult,
  BankInfo,
  InboundCreditEvent,
} from "./banking.interface";
import { NombaBankingProvider } from "./nomba.provider";
import { MockBankingProvider } from "./mock.provider";
import { ProvidusBankingProvider } from "./providus.provider";

/**
 * Universal Banking Service Registry.
 * Decouples Vode from any single financial rail.
 */
export class BankingService {
  private static providerInstance: ICoreBankingProvider | null = null;

  static getProvider(): ICoreBankingProvider {
    if (this.providerInstance) {
      return this.providerInstance;
    }

    const providerType = (process.env.CORE_BANKING_PROVIDER || "nomba").toLowerCase();

    switch (providerType) {
      case "mock":
        logger.info("🧪 Active Core Banking Provider: MOCK_CORE");
        this.providerInstance = new MockBankingProvider();
        break;
      case "providus":
        logger.info("🏛️ Active Core Banking Provider: PROVIDUS");
        this.providerInstance = new ProvidusBankingProvider();
        break;
      case "nomba":
      default:
        logger.info("🏦 Active Core Banking Provider: NOMBA");
        this.providerInstance = new NombaBankingProvider();
        break;
    }

    return this.providerInstance;
  }

  /**
   * Set provider at runtime (useful for testing or hot failover)
   */
  static setProvider(provider: ICoreBankingProvider): void {
    logger.info({ providerName: provider.providerName }, "Switching active core banking provider");
    this.providerInstance = provider;
  }

  // Convenience proxy methods:
  static async createVirtualAccount(params: CreateVirtualAccountParams): Promise<VirtualAccountResult | null> {
    return this.getProvider().createVirtualAccount(params);
  }

  static async lookupAccount(accountNumber: string, bankCode: string): Promise<AccountLookupResult | null> {
    return this.getProvider().lookupAccount(accountNumber, bankCode);
  }

  static async sendTransfer(params: SendTransferParams): Promise<TransferResult> {
    return this.getProvider().sendTransfer(params);
  }

  static async getBanks(): Promise<BankInfo[]> {
    return this.getProvider().getBanks();
  }

  static parseInboundCredit(payload: any, headers?: any): InboundCreditEvent | null {
    return this.getProvider().parseInboundCredit(payload, headers);
  }
}

