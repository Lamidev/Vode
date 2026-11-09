export interface ExtractedPaymentIntent {
  action: "TRANSFER" | "BALANCE" | "HISTORY" | "ACCOUNT" | "UNKNOWN";
  amountInNaira?: number;
  recipientNameOrNickname?: string;
  recipientAccountNumber?: string;
  bankName?: string;
  confidence: number;
}

export interface VoiceTranscriptionResult {
  text: string;
  intent: ExtractedPaymentIntent;
}

export interface ImageReceiptResult {
  success: boolean;
  amountInNaira?: number;
  recipientAccountNumber?: string;
  bankName?: string;
  recipientName?: string;
  narration?: string;
  rawExtractedText?: string;
  confidence: number;
}

export interface IAIProvider {
  readonly providerName: string;
  transcribeAndParseVoice(audioBuffer: Buffer, mimeType: string): Promise<VoiceTranscriptionResult>;
  parseReceiptImage(imageBuffer: Buffer, mimeType: string): Promise<ImageReceiptResult>;
}

