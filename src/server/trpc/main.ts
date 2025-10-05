import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { env } from "../env";
import { checkRateLimit } from "../middleware/rateLimitStore";

interface Context {
  req?: any;
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

const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const ip = getClientIp(ctx.req);
  const isAuthEndpoint = path?.includes("login") || path?.includes("auth");

  const windowMs = isAuthEndpoint ? 60000 : 900000;
  const maxRequests = isAuthEndpoint ? 5 : 100;

  const { allowed } = checkRateLimit(ip, windowMs, maxRequests);

  if (!allowed) {
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
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }

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
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(rateLimitMiddleware).use(isAuthed);
export const publicProcedure = t.procedure.use(rateLimitMiddleware);
