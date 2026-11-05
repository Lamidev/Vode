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
      const email = `${params.phoneNumber.replace("+", "")}@usevode.com`;

      const response = await axios.post(
        `${env.NOMBA_BASE_URL}/virtual-accounts`,
        {
          accountRef: params.accountRef,
          phoneNumber: params.phoneNumber,
          email,
          bvn: params.bvn || "",
          firstName: params.firstName,
          lastName: params.lastName,
          currency: "NGN",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: env.NOMBA_ACCOUNT_ID,
          },
        }
      );

      const data = response.data.data || response.data;

      return {
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        bankName: data.bankName || "Wema Bank / Titan Trust",
        bankCode: data.bankCode || "035",
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
   * Execute an outward bank transfer over NIP rails
   */
  static async sendBankTransfer(params: {
    merchantTxRef: string;
    amountInNaira: number;
    recipientAccountNumber: string;
    recipientBankCode: string;
    recipientName: string;
    narration: string;
  }): Promise<{ success: boolean; status: string; partnerRef?: string }> {
    try {
      const token = await this.getAuthToken();
      const response = await axios.post(
        `${env.NOMBA_BASE_URL}/transfers/bank`,
        {
          merchantTxRef: params.merchantTxRef,
          amount: params.amountInNaira,
          accountNumber: params.recipientAccountNumber,
          bankCode: params.recipientBankCode,
          accountName: params.recipientName,
          narration: params.narration,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accountId: env.NOMBA_ACCOUNT_ID,
          },
        }
      );

      const status = response.data.data?.status || response.data.status || "SUCCESS";
      return {
        success: status === "SUCCESS" || status === "PENDING",
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
