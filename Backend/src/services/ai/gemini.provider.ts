import axios from "axios";
import { IAIProvider, VoiceTranscriptionResult, ImageReceiptResult } from "./ai.interface";
import { logger } from "../../lib/logger";

export class GeminiAIProvider implements IAIProvider {
  readonly providerName = "GOOGLE_GEMINI";
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Transcribe Voice Note and Extract Financial Intent
   */
  async transcribeAndParseVoice(
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<VoiceTranscriptionResult> {
    const base64Audio = audioBuffer.toString("base64");
    const cleanMime = mimeType.split(";")[0] || "audio/ogg";

    const prompt = `
You are the voice recognition AI for Vode, a Nigerian WhatsApp banking app.
The user sent a voice note. They might speak in English, Nigerian Pidgin, or informal Nigerian slang (e.g. "Abeg send 5k to Chioma", "Transfer 10,000 to my GTBank 0123456789", "Check my balance", "Show me my history").

Listen to the audio and return a JSON object with:
1. "text": the exact verbatim transcription of what the user said.
2. "intent": an object containing:
   - "action": "TRANSFER" | "BALANCE" | "HISTORY" | "ACCOUNT" | "UNKNOWN"
   - "amountInNaira": number (e.g. 5000 for "5k" or 10000 for "ten thousand naira") or null
   - "recipientNameOrNickname": string (e.g. "Chioma", "Mummy", "Tunde") or null
   - "recipientAccountNumber": string (10-digit NUBAN if spoken) or null
   - "bankName": string (e.g. "GTBank", "Kuda", "Access", "OPay") or null
   - "confidence": number between 0.0 and 1.0

Return ONLY raw valid JSON matching this schema.
`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: cleanMime,
                    data: base64Audio,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1,
          },
        },
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Empty response from Gemini API");
      }

      const parsed = JSON.parse(rawText);
      return {
        text: parsed.text || "Voice note transcribed",
        intent: {
          action: parsed.intent?.action || "UNKNOWN",
          amountInNaira: parsed.intent?.amountInNaira ? Number(parsed.intent.amountInNaira) : undefined,
          recipientNameOrNickname: parsed.intent?.recipientNameOrNickname || undefined,
          recipientAccountNumber: parsed.intent?.recipientAccountNumber || undefined,
          bankName: parsed.intent?.bankName || undefined,
          confidence: parsed.intent?.confidence || 0.9,
        },
      };
    } catch (err: any) {
      logger.error({ error: err.response?.data || err.message }, "Gemini voice transcription failed");
      return {
        text: "Could not transcribe audio.",
        intent: { action: "UNKNOWN", confidence: 0 },
      };
    }
  }

  /**
   * Parse Receipt / Invoice Image via Gemini Vision OCR
   */
  async parseReceiptImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<ImageReceiptResult> {
    const base64Image = imageBuffer.toString("base64");
    const cleanMime = mimeType.split(";")[0] || "image/jpeg";

    const prompt = `
You are the OCR vision AI for Vode, a Nigerian WhatsApp banking app.
The user forwarded a photo of a receipt, invoice, bill, POS slip, or mobile banking screenshot.

Scan the image carefully and extract payment details:
1. "amountInNaira": number (the total or transfer amount in Nigerian Naira) or null
2. "recipientAccountNumber": string (10-digit Nigerian NUBAN) or null
3. "bankName": string (canonical bank name e.g. "GTBank", "Access Bank", "Zenith Bank", "OPay", "Kuda", "Moniepoint", etc.) or null
4. "recipientName": string (the recipient account holder or merchant name) or null
5. "narration": string (short description or invoice reference) or null
6. "rawExtractedText": string (brief summary of text seen on receipt)
7. "confidence": number between 0.0 and 1.0

Return ONLY raw valid JSON matching this schema. If no payment details are found, return { "success": false }.
`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: cleanMime,
                    data: base64Image,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1,
          },
        },
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Empty response from Gemini Vision OCR");
      }

      const parsed = JSON.parse(rawText);
      const hasKeyData = Boolean(parsed.amountInNaira || parsed.recipientAccountNumber);

      return {
        success: hasKeyData,
        amountInNaira: parsed.amountInNaira ? Number(parsed.amountInNaira) : undefined,
        recipientAccountNumber: parsed.recipientAccountNumber || undefined,
        bankName: parsed.bankName || undefined,
        recipientName: parsed.recipientName || undefined,
        narration: parsed.narration || undefined,
        rawExtractedText: parsed.rawExtractedText || undefined,
        confidence: parsed.confidence || 0.85,
      };
    } catch (err: any) {
      logger.error({ error: err.response?.data || err.message }, "Gemini OCR scan failed");
      return {
        success: false,
        confidence: 0,
      };
    }
  }
}

