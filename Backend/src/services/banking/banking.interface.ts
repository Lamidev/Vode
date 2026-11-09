export interface CreateVirtualAccountParams {
  accountRef: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  bvn?: string;
  nin?: string;
}

export interface VirtualAccountResult {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  accountRef: string;
}

export interface AccountLookupResult {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName?: string;
}

export interface SendTransferParams {
  transactionReference: string;
  amountInNaira: number;
  recipientAccountNumber: string;
  recipientBankCode: string;
  recipientName: string;
  senderName?: string;
  narration: string;
}

export interface TransferResult {
  success: boolean;
  status: "SUCCESS" | "PENDING" | "FAILED";
  partnerReference?: string;
  errorMessage?: string;
}

export interface TransferStatusResult {
  status: "SUCCESS" | "PENDING" | "FAILED";
  partnerReference?: string;
  amountInNaira?: number;
  sessionReference?: string;
}

export interface BankInfo {
  name: string;
  code: string;
  nipCode?: string | null;
}

export interface InboundCreditEvent {
  accountNumber: string;
  amountInNaira: number;
  senderName: string;
  senderBank: string;
  senderAccountNumber?: string;
  partnerReference: string;
  narration?: string;
  timestamp?: Date;
}

export interface OutboundTransferUpdateEvent {
  transactionReference: string;
  partnerReference?: string;
  status: "SUCCESS" | "FAILED" | "REVERSED";
  reason?: string;
}

/**
 * Universal Core Banking Provider Interface.
 * Any banking partner (Nomba, Providus, Wema, Paystack, Flutterwave, SafeHaven)
 * implements this interface so Vode's ledger and WhatsApp engine remain 100% provider-agnostic.
 */
export interface ICoreBankingProvider {
  readonly providerName: string;

  /** Create a dedicated, permanent 10-digit virtual NUBAN account */
  createVirtualAccount(params: CreateVirtualAccountParams): Promise<VirtualAccountResult | null>;

  /** Name Enquiry: Resolve legal name for account number + bank code */
  lookupAccount(accountNumber: string, bankCode: string): Promise<AccountLookupResult | null>;

  /** Execute outward interbank transfer over NIP rails */
  sendTransfer(params: SendTransferParams): Promise<TransferResult>;

  /** Query transfer status from partner */
  verifyTransfer(reference: string): Promise<TransferStatusResult>;

  /** Fetch directory of supported commercial banks & MFBs */
  getBanks(): Promise<BankInfo[]>;

  /** Parse partner webhook payload into a normalized Vode credit event */
  parseInboundCredit(payload: any, headers?: any): InboundCreditEvent | null;
}

