import { z } from "zod";

export const NotificationTypeSchema = z.enum([
  "KEY_EXPIRING",
  "KEY_EXPIRED",
  "KEY_REVOKED",
  "ANOMALY_DETECTED",
  "PROJECT_CREATED",
  "SCAN_THRESHOLD_REACHED",
  "SYSTEM_ALERT",
]);

export const NotificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  link: z.string().nullable().optional(),
  isRead: z.boolean(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
});

export const GetNotificationsSchema = z.object({
  limit: z.number().optional().default(50),
  unreadOnly: z.boolean().optional().default(false),
});

export const MarkNotificationReadSchema = z.object({
  notificationId: z.number(),
});

export const MarkAllNotificationsReadSchema = z.object({
  userId: z.number().optional(),
});

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type GetNotificationsInput = z.infer<typeof GetNotificationsSchema>;
export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;
export type MarkAllNotificationsReadInput = z.infer<typeof MarkAllNotificationsReadSchema>;
