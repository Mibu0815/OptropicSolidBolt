/**
 * tRPC Router for Key Management
 */

import { z } from "zod";
import {
  GenerateKeySchema,
  ListKeysSchema,
  RotateKeySchema,
  RevokeKeySchema,
  GetActiveKeysSchema,
} from "@optropic/shared";
import { protectedProcedure, createTRPCRouter } from "../main";
import { KeyService } from "../../services/keyService";
import { db } from "../../db";

export const keysRouter = createTRPCRouter({
  /**
   * Generate a new key
   */
  generate: protectedProcedure
    .input(GenerateKeySchema)
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

      const key = await KeyService.generateKey(
        input.projectId,
        input.keyName,
        input.keyType,
        input.expiresAt ? new Date(input.expiresAt) : undefined
      );

      await db.activityLog.create({
        data: {
          action: "KEY_GENERATED",
          entityType: "Key",
          entityId: key.id,
          newValues: {
            keyName: key.keyName,
            keyType: key.type,
          },
          userId: ctx.user.id,
        },
      });

      return key;
    }),

  /**
   * List keys for a project
   */
  list: protectedProcedure
    .input(ListKeysSchema)
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

      return await KeyService.listKeys(input.projectId);
    }),

  /**
   * Rotate a key
   */
  rotate: protectedProcedure
    .input(RotateKeySchema)
    .mutation(async ({ input, ctx }) => {
      const existingKey = await db.key.findFirst({
        where: {
          id: input.keyId,
        },
        include: {
          project: true,
        },
      });

      if (!existingKey || existingKey.project.userId !== ctx.user.id) {
        throw new Error("Key not found or unauthorized");
      }

      const newKey = await KeyService.rotateKey(input.keyId);

      await db.activityLog.create({
        data: {
          action: "KEY_ROTATED",
          entityType: "Key",
          entityId: newKey.id,
          oldValues: {
            keyId: existingKey.id,
            keyName: existingKey.keyName,
          },
          newValues: {
            keyId: newKey.id,
            keyName: newKey.keyName,
          },
          userId: ctx.user.id,
        },
      });

      return newKey;
    }),

  /**
   * Revoke a key
   */
  revoke: protectedProcedure
    .input(RevokeKeySchema)
    .mutation(async ({ input, ctx }) => {
      const key = await db.key.findFirst({
        where: {
          id: input.keyId,
        },
        include: {
          project: true,
        },
      });

      if (!key || key.project.userId !== ctx.user.id) {
        throw new Error("Key not found or unauthorized");
      }

      const revokedKey = await KeyService.revokeKey(input.keyId);

      await db.activityLog.create({
        data: {
          action: "KEY_REVOKED",
          entityType: "Key",
          entityId: revokedKey.id,
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
          type: "KEY_REVOKED",
          title: "Key Revoked",
          message: `Key "${key.keyName}" has been revoked`,
          metadata: {
            keyId: key.id,
            keyName: key.keyName,
          },
        },
      });

      return revokedKey;
    }),

  /**
   * Get active keys
   */
  getActive: protectedProcedure
    .input(GetActiveKeysSchema)
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

      return await KeyService.getActiveKeys(input.projectId);
    }),
});
