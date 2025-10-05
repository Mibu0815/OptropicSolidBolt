import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { baseProcedure } from "~/server/trpc/main";

export const getRoleArchetypes = baseProcedure
  .input(z.object({ 
    token: z.string(),
    includeInactive: z.boolean().optional().default(false),
  }))
  .query(async ({ input }) => {
    try {
      const verified = jwt.verify(input.token, env.JWT_SECRET);
      const parsed = z.object({ userId: z.number() }).parse(verified);
      
      const user = await db.user.findUnique({
        where: { id: parsed.userId },
        include: {
          archetype: true
        }
      });

      if (!user || !user.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found or inactive",
        });
      }

      // Only admins can view role archetypes
      if (user.role !== "ADMIN" && user.archetype?.code !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Admin privileges required.",
        });
      }

      const whereClause = input.includeInactive ? {} : { isActive: true };

      const archetypes = await db.roleArchetype.findMany({
        where: whereClause,
        orderBy: [
          { code: "asc" }
        ]
      });

      return archetypes;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  });
