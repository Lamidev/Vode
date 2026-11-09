import axios from "axios";
import { env } from "../../config/env";
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

export class NombaBankingProvider implements ICoreBankingProvider {
  readonly providerName = "NOMBA";

  private static cachedToken: string | null = null;
  private static tokenExpiresAt: number = 0;
  private static cachedBanks: BankInfo[] = [];
  private static banksExpiresAt: number = 0;

  /**
   * Acquire a valid Nomba bearer token (cached until expiration)
   */
  private async getAuthToken(): Promise<string> {
    const now = Date.now();
    if (NombaBankingProvider.cachedToken && NombaBankingProvider.tokenExpiresAt > now + 60000) {
      return NombaBankingProvider.cachedToken;
    }

    try {
      const response = await axios.post(
        `${env.NOMBA_BASE_URL}/auth/token/issue`,
        {
          grant_type: "client_credentials",
          client_id: env.NOMBA_CLIENT_ID,
          client_secret: env.NOMBA_PRIVATE_KEY,
        },
        {
          headers: {
            accountId: env.NOMBA_ACCOUNT_ID,
            "Content-Type": "application/json",
          },
        }
      );

      const tokenData = response.data?.data || response.data;
      if (!tokenData?.access_token) {
        throw new Error("Nomba auth response missing access_token");
      }
      NombaBankingProvider.cachedToken = tokenData.access_token;
      NombaBankingProvider.tokenExpiresAt = now + (tokenData.expires_in || 3600) * 1000;
      logger.info("🔑 Fresh Nomba auth token acquired successfully");
      return tokenData.access_token as string;
    } catch (error: any) {
      logger.error(
        { error: error.response?.data || error.message },
        "Failed to authenticate with Nomba API"
      );
      throw new Error(`Nomba Auth Error: ${error.message}`);
    }
  }

  /**
   * Create a dedicated virtual NUBAN account on Nomba
   */
  async createVirtualAccount(params: CreateVirtualAccountParams): Promise<VirtualAccountResult | null> {
    try {
      const token = await this.getAuthToken();
      const fullName = `${params.firstName} ${params.lastName}`.trim();

      const payload: any = {
        accountRef: params.accountRef,
        accountName: fullName,
        currency: "NGN",
      };

      if (params.bvn && params.bvn.length === 11) {
        payload.bvn = params.bvn;
      }

      const response = await axios.post(
        `${env.NOMBA_BASE_URL}/accounts/virtual`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: env.NOMBA_ACCOUNT_ID,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data?.data || response.data;

      return {
        accountNumber: data.bankAccountNumber || data.accountNumber,
        accountName: data.bankAccountName || data.accountName || fullName,
        bankName: data.bankName || "Nombank MFB",
        bankCode: data.bankCode || "090645",
        accountRef: params.accountRef,
      };
    } catch (error: any) {
      logger.error(
        { error: error.response?.data || error.message, params },
        "Failed to generate Nomba virtual account"
      );
      return null;
    }
  }

  /**
   * Name Enquiry on Nomba
   */
  async lookupAccount(accountNumber: string, bankCode: string): Promise<AccountLookupResult | null> {
    try {
      const token = await this.getAuthToken();
      const response = await axios.post(
        `${env.NOMBA_BASE_URL}/transfers/bank/lookup`,
        { accountNumber, bankCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: env.NOMBA_ACCOUNT_ID,
          },
        }
      );

      const data = response.data?.data || response.data;
      if (!data?.accountName) return null;

      return {
        accountName: data.accountName,
        accountNumber,
        bankCode,
        bankName: data.bankName,
      };
    } catch (error: any) {
      logger.warn(
        { error: error.response?.data || error.message, accountNumber, bankCode },
        "Account lookup failed on Nomba"
      );
      return null;
    }
  }

  /**
   * Outward Bank Transfer on Nomba (v2 NIP transfer)
   */
  async sendTransfer(params: SendTransferParams): Promise<TransferResult> {
    try {
      const token = await this.getAuthToken();
      const v2Url = env.NOMBA_BASE_URL.replace("/v1", "/v2");
      const response = await axios.post(
        `${v2Url}/transfers/bank`,
        {
          merchantTxRef: params.transactionReference,
          amount: params.amountInNaira,
          accountNumber: params.recipientAccountNumber,
          bankCode: params.recipientBankCode,
          accountName: params.recipientName,
          senderName: params.senderName || "Vode User",
          narration: params.narration,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: env.NOMBA_ACCOUNT_ID,
            "Content-Type": "application/json",
          },
        }
      );

      const status = response.data.data?.status || response.data.status || "SUCCESS";
      const isOk = status === "SUCCESS" || status === "PENDING_BILLING" || status === "NEW";

      return {
        success: isOk,
        status: status === "SUCCESS" ? "SUCCESS" : "PENDING",
        partnerReference: response.data.data?.id || response.data.id || response.data.data?.transactionId,
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      logger.error(
        { error: error.response?.data || error.message, params },
        "Nomba outward transfer error"
      );
      return {
        success: false,
        status: "FAILED",
        errorMessage: errorMsg,
      };
    }
  }

  /**
   * Verify Transfer Status on Nomba
   */
  async verifyTransfer(reference: string): Promise<TransferStatusResult> {
    try {
      const token = await this.getAuthToken();
      const v2Url = env.NOMBA_BASE_URL.replace("/v1", "/v2");
      const response = await axios.get(
        `${v2Url}/transfers/bank/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: env.NOMBA_ACCOUNT_ID,
          },
        }
      );

      const data = response.data?.data || response.data;
      const rawStatus = (data?.status || "").toUpperCase();
      let status: "SUCCESS" | "PENDING" | "FAILED" = "PENDING";

      if (rawStatus === "SUCCESS" || rawStatus === "COMPLETED") {
        status = "SUCCESS";
      } else if (rawStatus === "FAILED" || rawStatus === "REVERSED") {
        status = "FAILED";
      }

      return {
        status,
        partnerReference: data?.id || data?.transactionId,
        amountInNaira: data?.amount,
        sessionReference: data?.sessionReference,
      };
    } catch (error: any) {
      logger.warn({ error: error.message, reference }, "Failed to verify transfer on Nomba");
      return { status: "PENDING" };
    }
  }

  /**
   * Fetch Bank Directory
   */
  async getBanks(): Promise<BankInfo[]> {
    const now = Date.now();
    if (NombaBankingProvider.cachedBanks.length > 0 && NombaBankingProvider.banksExpiresAt > now) {
      return NombaBankingProvider.cachedBanks;
    }

    try {
      const token = await this.getAuthToken();
      const response = await axios.get(`${env.NOMBA_BASE_URL}/transfers/banks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: env.NOMBA_ACCOUNT_ID,
        },
      });

      if (response.data?.data && Array.isArray(response.data.data)) {
        NombaBankingProvider.cachedBanks = response.data.data.map((b: any) => ({
          name: b.name,
          code: b.code,
          nipCode: b.nipCode || null,
        }));
        NombaBankingProvider.banksExpiresAt = now + 24 * 3600 * 1000;
        return NombaBankingProvider.cachedBanks;
      }
      return [];
    } catch (error: any) {
      logger.warn({ error: error.message }, "Failed to fetch banks list from Nomba");
      return [];
    }
  }

  /**
   * Parse Nomba Inbound Deposit Webhook
   * Normalizes Nomba's virtual account transaction event into a clean InboundCreditEvent
   */
  parseInboundCredit(payload: any, headers?: any): InboundCreditEvent | null {
    try {
      // Nomba webhook payload formats:
      // event: "payment.success" or "virtual_account.payment_success"
      const data = payload?.data || payload;
      const accountNumber =
        data?.accountNumber ||
        data?.account_number ||
        data?.bankAccountNumber ||
        data?.bank_account_number ||
        data?.virtualAccountNumber ||
        data?.virtual_account_number ||
        data?.customer?.accountNumber ||
        data?.customer?.account_number;

      const rawAmount = data?.amount || data?.order?.amount || data?.order_amount;
      if (!accountNumber || rawAmount === undefined) {
        return null;
      }

      const amountInNaira = Number(rawAmount);
      const senderName =
        data?.senderName ||
        data?.sender_name ||
        data?.originatorName ||
        data?.originator_name ||
        data?.customer?.name ||
        "External Bank Customer";
      const senderBank =
        data?.senderBank ||
        data?.sender_bank ||
        data?.originatorBank ||
        data?.originator_bank ||
        data?.bankName ||
        data?.bank_name ||
        "Commercial Bank";
      const partnerReference =
        data?.id ||
        data?.transactionId ||
        data?.transaction_id ||
        data?.paymentReference ||
        data?.payment_reference ||
        data?.orderReference ||
        data?.order_reference ||
        `nomba_${Date.now()}`;

      return {
        accountNumber,
        amountInNaira,
        senderName,
        senderBank,
        senderAccountNumber: data?.senderAccountNumber || data?.originatorAccountNumber,
        partnerReference,
        narration: data?.narration || data?.description,
        timestamp: new Date(),
      };
    } catch (err: any) {
      logger.error({ error: err.message, payload }, "Failed to parse Nomba inbound credit event");
      return null;
    }
  }
}

