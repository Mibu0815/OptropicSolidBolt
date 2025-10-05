import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { baseProcedure } from "~/server/trpc/main";

const ProductItemSchema = z.object({
  gtin: z.string().optional(),
  batch: z.string().optional(),
  serial: z.string().optional(),
  name: z.string().optional(),
});

const UseCaseSchema = z.enum(["AUTHENTICATION", "MAINTENANCE", "COMPLIANCE", "ENGAGEMENT"]);
const UserRoleTypeSchema = z.enum(["INSTALLER", "INSPECTOR", "MAINTAINER", "MANAGER", "PUBLIC"]);
const ActionTypeSchema = z.enum(["VERIFY", "LOG", "INSPECT", "VIEW_INFO"]);

function generateWorkflows(useCase: string, roles: string[], roleActions: Record<string, string[]>) {
  const workflows = [];

  // Map UserRoleType to archetype codes for workflow generation
  const roleMapping: Record<string, string> = {
    "INSTALLER": "OPERATOR",
    "INSPECTOR": "INSPECTOR", 
    "MAINTAINER": "MAINTAINER",
    "MANAGER": "MANAGER",
    "PUBLIC": "PUBLIC"
  };

  // Generate workflows based on use case and roles
  switch (useCase) {
    case "AUTHENTICATION":
      workflows.push({
        name: "Product Verification",
        trigger: "code_scan",
        steps: [
          { action: "authenticate_user", roles: roles.filter(r => r !== "PUBLIC") },
          { action: "verify_product", roles: ["INSPECTOR", "MANAGER"] },
          { action: "log_verification", roles: ["INSPECTOR", "MANAGER"] },
        ],
      });
      break;
    
    case "MAINTENANCE":
      workflows.push({
        name: "Maintenance Workflow",
        trigger: "maintenance_due",
        steps: [
          { action: "schedule_maintenance", roles: ["MANAGER"] },
          { action: "perform_maintenance", roles: ["MAINTAINER"] },
          { action: "log_completion", roles: ["MAINTAINER", "INSPECTOR"] },
        ],
      });
      break;
    
    case "COMPLIANCE":
      workflows.push({
        name: "Compliance Audit",
        trigger: "audit_required",
        steps: [
          { action: "initiate_audit", roles: ["INSPECTOR", "MANAGER"] },
          { action: "collect_evidence", roles: ["INSPECTOR"] },
          { action: "generate_report", roles: ["INSPECTOR", "MANAGER"] },
        ],
      });
      break;
    
    case "ENGAGEMENT":
      workflows.push({
        name: "Public Engagement",
        trigger: "public_scan",
        steps: [
          { action: "display_info", roles: ["PUBLIC"] },
          { action: "collect_feedback", roles: ["PUBLIC"] },
          { action: "analyze_engagement", roles: ["MANAGER"] },
        ],
      });
      break;
  }

  return workflows;
}

export const generateConfigPack = baseProcedure
  .input(z.object({
    token: z.string(),
    name: z.string().min(1, "Configuration name is required"),
    useCase: UseCaseSchema,
    selectedRoles: z.array(UserRoleTypeSchema),
    roleActions: z.record(UserRoleTypeSchema, z.array(ActionTypeSchema)),
    productList: z.array(ProductItemSchema),
    projectId: z.number().optional(),
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

      // Validate project ownership if projectId is provided
      if (input.projectId) {
        const project = await db.project.findFirst({
          where: {
            id: input.projectId,
            userId: user.id,
          },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found or access denied",
          });
        }
      }

      // Generate the complete configuration
      const configJson = {
        metadata: {
          name: input.name,
          useCase: input.useCase,
          generatedAt: new Date().toISOString(),
          generatedBy: `${user.firstName} ${user.lastName}`,
        },
        roles: input.selectedRoles,
        permissions: input.roleActions,
        products: input.productList,
        settings: {
          encryptionLevel: input.useCase === "COMPLIANCE" ? "AES_256" : "AES_128",
          codeType: input.useCase === "AUTHENTICATION" ? "GS1_COMPLIANT" : "OPTROPIC",
          enableAuditLog: ["COMPLIANCE", "MAINTENANCE"].includes(input.useCase),
          enableRealTimeTracking: input.useCase === "MAINTENANCE",
          publicAccess: input.selectedRoles.includes("PUBLIC"),
        },
        workflows: generateWorkflows(input.useCase, input.selectedRoles, input.roleActions),
      };

      // Store the configuration pack in the database
      const configPack = await db.tenantConfigPack.create({
        data: {
          name: input.name,
          useCase: input.useCase,
          roles: input.selectedRoles,
          actions: input.roleActions,
          productList: input.productList,
          configJson,
          projectId: input.projectId,
        },
      });

      // Log the activity
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: "GENERATE_CONFIG_PACK",
          entityType: "TenantConfigPack",
          entityId: configPack.id,
          newValues: { name: input.name, useCase: input.useCase },
        },
      });

      return {
        id: configPack.id,
        config: configJson,
        message: "Configuration pack generated successfully!",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate configuration pack",
      });
    }
  });
