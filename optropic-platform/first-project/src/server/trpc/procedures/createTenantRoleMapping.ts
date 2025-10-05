import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { baseProcedure } from "~/server/trpc/main";

export const createTenantRoleMapping = baseProcedure
  .input(z.object({ 
    token: z.string(),
    tenantId: z.number(),
    archetypeId: z.number(),
    customLabel: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    isEnabled: z.boolean().optional().default(true),
  }))
  .mutation(async ({ input }) => {
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

      // Only admins can create tenant role mappings for other tenants
      const isAdmin = user.role === "ADMIN" || user.archetype?.code === "ADMIN";
      if (!isAdmin && input.tenantId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Admin privileges required.",
        });
      }

      // Verify the tenant exists
      const tenant = await db.user.findUnique({
        where: { id: input.tenantId }
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found",
        });
      }

      // Verify the archetype exists
      const archetype = await db.roleArchetype.findUnique({
        where: { id: input.archetypeId }
      });

      if (!archetype || !archetype.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Role archetype not found or inactive",
        });
      }

      // Check if mapping already exists
      const existingMapping = await db.tenantRoleMapping.findUnique({
        where: {
          tenantId_archetypeId: {
            tenantId: input.tenantId,
            archetypeId: input.archetypeId
          }
        }
      });

      if (existingMapping) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Role mapping already exists for this tenant and archetype",
        });
      }

      const newMapping = await db.tenantRoleMapping.create({
        data: {
          tenantId: input.tenantId,
          archetypeId: input.archetypeId,
          customLabel: input.customLabel,
          icon: input.icon,
          color: input.color,
          isEnabled: input.isEnabled,
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
        }
      });

      // Log the activity
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: "CREATE_TENANT_ROLE_MAPPING",
          entityType: "TenantRoleMapping",
          entityId: newMapping.id,
          newValues: {
            tenantId: input.tenantId,
            archetypeId: input.archetypeId,
            customLabel: input.customLabel,
            icon: input.icon,
            color: input.color,
            isEnabled: input.isEnabled,
          },
        },
      });

      return newMapping;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create tenant role mapping",
      });
    }
  });
