import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { baseProcedure } from "~/server/trpc/main";

export const getCurrentUser = baseProcedure
  .input(z.object({ 
    token: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const verified = jwt.verify(input.token, env.JWT_SECRET);
      const parsed = z.object({ userId: z.number() }).parse(verified);
      
      const user = await db.user.findUnique({
        where: { id: parsed.userId },
        include: {
          archetype: true,
          roleMappings: {
            where: { isEnabled: true },
            include: {
              archetype: true
            },
            take: 1 // Get the primary role mapping for this user
          }
        }
      });

      if (!user || !user.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found or inactive",
        });
      }

      // Get the primary tenant role mapping (user's own tenant or first enabled mapping)
      const primaryRoleMapping = user.roleMappings.find(mapping => mapping.tenantId === user.id) || user.roleMappings[0];

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role, // Keep for backward compatibility
        archetype: user.archetype,
        tenantRoleMapping: primaryRoleMapping,
        tenantId: user.tenantId,
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  });
