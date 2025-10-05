import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../db";
import { env } from "../env";
import { checkRateLimit } from "../middleware/rateLimitStore";
import { createRequestLogger, logError } from "../utils/logger";
import { captureError, setUser } from "../utils/sentry";
import { trpcCallDuration, trpcCallTotal, errorTotal, authAttempts } from "../services/metricsService";

interface Context {
  req?: any;
  requestId?: string;
  logger?: ReturnType<typeof createRequestLogger>;
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

function getClientIp(req: any): string {
  return (
    req?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
    req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req?.socket?.remoteAddress ||
    req?.connection?.remoteAddress ||
    "unknown"
  );
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  sse: {
    enabled: true,
    client: {
      reconnectAfterInactivityMs: 5000,
    },
    ping: {
      enabled: true,
      intervalMs: 2500,
    },
  },
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

const loggingMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const requestId = crypto.randomUUID();
  const logger = createRequestLogger(requestId);

  logger.info({ path }, "tRPC request started");

  const startTime = Date.now();
  const endTimer = trpcCallDuration.startTimer({ procedure: path || "unknown" });

  try {
    const result = await next({
      ctx: {
        ...ctx,
        requestId,
        logger,
      },
    });

    const duration = (Date.now() - startTime) / 1000;
    endTimer({ status: "success" });
    trpcCallTotal.inc({ procedure: path || "unknown", status: "success" });
    logger.info({ path, duration }, "tRPC request completed");

    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    endTimer({ status: "error" });
    trpcCallTotal.inc({ procedure: path || "unknown", status: "error" });
    errorTotal.inc({ type: "trpc", severity: "error" });
    logger.error({ path, duration, error }, "tRPC request failed");
    throw error;
  }
});

const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const ip = getClientIp(ctx.req);
  const isAuthEndpoint = path?.includes("login") || path?.includes("auth");

  const windowMs = isAuthEndpoint ? 60000 : 900000;
  const maxRequests = isAuthEndpoint ? 5 : 100;

  const { allowed } = checkRateLimit(ip, windowMs, maxRequests);

  if (!allowed) {
    ctx.logger?.warn({ ip, path }, "Rate limit exceeded");
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: isAuthEndpoint
        ? "Too many authentication attempts. Please try again in 1 minute."
        : "Rate limit exceeded. Please slow down your requests.",
    });
  }

  return next();
});

const isAuthed = t.middleware(async ({ ctx, next }) => {
  const authHeader = ctx.req?.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.logger?.warn("Missing authorization header");
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No authorization token provided",
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number };

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      ctx.logger?.warn({ userId: decoded.userId }, "Invalid or inactive user");
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

    ctx.logger?.info({ userId: user.id, email: user.email }, "User authenticated");
    setUser({ id: user.id, email: user.email });
    authAttempts.inc({ status: "success" });

    return next({
      ctx: {
        ...ctx,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    ctx.logger?.error({ error }, "Authentication failed");
    captureError(error as Error, { requestId: ctx.requestId });
    authAttempts.inc({ status: "failure" });
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure.use(loggingMiddleware);
export const protectedProcedure = t.procedure
  .use(loggingMiddleware)
  .use(rateLimitMiddleware)
  .use(isAuthed);
export const publicProcedure = t.procedure
  .use(loggingMiddleware)
  .use(rateLimitMiddleware);
