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

const isProduction = env.NODE_ENV === "production";
const inBolt = process.env.IN_BOLT === "true";

if (!inBolt) {
  console.log("✅ Environment validated");

  if (isProduction) {
    const hasDefaultJWT = env.JWT_SECRET.includes("default-jwt-secret");
    const hasDefaultSecret = env.SECRET_KEY.includes("default-secret-key");

    if (hasDefaultJWT || hasDefaultSecret) {
      console.warn("⚠️  WARNING: Using default secrets in production!");
      console.warn("⚠️  Please set JWT_SECRET and SECRET_KEY to secure random values");
      console.warn("⚠️  Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
    }
  }
} else {
  console.log("⚙️  Running inside BOLT preview - using fallback environment");
}
