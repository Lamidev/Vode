import axios from "axios";
import { env } from "../config/env";
import { logger } from "../lib/logger";

interface NombaTokenResponse {
  access_token: string;
  expires_in: number;
}

interface NombaLookupResponse {
  accountName: string;
  accountNumber: string;
  bankCode: string;
}

interface NombaVirtualAccountResponse {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  accountRef: string;
}

export class NombaService {
  private static cachedToken: string | null = null;
  private static tokenExpiresAt: number = 0;

  /**
   * Acquire a valid Nomba bearer token (cached until expiration)
   */
  static async getAuthToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 60000) {
      return this.cachedToken;
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
      this.cachedToken = tokenData.access_token;
      this.tokenExpiresAt = now + (tokenData.expires_in || 3600) * 1000;
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
   * Resolve legal account name for an account number and bank code (Name Inquiry)
   */
  static async lookupAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<NombaLookupResponse | null> {
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

      return {
        accountName: response.data.data?.accountName || response.data.accountName,
        accountNumber,
        bankCode,
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
   * Generate a permanent, dedicated 10-digit NUBAN virtual account for a user
   */
  static async createVirtualAccount(params: {
    accountRef: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    bvn?: string;
  }): Promise<NombaVirtualAccountResponse | null> {
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
   * Fetch all supported Nigerian banks with caching
   */
  private static cachedBanks: Array<{ name: string; code: string; nipCode: string | null }> = [];
  private static banksExpiresAt: number = 0;

  static async getBanks(): Promise<Array<{ name: string; code: string; nipCode: string | null }>> {
    const now = Date.now();
    if (this.cachedBanks.length > 0 && this.banksExpiresAt > now) {
      return this.cachedBanks;
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
        this.cachedBanks = response.data.data;
        this.banksExpiresAt = now + 24 * 3600 * 1000; // cache 24h
        return this.cachedBanks;
      }
      return [];
    } catch (error: any) {
      logger.warn({ error: error.response?.data || error.message }, "Failed to fetch banks list");
      return [];
    }
  }

  /**
   * Execute an outward bank transfer over NIP rails (Nomba v2 API)
   */
  static async sendBankTransfer(params: {
    merchantTxRef: string;
    amountInNaira: number;
    recipientAccountNumber: string;
    recipientBankCode: string;
    recipientName: string;
    senderName?: string;
    narration: string;
  }): Promise<{ success: boolean; status: string; partnerRef?: string }> {
    try {
      const token = await this.getAuthToken();
      // Nomba v2 transfer endpoint
      const v2Url = env.NOMBA_BASE_URL.replace("/v1", "/v2");
      const response = await axios.post(
        `${v2Url}/transfers/bank`,
        {
          merchantTxRef: params.merchantTxRef,
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
        status,
        partnerRef: response.data.data?.id || response.data.id,
      };
    } catch (error: any) {
      logger.error(
        { error: error.response?.data || error.message, params },
        "Nomba interbank payout error"
      );
      return {
        success: false,
        status: "FAILED",
      };
    }
  }
}
