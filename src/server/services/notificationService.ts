/**
 * Optropic Platform – Notification Service
 * ----------------------------------------
 * Responsibilities:
 *  - Persist notifications in Supabase
 *  - Publish real-time events via event emitter
 *  - Provide helpers for common triggers (key expiry, failed verify, revoked usage)
 *  - Support multiple notification types and categories
 */

import { EventEmitter } from "events";
import { db } from "../db";

export type NotificationCategory =
  | "SECURITY"
  | "KEY_MANAGEMENT"
  | "SCAN"
  | "PROJECT"
  | "SYSTEM"
  | "CODE_REVOKED"
  | "KEY_ROTATED"
  | "KEY_REVOKED"
  | "KEY_EXPIRING"
  | "VERIFICATION_FAILED";

export type NotificationType = "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";

export interface CreateNotificationInput {
  userId?: number;
  category?: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  link?: string;
}

export interface NotificationDTO {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata: any;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

class Notifier extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }
}

export const notifier = new Notifier();

/**
 * Main Notification Service
 */
export const NotificationService = {
  /**
   * Create a new notification and emit real-time event
   */
  async create(input: CreateNotificationInput): Promise<NotificationDTO> {
    const userId =
      input.userId ?? (await this.resolveSystemAdminUserId());

    const notification = await db.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata || {},
        link: input.link || null,
        isRead: false,
      },
    });

    notifier.emit("notification:new", notification);

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      link: notification.link,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: number, userId: number): Promise<NotificationDTO> {
    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error("Notification not found or unauthorized");
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    notifier.emit("notification:update", updated);

    return {
      id: updated.id,
      userId: updated.userId,
      type: updated.type as NotificationType,
      title: updated.title,
      message: updated.message,
      metadata: updated.metadata,
      link: updated.link,
      isRead: updated.isRead,
      createdAt: updated.createdAt,
    };
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number): Promise<{ count: number }> {
    const result = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    notifier.emit("notification:bulk_update", { userId, count: result.count });

    return { count: result.count };
  },

  /**
   * List notifications for a user
   */
  async list(opts?: {
    userId?: number;
    limit?: number;
    offset?: number;
    isRead?: boolean;
  }): Promise<{ notifications: NotificationDTO[]; total: number }> {
    const where = {
      ...(opts?.userId ? { userId: opts.userId } : {}),
      ...(opts?.isRead !== undefined ? { isRead: opts.isRead } : {}),
    };

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: opts?.limit ?? 50,
        skip: opts?.offset ?? 0,
      }),
      db.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        metadata: n.metadata,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      total,
    };
  },

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: number): Promise<number> {
    return await db.notification.count({
      where: { userId, isRead: false },
    });
  },

  /**
   * Delete old notifications (cleanup)
   */
  async deleteOld(daysOld: number = 90): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    return { count: result.count };
  },

  // ---- Common Triggers ------------------------------------------------------

  /**
   * Trigger: Key expires soon (< N days)
   */
  async triggerKeyExpiry(days: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const expiringKeys = await db.key.findMany({
      where: {
        isActive: true,
        expiresAt: {
          not: null,
          lte: cutoffDate,
          gt: new Date(),
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    });

    for (const key of expiringKeys) {
      const daysUntilExpiry = Math.ceil(
        (new Date(key.expiresAt!).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      await this.create({
        userId: key.project.userId,
        type: "WARNING",
        title: "Key Expiring Soon",
        message: `Key "${key.keyName}" in project "${key.project.name}" expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}.`,
        metadata: {
          keyId: key.id,
          keyName: key.keyName,
          projectId: key.project.id,
          projectName: key.project.name,
          expiresAt: key.expiresAt,
          daysRemaining: daysUntilExpiry,
        },
        link: `/keys`,
      });
    }
  },

  /**
   * Trigger: Verification failed
   */
  async triggerFailedVerification(
    codeId: number,
    userId: number,
    details?: string
  ): Promise<void> {
    const code = await db.optropicCode.findUnique({
      where: { id: codeId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!code) return;

    await this.create({
      userId,
      type: "WARNING",
      title: "Verification Failed",
      message: `Code verification failed in project "${code.project.name}"${details ? `: ${details}` : ""}.`,
      metadata: {
        codeId: code.id,
        codeValue: code.codeValue.substring(0, 20) + "...",
        projectId: code.project.id,
        projectName: code.project.name,
        details,
      },
      link: `/projects/${code.project.id}`,
    });
  },

  /**
   * Trigger: Revoked code was scanned
   */
  async triggerRevokedCodeUsage(
    codeId: number,
    userId: number
  ): Promise<void> {
    const code = await db.optropicCode.findUnique({
      where: { id: codeId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!code) return;

    await this.create({
      userId,
      type: "CRITICAL",
      title: "Revoked Code Scanned",
      message: `A revoked code was scanned in project "${code.project.name}". This may indicate a security issue.`,
      metadata: {
        codeId: code.id,
        codeValue: code.codeValue.substring(0, 20) + "...",
        projectId: code.project.id,
        projectName: code.project.name,
        isActive: code.isActive,
      },
      link: `/projects/${code.project.id}`,
    });
  },

  /**
   * Trigger: Suspicious scan activity detected
   */
  async triggerSuspiciousActivity(
    projectId: number,
    userId: number,
    details: {
      suspiciousScans: number;
      timeWindow: string;
      suspiciousIPs?: Array<{ ip: string; count: number }>;
    }
  ): Promise<void> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (!project) return;

    const ipList = details.suspiciousIPs
      ? details.suspiciousIPs
          .slice(0, 3)
          .map((item) => `${item.ip} (${item.count} scans)`)
          .join(", ")
      : "";

    await this.create({
      userId,
      type: "CRITICAL",
      title: "Suspicious Activity Detected",
      message: `${details.suspiciousScans} suspicious scans detected in project "${project.name}" over ${details.timeWindow}.${ipList ? ` Top IPs: ${ipList}` : ""}`,
      metadata: {
        projectId,
        projectName: project.name,
        ...details,
      },
      link: `/projects/${projectId}`,
    });
  },

  /**
   * Trigger: Key rotated
   */
  async triggerKeyRotated(
    oldKeyId: number,
    newKeyId: number,
    userId: number
  ): Promise<void> {
    const [oldKey, newKey] = await Promise.all([
      db.key.findUnique({
        where: { id: oldKeyId },
        include: { project: { select: { name: true } } },
      }),
      db.key.findUnique({
        where: { id: newKeyId },
      }),
    ]);

    if (!oldKey || !newKey) return;

    await this.create({
      userId,
      type: "INFO",
      title: "Key Rotated",
      message: `Key "${oldKey.keyName}" has been rotated. New key ID: ${newKeyId}.`,
      metadata: {
        oldKeyId,
        oldKeyName: oldKey.keyName,
        newKeyId,
        newKeyName: newKey.keyName,
        projectName: oldKey.project.name,
      },
      link: `/keys`,
    });
  },

  /**
   * Trigger: System health/info message
   */
  async triggerSystem(
    message: string,
    type: NotificationType = "INFO",
    userId?: number
  ): Promise<void> {
    await this.create({
      userId,
      type,
      title: "System Notification",
      message,
      metadata: {
        source: "system",
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Trigger: High verification failure rate
   */
  async triggerHighFailureRate(
    projectId: number,
    userId: number,
    failureRate: number,
    timeWindow: string
  ): Promise<void> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (!project) return;

    await this.create({
      userId,
      type: "WARNING",
      title: "High Verification Failure Rate",
      message: `Project "${project.name}" has a ${failureRate.toFixed(1)}% failure rate over ${timeWindow}.`,
      metadata: {
        projectId,
        projectName: project.name,
        failureRate,
        timeWindow,
      },
      link: `/projects/${projectId}`,
    });
  },

  // ---- Helpers --------------------------------------------------------------

  /**
   * Resolve system admin user ID
   */
  async resolveSystemAdminUserId(): Promise<number> {
    const admin = await db.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { id: "asc" },
    });

    if (admin) {
      return admin.id;
    }

    return await this.ensureSystemUser();
  },

  /**
   * Ensure system user exists
   */
  async ensureSystemUser(): Promise<number> {
    const existingUser = await db.user.findUnique({
      where: { email: "system@optropic.local" },
    });

    if (existingUser) {
      return existingUser.id;
    }

    const systemUser = await db.user.create({
      data: {
        email: "system@optropic.local",
        password: "disabled",
        role: "ADMIN",
        tenantId: null,
      },
    });

    return systemUser.id;
  },
};
