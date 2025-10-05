/**
 * tRPC Router for Code Generation
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, createTRPCRouter } from "../main";
import { CodeService } from "../../services/codeService";
import { VerificationService } from "../../services/verificationService";
import { db } from "../../db";

export const codesRouter = createTRPCRouter({
  /**
   * Generate a new code
   * Supports both plaintext and encrypted payload modes
   */
  generate: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        keyId: z.number(),
        codeType: z.enum(["OPTROPIC", "QRSSL", "GS1_COMPLIANT"]),
        encryptionLevel: z.enum(["AES_128", "AES_256", "RSA_2048", "RSA_4096"]),
        contentId: z.number().optional(),
        assetId: z.number().optional(),
        role: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        encryptPayload: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const project = await db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new Error("Project not found or unauthorized");
      }

      const code = await CodeService.generateCode({
        projectId: input.projectId,
        keyId: input.keyId,
        codeType: input.codeType,
        encryptionLevel: input.encryptionLevel,
        contentId: input.contentId,
        assetId: input.assetId,
        role: input.role,
        metadata: input.metadata,
        encryptPayload: input.encryptPayload || false,
      });

      await db.activityLog.create({
        data: {
          action: "CODE_GENERATED",
          entityType: "OptropicCode",
          entityId: code.id,
          newValues: {
            codeValue: code.codeValue,
            codeType: code.codeType,
            encrypted: input.encryptPayload || false,
          },
          userId: ctx.user.id,
        },
      });

      return code;
    }),

  /**
   * List codes for a project
   */
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new Error("Project not found or unauthorized");
      }

      return await CodeService.listCodes(input.projectId);
    }),

  /**
   * Revoke a code
   */
  revoke: protectedProcedure
    .input(
      z.object({
        codeId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const code = await db.optropicCode.findFirst({
        where: {
          id: input.codeId,
        },
        include: {
          project: true,
        },
      });

      if (!code || code.project.userId !== ctx.user.id) {
        throw new Error("Code not found or unauthorized");
      }

      const revokedCode = await CodeService.revokeCode(input.codeId);

      await db.activityLog.create({
        data: {
          action: "CODE_REVOKED",
          entityType: "OptropicCode",
          entityId: revokedCode.id,
          oldValues: {
            isActive: true,
          },
          newValues: {
            isActive: false,
          },
          userId: ctx.user.id,
        },
      });

      await db.notification.create({
        data: {
          userId: ctx.user.id,
          type: "CODE_REVOKED",
          title: "Code Revoked",
          message: `Optropic code has been revoked`,
          metadata: {
            codeId: code.id,
            codeValue: code.codeValue,
          },
        },
      });

      return revokedCode;
    }),

  /**
   * Verify a code (public endpoint)
   */
  verify: publicProcedure
    .input(
      z.object({
        codeValue: z.string(),
        deviceId: z.string().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        deviceType: z
          .enum(["MOBILE", "DESKTOP", "TABLET", "IOT_DEVICE", "SCANNER"])
          .optional(),
        geoHash: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await VerificationService.verifyCode(input);
    }),

  /**
   * Verify and decrypt an encrypted code (public endpoint)
   * Supports codes with encrypted payloads
   */
  verifyEncrypted: publicProcedure
    .input(
      z.object({
        codeValue: z.string(),
        deviceId: z.string().optional(),
        geoHash: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await CodeService.verifyEncryptedCode(
        input.codeValue,
        input.deviceId,
        input.geoHash
      );
    }),

  /**
   * Get scan history
   */
  scanHistory: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new Error("Project not found or unauthorized");
      }

      return await VerificationService.getScanHistory(
        input.projectId,
        input.limit,
        input.offset
      );
    }),

  /**
   * Get code statistics
   */
  stats: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new Error("Project not found or unauthorized");
      }

      const [codeStats, scanStats] = await Promise.all([
        CodeService.getCodeStats(input.projectId),
        VerificationService.getScanStats(input.projectId),
      ]);

      return {
        ...codeStats,
        ...scanStats,
      };
    }),

  /**
   * Detect suspicious activity
   */
  detectSuspicious: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        timeWindowHours: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.user.id,
        },
      });

      if (!project) {
        throw new Error("Project not found or unauthorized");
      }

      return await VerificationService.detectSuspiciousActivity(
        input.projectId,
        input.timeWindowHours
      );
    }),
});
