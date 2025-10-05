/**
 * Load environment variables before any other imports.
 * This ensures that app.config.ts and server code
 * can safely reference process.env values.
 */
import dotenv from "dotenv";
import path from "path";

const envFile = path.resolve(process.cwd(), ".env");
const result = dotenv.config({ path: envFile });

if (result.error) {
  console.warn("⚠️  Warning: Could not load .env file:", result.error.message);
  console.log("📍 Looking for .env at:", envFile);
} else {
  console.log("✅ Environment variables loaded from .env");
}

console.log("🌍 Running in:", process.env.IN_BOLT ? "BOLT Sandbox" : process.env.NODE_ENV || "development");
console.log("✅ Environment loaded successfully for preview.");

export {};
