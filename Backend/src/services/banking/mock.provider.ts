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

export class MockBankingProvider implements ICoreBankingProvider {
  readonly providerName = "MOCK_CORE";

  private static MOCK_BANKS: BankInfo[] = [
    { name: "Guaranty Trust Bank", code: "058", nipCode: "000013" },
    { name: "Access Bank", code: "044", nipCode: "000014" },
    { name: "Zenith Bank", code: "057", nipCode: "000015" },
    { name: "First Bank of Nigeria", code: "011", nipCode: "000016" },
    { name: "United Bank for Africa", code: "033", nipCode: "000004" },
    { name: "Moniepoint MFB", code: "50515", nipCode: "090405" },
    { name: "OPay", code: "999992", nipCode: "090267" },
    { name: "Kuda Microfinance Bank", code: "50211", nipCode: "090267" },
    { name: "PalmPay", code: "999991", nipCode: "090336" },
    { name: "Wema Bank", code: "035", nipCode: "000017" },
    { name: "Stanbic IBTC Bank", code: "221", nipCode: "000012" },
    { name: "FCMB", code: "214", nipCode: "000003" },
    { name: "Fidelity Bank", code: "070", nipCode: "000007" },
    { name: "Providus Bank", code: "101", nipCode: "000023" },
  ];

  async createVirtualAccount(params: CreateVirtualAccountParams): Promise<VirtualAccountResult | null> {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
    const accountNumber = `90${randomSuffix.slice(0, 8)}`;
    const fullName = `${params.firstName} ${params.lastName}`.trim().toUpperCase();

    logger.info({ accountNumber, fullName }, "🧪 MockBankingProvider: Provisioned mock dedicated account");

    return {
      accountNumber,
      accountName: fullName,
      bankName: "Vode Partner MFB",
      bankCode: "090645",
      accountRef: params.accountRef,
    };
  }

  async lookupAccount(accountNumber: string, bankCode: string): Promise<AccountLookupResult | null> {
    const bank = MockBankingProvider.MOCK_BANKS.find((b) => b.code === bankCode);
    logger.info({ accountNumber, bankCode }, "🧪 MockBankingProvider: Simulating account lookup");

    return {
      accountName: "BABATUNDE OLATUNJI",
      accountNumber,
      bankCode,
      bankName: bank?.name || "Nigerian Commercial Bank",
    };
  }

  async sendTransfer(params: SendTransferParams): Promise<TransferResult> {
    logger.info(
      { params },
      "🧪 MockBankingProvider: Simulating outward NIP transfer settlement"
    );

    return {
      success: true,
      status: "SUCCESS",
      partnerReference: `mock_nip_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    };
  }

  async verifyTransfer(reference: string): Promise<TransferStatusResult> {
    return {
      status: "SUCCESS",
      partnerReference: reference,
      sessionReference: `mock_sess_${Date.now()}`,
    };
  }

  async getBanks(): Promise<BankInfo[]> {
    return MockBankingProvider.MOCK_BANKS;
  }

  parseInboundCredit(payload: any): InboundCreditEvent | null {
    if (!payload?.accountNumber || !payload?.amountInNaira) return null;
    return {
      accountNumber: payload.accountNumber,
      amountInNaira: Number(payload.amountInNaira),
      senderName: payload.senderName || "TEST SENDER",
      senderBank: payload.senderBank || "GTBank",
      partnerReference: payload.partnerReference || `mock_credit_${Date.now()}`,
      narration: payload.narration || "Mock funding",
      timestamp: new Date(),
    };
  }
}

