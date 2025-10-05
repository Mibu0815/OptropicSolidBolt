import { z } from "zod";
export declare const NotificationTypeSchema: z.ZodEnum<["KEY_EXPIRING", "KEY_EXPIRED", "KEY_REVOKED", "ANOMALY_DETECTED", "PROJECT_CREATED", "SCAN_THRESHOLD_REACHED", "SYSTEM_ALERT"]>;
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodNumber;
    userId: z.ZodNumber;
    type: z.ZodEnum<["KEY_EXPIRING", "KEY_EXPIRED", "KEY_REVOKED", "ANOMALY_DETECTED", "PROJECT_CREATED", "SCAN_THRESHOLD_REACHED", "SYSTEM_ALERT"]>;
    title: z.ZodString;
    message: z.ZodString;
    link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isRead: z.ZodBoolean;
    metadata: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "KEY_EXPIRING" | "KEY_EXPIRED" | "KEY_REVOKED" | "ANOMALY_DETECTED" | "PROJECT_CREATED" | "SCAN_THRESHOLD_REACHED" | "SYSTEM_ALERT";
    id: number;
    userId: number;
    createdAt: Date;
    title: string;
    isRead: boolean;
    metadata: Record<string, unknown> | null;
    link?: string | null | undefined;
}, {
    message: string;
    type: "KEY_EXPIRING" | "KEY_EXPIRED" | "KEY_REVOKED" | "ANOMALY_DETECTED" | "PROJECT_CREATED" | "SCAN_THRESHOLD_REACHED" | "SYSTEM_ALERT";
    id: number;
    userId: number;
    createdAt: Date;
    title: string;
    isRead: boolean;
    metadata: Record<string, unknown> | null;
    link?: string | null | undefined;
}>;
export declare const GetNotificationsSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    unreadOnly: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    unreadOnly: boolean;
}, {
    limit?: number | undefined;
    unreadOnly?: boolean | undefined;
}>;
export declare const MarkNotificationReadSchema: z.ZodObject<{
    notificationId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    notificationId: number;
}, {
    notificationId: number;
}>;
export declare const MarkAllNotificationsReadSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId?: number | undefined;
}, {
    userId?: number | undefined;
}>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type GetNotificationsInput = z.infer<typeof GetNotificationsSchema>;
export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;
export type MarkAllNotificationsReadInput = z.infer<typeof MarkAllNotificationsReadSchema>;
//# sourceMappingURL=notifications.d.ts.map