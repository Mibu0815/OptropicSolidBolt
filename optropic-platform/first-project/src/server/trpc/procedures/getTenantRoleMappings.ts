import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { baseProcedure } from "~/server/trpc/main";

export const getTenantRoleMappings = baseProcedure
  .input(z.object({ 
    token: z.string(),
    tenantId: z.number().optional(), // If not provided, get for current user's tenant
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

      // Determine the target tenant ID
      const targetTenantId = input.tenantId || user.id;

      // Only admins can view other tenants' mappings, or users can view their own
      const isAdmin = user.role === "ADMIN" || user.archetype?.code === "ADMIN";
      if (!isAdmin && targetTenantId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Can only view your own tenant mappings.",
        });
      }

      const mappings = await db.tenantRoleMapping.findMany({
        where: { 
          tenantId: targetTenantId,
        },
        include: {
          archetype: true,
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: [
          { archetype: { code: "asc" } }
        ]
      });

      return mappings;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  });
