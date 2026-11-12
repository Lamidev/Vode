import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { z } from "zod";

// Look for .env in current dir, parent dir, or Backend folder
const possibleEnvPaths = [
  path.resolve(process.cwd(), "Backend/.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().default(""),

  // Meta WhatsApp
  WHATSAPP_PHONE_NUMBER_ID: z.string().default("952116454653781"),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().default("872667862189581"),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1, "WHATSAPP_ACCESS_TOKEN is required"),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default("kredibly_secret_123"),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_PHONE_NUMBER: z.string().default("+2347071238658"),

  // Core Banking Infrastructure
  CORE_BANKING_PROVIDER: z.string().default("nomba"),
  BANKING_WEBHOOK_SECRET: z.string().optional(),

  // Nomba Payment Provider
  NOMBA_ENV: z.string().default("production"),
  NOMBA_ACCOUNT_ID: z.string().min(1, "NOMBA_ACCOUNT_ID is required"),
  NOMBA_CLIENT_ID: z.string().min(1, "NOMBA_CLIENT_ID is required"),
  NOMBA_PRIVATE_KEY: z.string().min(1, "NOMBA_PRIVATE_KEY is required"),
  NOMBA_WEBHOOK_SECRET: z.string().default("kredibly_nomba_webhook_secret_2026"),
  NOMBA_BASE_URL: z.string().default("https://api.nomba.com/v1"),

  // App & Security
  JWT_SECRET: z.string().default("vode_jwt_secret_dev_2026"),
  ENCRYPTION_KEY: z.string().default("01234567890123456789012345678901"),
  FRONTEND_URL: z.string().default("http://localhost:3050"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
