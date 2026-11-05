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
}
