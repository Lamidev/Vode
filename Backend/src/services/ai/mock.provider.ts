import { IAIProvider, VoiceTranscriptionResult, ImageReceiptResult } from "./ai.interface";
import { logger } from "../../lib/logger";

export class MockAIProvider implements IAIProvider {
  readonly providerName = "MOCK_AI";

  async transcribeAndParseVoice(
    audioBuffer: Buffer,
    _mimeType: string
  ): Promise<VoiceTranscriptionResult> {
    logger.info(
      { bufferLength: audioBuffer.length },
      "🧪 MockAIProvider: Simulating voice note processing"
    );

    // Realistic default mock simulation
    return {
      text: "Send 5000 to Chioma",
      intent: {
        action: "TRANSFER",
        amountInNaira: 5000,
        recipientNameOrNickname: "Chioma",
        confidence: 0.95,
      },
    };
  }

  async parseReceiptImage(
    imageBuffer: Buffer,
    _mimeType: string
  ): Promise<ImageReceiptResult> {
    logger.info(
      { bufferLength: imageBuffer.length },
      "🧪 MockAIProvider: Simulating receipt OCR scan"
    );

    return {
      success: true,
      amountInNaira: 12500,
      recipientAccountNumber: "0123456789",
      bankName: "Guaranty Trust Bank",
      recipientName: "OGUNLEWE ENTERPRISES",
      narration: "Invoice settlement",
      rawExtractedText: "Invoice #9021 • OGUNLEWE ENTERPRISES • Total ₦12,500.00",
      confidence: 0.9,
    };
  }
}

