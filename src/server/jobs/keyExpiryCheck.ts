/**
 * Scheduled Job: Key Expiry Check
 * --------------------------------
 * Checks for keys expiring soon and creates notifications
 * Run this daily via cron job or scheduler
 */

import { NotificationService } from "../services/notificationService";

/**
 * Check for expiring keys and notify owners
 */
export async function runKeyExpiryCheck(daysAhead: number = 7): Promise<void> {
  try {
    console.log(
      `[KeyExpiryCheck] Running check for keys expiring in ${daysAhead} days...`
    );

    await NotificationService.triggerKeyExpiry(daysAhead);

    console.log("[KeyExpiryCheck] Check completed successfully");
  } catch (error) {
    console.error("[KeyExpiryCheck] Failed:", error);

    await NotificationService.triggerSystem(
      `Key expiry sweep failed: ${(error as Error).message}`,
      "WARNING"
    ).catch((err) => {
      console.error("[KeyExpiryCheck] Failed to send error notification:", err);
    });
  }
}

/**
 * Clean up old read notifications
 */
export async function runNotificationCleanup(
  daysOld: number = 90
): Promise<void> {
  try {
    console.log(
      `[NotificationCleanup] Cleaning up read notifications older than ${daysOld} days...`
    );

    const result = await NotificationService.deleteOld(daysOld);

    console.log(
      `[NotificationCleanup] Deleted ${result.count} old notifications`
    );
  } catch (error) {
    console.error("[NotificationCleanup] Failed:", error);
  }
}

/**
 * Initialize scheduled jobs
 * Call this on server startup
 */
export function initializeScheduledJobs(): void {
  console.log("[Jobs] Initializing scheduled jobs...");

  // Run key expiry check daily at 2 AM (if server is always running)
  const DAILY_MS = 24 * 60 * 60 * 1000;

  // Initial run after 1 minute
  setTimeout(() => {
    runKeyExpiryCheck(7);
  }, 60 * 1000);

  // Then run daily
  setInterval(() => {
    runKeyExpiryCheck(7);
  }, DAILY_MS);

  // Cleanup old notifications weekly (Sunday at 3 AM)
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  nextSunday.setHours(3, 0, 0, 0);

  const msUntilNextSunday = nextSunday.getTime() - now.getTime();

  setTimeout(() => {
    runNotificationCleanup(90);

    // Then run weekly
    setInterval(() => {
      runNotificationCleanup(90);
    }, 7 * DAILY_MS);
  }, msUntilNextSunday);

  console.log("[Jobs] Scheduled jobs initialized");
  console.log(`[Jobs] - Key expiry check: Daily`);
  console.log(`[Jobs] - Notification cleanup: Weekly (Sundays at 3 AM)`);
}
