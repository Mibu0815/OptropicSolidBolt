import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string().default("admin"),

  // Authentication
  JWT_SECRET: z.string().default("default-jwt-secret-change-in-production"),

  // Cryptography
  SECRET_KEY: z.string().default("default-secret-key-change-in-production"),
  ENCRYPTION_ALGORITHM: z.string().optional(),

  // AI Integration
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // External API Integrations
  AWS_KMS_KEY_ID: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),

  GS1_DIGITAL_LINK_API_KEY: z.string().optional(),
  GS1_DIGITAL_LINK_BASE_URL: z.string().optional(),

  QRGUARD_TRUST_API_KEY: z.string().optional(),
  QRGUARD_TRUST_BASE_URL: z.string().optional(),

  NFC_RFID_PAIRING_API_KEY: z.string().optional(),
  NFC_RFID_PAIRING_BASE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);

if (!process.env.IN_BOLT) {
  console.log("✅ Environment validated");
} else {
  console.log("⚙️  Running inside BOLT preview - using fallback environment");
}
