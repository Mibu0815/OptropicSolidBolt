/**
 * tRPC Router for Notifications
 * Supports queries, mutations, and real-time subscriptions
 */

import { z } from "zod";
import { observable } from "@trpc/server/observable";
import { protectedProcedure, createTRPCRouter } from "../main";
import {
  NotificationService,
  notifier,
  type NotificationDTO,
} from "../../services/notificationService";

export const notificationsRouter = createTRPCRouter({
  /**
   * List notifications for the current user
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
          isRead: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await NotificationService.list({
        userId: ctx.user.id,
        limit: input?.limit,
        offset: input?.offset,
        isRead: input?.isRead,
      });
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await NotificationService.getUnreadCount(ctx.user.id);
  }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await NotificationService.markAsRead(input.id, ctx.user.id);
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return await NotificationService.markAllAsRead(ctx.user.id);
  }),

  /**
   * Create a notification (typically used internally)
   */
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["INFO", "WARNING", "CRITICAL", "SUCCESS"]),
        title: z.string(),
        message: z.string(),
        metadata: z.record(z.any()).optional(),
        link: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await NotificationService.create({
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata,
        link: input.link,
      });
    }),

  /**
   * Real-time subscription for new notifications
   * Emits events when notifications are created or updated
   */
  subscribe: protectedProcedure.subscription(({ ctx }) => {
    return observable<{
      type: "new" | "update" | "bulk_update";
      payload: NotificationDTO | { userId: number; count: number };
    }>((emit) => {
      const onNew = (notification: NotificationDTO) => {
        if (notification.userId === ctx.user.id) {
          emit.next({ type: "new", payload: notification });
        }
      };

      const onUpdate = (notification: NotificationDTO) => {
        if (notification.userId === ctx.user.id) {
          emit.next({ type: "update", payload: notification });
        }
      };

      const onBulkUpdate = (data: { userId: number; count: number }) => {
        if (data.userId === ctx.user.id) {
          emit.next({ type: "bulk_update", payload: data });
        }
      };

      notifier.on("notification:new", onNew);
      notifier.on("notification:update", onUpdate);
      notifier.on("notification:bulk_update", onBulkUpdate);

      return () => {
        notifier.off("notification:new", onNew);
        notifier.off("notification:update", onUpdate);
        notifier.off("notification:bulk_update", onBulkUpdate);
      };
    });
  }),

  /**
   * Manually trigger key expiry check (admin only)
   */
  triggerKeyExpiryCheck: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required");
      }

      await NotificationService.triggerKeyExpiry(input?.days);

      return {
        success: true,
        message: "Key expiry check completed",
      };
    }),
});
