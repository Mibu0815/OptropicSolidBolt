// src/loadEnv.ts
import dotenv from "dotenv";
import path from "path";
var envFile = path.resolve(process.cwd(), ".env");
var result = dotenv.config({ path: envFile });
if (result.error) {
  console.warn("\u26A0\uFE0F  Warning: Could not load .env file:", result.error.message);
  console.log("\u{1F4CD} Looking for .env at:", envFile);
} else {
  console.log("\u2705 Environment variables loaded from .env");
}
console.log("\u{1F30D} Running in:", process.env.IN_BOLT ? "BOLT Sandbox" : process.env.NODE_ENV || "development");
console.log("\u2705 Environment loaded successfully for preview.");

// app.config.ts
import { createApp } from "vinxi";
import reactRefresh from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { config } from "vinxi/plugins/config";

// src/server/env.ts
import { z } from "zod";
var envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string().default("admin"),
  // Authentication
  JWT_SECRET: z.string().default("default-jwt-secret-change-in-production"),
  // Cryptography
  SECRET_KEY: z.string().default("default-secret-key-change-in-production"),
  ENCRYPTION_ALGORITHM: z.string().optional(),
  // Monitoring & Logging
  SENTRY_DSN: z.string().optional(),
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
  NFC_RFID_PAIRING_BASE_URL: z.string().optional()
});
var env = envSchema.parse(process.env);
var isProduction = env.NODE_ENV === "production";
var inBolt = process.env.IN_BOLT === "true";
if (!inBolt) {
  console.log("\u2705 Environment validated");
  if (isProduction) {
    const hasDefaultJWT = env.JWT_SECRET.includes("default-jwt-secret");
    const hasDefaultSecret = env.SECRET_KEY.includes("default-secret-key");
    if (hasDefaultJWT || hasDefaultSecret) {
      console.warn("\u26A0\uFE0F  WARNING: Using default secrets in production!");
      console.warn("\u26A0\uFE0F  Please set JWT_SECRET and SECRET_KEY to secure random values");
      console.warn(`\u26A0\uFE0F  Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`);
    }
  }
} else {
  console.log("\u2699\uFE0F  Running inside BOLT preview - using fallback environment");
}

// app.config.ts
import { nodePolyfills } from "vite-plugin-node-polyfills";

// vite-console-forward-plugin.ts
import { createLogger } from "vite";
var logger = createLogger("info", {
  prefix: "[browser]"
});
function consoleForwardPlugin(options = {}) {
  const {
    enabled = true,
    endpoint = "/api/debug/client-logs",
    levels = ["log", "warn", "error", "info", "debug"]
  } = options;
  const virtualModuleId = "virtual:console-forward";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  return {
    name: "console-forward",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        if (!enabled) {
          return html;
        }
        if (html.includes("virtual:console-forward")) {
          return html;
        }
        return html.replace(
          /<head[^>]*>/i,
          (match) => `${match}
    <script type="module">import "virtual:console-forward";</script>`
        );
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        if (!enabled) {
          return "export default {};";
        }
        return `
// Console forwarding module
const originalMethods = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
};

const logBuffer = [];
let flushTimeout = null;
const FLUSH_DELAY = 100;
const MAX_BUFFER_SIZE = 50;

function createLogEntry(level, args) {
  const stacks = [];
  const extra = [];

  const message = args.map((arg) => {
    if (arg === undefined) return "undefined";
    if (typeof arg === "string") return arg;
    if (arg instanceof Error || typeof arg.stack === "string") {
      let stringifiedError = arg.toString();
      if (arg.stack) {
        let stack = arg.stack.toString();
        if (stack.startsWith(stringifiedError)) {
          stack = stack.slice(stringifiedError.length).trimStart();
        }
        if (stack) {
          stacks.push(stack);
        }
      }
      return stringifiedError;
    }
    if (typeof arg === "object" && arg !== null) {
      try {
        extra.push(JSON.parse(JSON.stringify(arg)));
      } catch {
        extra.push(String(arg));
      }
      return "[extra#" + extra.length + "]";
    }
    return String(arg);
  }).join(" ");

  return {
    level,
    message,
    timestamp: new Date(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    stacks,
    extra,
  };
}

async function sendLogs(logs) {
  try {
    await fetch("${endpoint}", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs }),
    });
  } catch (error) {
    // Fail silently in production
  }
}

function flushLogs() {
  if (logBuffer.length === 0) return;
  const logsToSend = [...logBuffer];
  logBuffer.length = 0;
  sendLogs(logsToSend);
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
}

function addToBuffer(entry) {
  logBuffer.push(entry);
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    flushLogs();
    return;
  }
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushLogs, FLUSH_DELAY);
  }
}

// Patch console methods
${levels.map(
          (level) => `
console.${level} = function(...args) {
  originalMethods.${level}(...args);
  const entry = createLogEntry("${level}", args);
  addToBuffer(entry);
};`
        ).join("")}

// Cleanup handlers
window.addEventListener("beforeunload", flushLogs);
setInterval(flushLogs, 10000);

export default { flushLogs };
        `;
      }
    },
    configureServer(server) {
      server.middlewares.use(endpoint, (req, res, next) => {
        const request = req;
        if (request.method !== "POST") {
          return next();
        }
        let body = "";
        request.setEncoding("utf8");
        request.on("data", (chunk) => {
          body += chunk;
        });
        request.on("end", () => {
          try {
            const { logs } = JSON.parse(body);
            logs.forEach((log) => {
              const location = log.url ? ` (${log.url})` : "";
              let message = `[${log.level}] ${log.message}${location}`;
              if (log.stacks && log.stacks.length > 0) {
                message += "\n" + log.stacks.map(
                  (stack) => stack.split("\n").map((line) => `    ${line}`).join("\n")
                ).join("\n");
              }
              if (log.extra && log.extra.length > 0) {
                message += "\n    Extra data: " + JSON.stringify(log.extra, null, 2).split("\n").map((line) => `    ${line}`).join("\n");
              }
              const logOptions = { timestamp: true };
              switch (log.level) {
                case "error": {
                  const error = log.stacks && log.stacks.length > 0 ? new Error(log.stacks.join("\n")) : null;
                  logger.error(message, { ...logOptions, error });
                  break;
                }
                case "warn":
                  logger.warn(message, logOptions);
                  break;
                case "info":
                  logger.info(message, logOptions);
                  break;
                case "debug":
                  logger.info(message, logOptions);
                  break;
                default:
                  logger.info(message, logOptions);
              }
            });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            server.config.logger.error("Error processing client logs:", {
              timestamp: true,
              error
            });
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
          }
        });
      });
    }
  };
}

// app.config.ts
console.log("\u{1F30D} ENV snapshot at runtime - NODE_ENV:", process.env.NODE_ENV);
var isBolt = process.env.IN_BOLT === "true" || process.env.BOLT_ENV === "true";
if (isBolt) {
  console.log("\u2699\uFE0F  Detected BOLT environment \u2013 ready for preview");
}
var app_config_default = createApp({
  server: {
    preset: "node-server",
    // change to 'netlify' or 'bun' or anyof the supported presets for nitro (nitro.unjs.io)
    experimental: {
      asyncContext: true
    }
  },
  routers: [
    {
      type: "static",
      name: "public",
      dir: "./public"
    },
    {
      type: "http",
      name: "trpc",
      base: "/trpc",
      handler: "./src/server/trpc/handler.ts",
      target: "server",
      plugins: () => [
        config("allowedHosts", {
          // @ts-ignore
          server: {
            allowedHosts: env.BASE_URL ? [env.BASE_URL.split("://")[1]] : void 0
          }
        }),
        tsConfigPaths({
          projects: ["./tsconfig.json"]
        })
      ]
    },
    {
      type: "http",
      name: "debug",
      base: "/api/debug/client-logs",
      handler: "./src/server/debug/client-logs-handler.ts",
      target: "server",
      plugins: () => [
        config("allowedHosts", {
          // @ts-ignore
          server: {
            allowedHosts: env.BASE_URL ? [env.BASE_URL.split("://")[1]] : void 0
          }
        }),
        tsConfigPaths({
          projects: ["./tsconfig.json"]
        })
      ]
    },
    {
      type: "spa",
      name: "client",
      handler: "./index.html",
      target: "browser",
      plugins: () => [
        config("allowedHosts", {
          // @ts-ignore
          server: {
            allowedHosts: env.BASE_URL ? [env.BASE_URL.split("://")[1]] : void 0
          }
        }),
        tsConfigPaths({
          projects: ["./tsconfig.json"]
        }),
        TanStackRouterVite({
          target: "react",
          autoCodeSplitting: true,
          routesDirectory: "./src/routes",
          generatedRouteTree: "./src/generated/routeTree.gen.ts"
        }),
        reactRefresh(),
        nodePolyfills(),
        consoleForwardPlugin({
          enabled: true,
          endpoint: "/api/debug/client-logs",
          levels: ["log", "warn", "error", "info", "debug"]
        })
      ]
    }
  ]
});
export {
  app_config_default as default
};
