/**
 * server.cjs
 * Universal Preview Launcher for Solid / Vinxi / Optropic Platform
 * ---------------------------------------------------------------
 * This script ensures a working preview even when the environment
 * (like BOLT) does NOT automatically start the dev server.
 *
 * It checks for a built app in .output/, falls back to dev mode,
 * and ensures .env is loaded before startup.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const OUTPUT_PATH = path.resolve(".output/server/index.mjs");
const DEV_CMD = ["run", "dev"];

console.log("🚀 Starting Optropic Preview Runner...");

// Detect build output first
if (fs.existsSync(OUTPUT_PATH)) {
  console.log("✅ Found production build at .output/server/index.mjs");
  console.log("⚙️ Starting production preview...");
  const child = spawn("node", [OUTPUT_PATH], { stdio: "inherit" });
  child.on("exit", (code) =>
    console.log(`Preview process exited with code ${code}`)
  );
} else {
  console.log("⚠️ No build output found — falling back to dev server...");
  console.log("🧩 Running:", `npm ${DEV_CMD.join(" ")}`);
  const child = spawn("npm", DEV_CMD, { stdio: "inherit" });
  child.on("exit", (code) =>
    console.log(`Dev server exited with code ${code}`)
  );
}
