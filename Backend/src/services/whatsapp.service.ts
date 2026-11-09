import axios from "axios";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export class WhatsAppService {
  private static readonly baseUrl = "https://graph.facebook.com/v21.0";

  /**
   * Send a standard text message to a user on WhatsApp
   */
  static async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      if (env.WHATSAPP_PHONE_NUMBER_ID === "demo_phone_id") {
        logger.info({ to, message }, "[WhatsApp Demo] Simulating outbound text message");
        return true;
      }

      const url = `${this.baseUrl}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info({ to }, "WhatsApp text message delivered successfully");
      return true;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message, to }, "Failed to send WhatsApp text");
      return false;
    }
  }

  /**
   * Send an interactive message with a native CTA URL Button
   * (e.g. "[ 🔐 Activate Account ]" or "[ 💳 Authorize Payment ]")
   */
  static async sendCtaButtonMessage(
    to: string,
    bodyText: string,
    buttonText: string,
    url: string
  ): Promise<boolean> {
    try {
      if (env.WHATSAPP_PHONE_NUMBER_ID === "demo_phone_id") {
        logger.info(
          { to, bodyText, buttonText, url },
          "[WhatsApp Demo] Simulating outbound interactive CTA button message"
        );
        return true;
      }

      const endpoint = `${this.baseUrl}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      await axios.post(
        endpoint,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "interactive",
          interactive: {
            type: "cta_url",
            body: { text: bodyText },
            action: {
              name: "cta_url",
              parameters: {
                display_text: buttonText,
                url,
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info({ to, buttonText }, "WhatsApp CTA button message sent successfully");
      return true;
    } catch (error: any) {
      logger.error(
        { error: error.response?.data || error.message, to },
        "Failed to send WhatsApp CTA button message"
      );
      return false;
    }
  }

  /**
   * Download media (audio voice notes, images, documents) from Meta WhatsApp Cloud API
   */
  static async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
      if (env.WHATSAPP_PHONE_NUMBER_ID === "demo_phone_id" || !env.WHATSAPP_ACCESS_TOKEN) {
        logger.info({ mediaId }, "[WhatsApp Demo] Simulating media download");
        return { buffer: Buffer.from("simulated_media_data"), mimeType: "audio/ogg" };
      }

      // 1. Fetch media metadata and signed download URL
      const metaUrl = `${this.baseUrl}/${mediaId}`;
      const metaRes = await axios.get(metaUrl, {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        },
      });

      const downloadUrl = metaRes.data?.url;
      const mimeType = metaRes.data?.mime_type || "application/octet-stream";

      if (!downloadUrl) {
        throw new Error("No download URL returned from Meta Graph API");
      }

      // 2. Download binary stream using User-Agent and Bearer Token as required by Meta
      const mediaRes = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "User-Agent": "Vode-Backend/1.0",
        },
      });

      const buffer = Buffer.from(mediaRes.data);
      logger.info({ mediaId, mimeType, byteLength: buffer.length }, "Downloaded WhatsApp media");

      return { buffer, mimeType };
    } catch (error: any) {
      logger.error(
        { error: error.response?.data || error.message, mediaId },
        "Failed to download media from Meta"
      );
      return null;
    }
  }
}
