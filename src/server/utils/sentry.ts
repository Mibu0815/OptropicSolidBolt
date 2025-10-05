/**
 * Sentry Error Tracking Integration
 * ----------------------------------
 * Captures and reports errors to Sentry for monitoring
 */

import * as Sentry from "@sentry/node";
import { env } from "../env";

const SENTRY_DSN = process.env.SENTRY_DSN;
const isProduction = env.NODE_ENV === "production";

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn(
      "⚠️  SENTRY_DSN not configured. Error tracking disabled."
    );
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    beforeSend(event, hint) {
      if (env.NODE_ENV === "development") {
        console.log("Sentry Event:", event);
      }
      return event;
    },
  });

  console.log("✅ Sentry initialized");
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext("errorContext", context);
  }
  Sentry.captureException(error);
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: number; email: string }) {
  Sentry.setUser({
    id: user.id.toString(),
    email: user.email,
  });
}

export function clearUser() {
  Sentry.setUser(null);
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  Sentry.captureException(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  Sentry.captureException(reason);
});
