import { logger } from "../../lib/logger";
import {
  ICoreBankingProvider,
  CreateVirtualAccountParams,
  VirtualAccountResult,
  AccountLookupResult,
  SendTransferParams,
  TransferResult,
  TransferStatusResult,
  BankInfo,
  InboundCreditEvent,
} from "./banking.interface";

/**
 * Providus Bank Core Banking Adapter
 * Implements Providus Bank Corporate Settlement & Dynamic/Reserved Virtual NUBAN APIs
 */
export class ProvidusBankingProvider implements ICoreBankingProvider {
  readonly providerName = "PROVIDUS";

  async createVirtualAccount(params: CreateVirtualAccountParams): Promise<VirtualAccountResult | null> {
    logger.info({ params }, "ProvidusBankingProvider: createVirtualAccount placeholder");
    // Placeholder ready for Providus POST /api/PiPCreateReservedAccountNumber
    return null;
  }

  async lookupAccount(accountNumber: string, bankCode: string): Promise<AccountLookupResult | null> {
    logger.info({ accountNumber, bankCode }, "ProvidusBankingProvider: lookupAccount placeholder");
    // Placeholder ready for Providus POST /api/PiPGetNIPAccount
    return null;
  }

  async sendTransfer(params: SendTransferParams): Promise<TransferResult> {
    logger.info({ params }, "ProvidusBankingProvider: sendTransfer placeholder");
    // Placeholder ready for Providus POST /api/PiPNIPFundTransfer
    return { success: false, status: "FAILED", errorMessage: "Providus integration pending production credentials" };
  }

  async verifyTransfer(reference: string): Promise<TransferStatusResult> {
    return { status: "PENDING" };
  }

  async getBanks(): Promise<BankInfo[]> {
    return [];
  }

  parseInboundCredit(payload: any, headers?: any): InboundCreditEvent | null {
    // Providus settlement webhook (POST to settlement URL)
    if (!payload?.accountNumber || !payload?.transactionAmount) return null;
    return {
      accountNumber: payload.accountNumber,
      amountInNaira: Number(payload.transactionAmount),
      senderName: payload.sourceAccountName || "Providus depositor",
      senderBank: payload.sourceBankName || "Commercial Bank",
      partnerReference: payload.sessionId || `prov_${Date.now()}`,
      narration: payload.tranRemarks,
      timestamp: new Date(),
    };
  }
}

