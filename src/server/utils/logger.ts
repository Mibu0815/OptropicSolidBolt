/**
 * Structured Logging with Pino
 * -----------------------------
 * Centralized logging configuration for the Optropic Platform
 */

import pino from "pino";
import { env } from "../env";

const isDevelopment = env.NODE_ENV === "development";

export const logger = pino({
  level: isDevelopment ? "debug" : "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: env.NODE_ENV,
  },
});

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

export function logError(error: unknown, context?: Record<string, any>) {
  if (error instanceof Error) {
    logger.error(
      {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        ...context,
      },
      "Error occurred"
    );
  } else {
    logger.error({ error, ...context }, "Unknown error occurred");
  }
}

export function logRequest(method: string, path: string, requestId: string) {
  logger.info(
    {
      requestId,
      method,
      path,
    },
    "Incoming request"
  );
}

export function logResponse(
  requestId: string,
  statusCode: number,
  duration: number
) {
  logger.info(
    {
      requestId,
      statusCode,
      duration,
    },
    "Request completed"
  );
}
