import { IAIProvider, VoiceTranscriptionResult, ImageReceiptResult } from "./ai.interface";
import { GeminiAIProvider } from "./gemini.provider";
import { MockAIProvider } from "./mock.provider";
import { logger } from "../../lib/logger";

export class AIService {
  private static providerInstance: IAIProvider | null = null;

  static getProvider(): IAIProvider {
    if (this.providerInstance) {
      return this.providerInstance;
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    if (geminiKey && geminiKey.length > 5) {
      logger.info("✨ Active AI Provider: GOOGLE_GEMINI_2_FLASH (Plug-and-Play)");
      this.providerInstance = new GeminiAIProvider(geminiKey);
    } else {
      logger.warn(
        "💡 Active AI Provider: MOCK_AI (To enable real Gemini Voice & OCR, add GEMINI_API_KEY in .env)"
      );
      this.providerInstance = new MockAIProvider();
    }

    return this.providerInstance;
  }

  static setProvider(provider: IAIProvider): void {
    logger.info({ providerName: provider.providerName }, "Switching active AI provider");
    this.providerInstance = provider;
  }

  static async transcribeAndParseVoice(
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<VoiceTranscriptionResult> {
    return this.getProvider().transcribeAndParseVoice(audioBuffer, mimeType);
  }

  static async parseReceiptImage(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<ImageReceiptResult> {
    return this.getProvider().parseReceiptImage(imageBuffer, mimeType);
  }
}

