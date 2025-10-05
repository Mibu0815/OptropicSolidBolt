import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { baseProcedure } from "~/server/trpc/main";

export const updateTenantRoleMapping = baseProcedure
  .input(z.object({ 
    token: z.string(),
    mappingId: z.number(),
    customLabel: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    isEnabled: z.boolean().optional(),
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

      // Get the existing mapping to check ownership
      const existingMapping = await db.tenantRoleMapping.findUnique({
        where: { id: input.mappingId },
        include: {
          archetype: true
        }
      });

      if (!existingMapping) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Role mapping not found",
        });
      }

      // Only admins can update any tenant's mappings, or users can update their own
      const isAdmin = user.role === "ADMIN" || user.archetype?.code === "ADMIN";
      if (!isAdmin && existingMapping.tenantId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Can only update your own tenant role mappings.",
        });
      }

      // Build update data object
      const updateData: any = {};
      if (input.customLabel !== undefined) updateData.customLabel = input.customLabel;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.isEnabled !== undefined) updateData.isEnabled = input.isEnabled;

      const updatedMapping = await db.tenantRoleMapping.update({
        where: { id: input.mappingId },
        data: updateData,
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
          action: "UPDATE_TENANT_ROLE_MAPPING",
          entityType: "TenantRoleMapping",
          entityId: updatedMapping.id,
          oldValues: { 
            customLabel: existingMapping.customLabel,
            icon: existingMapping.icon,
            color: existingMapping.color,
            isEnabled: existingMapping.isEnabled
          },
          newValues: updateData,
        },
      });

      return updatedMapping;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update tenant role mapping",
      });
    }
  });
