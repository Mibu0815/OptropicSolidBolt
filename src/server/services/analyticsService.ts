/**
 * Optropic Platform – Analytics & Reporting Service
 * -------------------------------------------------
 * Responsibilities:
 *  - Aggregate real-time metrics for dashboard
 *  - Summarize scan, key, and project data
 *  - Compute time-based trends (7d, 30d, 90d, 1y)
 *  - Cache aggregates for performance
 *  - Geographic and device analytics
 */

import { db } from "../db";

export interface AnalyticsResult {
  activeProjects: number;
  activeKeys: number;
  scansThisMonth: number;
  totalCodes: number;
  trends: {
    label: string;
    scans: number;
  }[];
  keyUsage: {
    type: string;
    count: number;
  }[];
  projectStatus: {
    status: string;
    count: number;
  }[];
}

export interface ProjectAnalytics {
  projectId: number;
  projectName: string;
  totalCodes: number;
  activeCodes: number;
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  suspiciousScans: number;
  averageTrustScore: number;
  successRate: string;
  trends: {
    label: string;
    scans: number;
    successful: number;
    failed: number;
  }[];
  geoDistribution: {
    country: string;
    scans: number;
  }[];
  deviceDistribution: {
    deviceType: string;
    scans: number;
  }[];
  topCodes: {
    codeId: number;
    codeValue: string;
    scanCount: number;
    successRate: string;
  }[];
}

/**
 * Get date object N days ago
 */
function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Generate date range labels
 */
function generateDateRange(days: number): string[] {
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    labels.push(formatDate(getDaysAgo(i)));
  }
  return labels;
}

/**
 * Main Analytics Service
 */
export const AnalyticsService = {
  /**
   * Aggregate top-level metrics for dashboard overview
   */
  async getOverview(userId?: number): Promise<AnalyticsResult> {
    const thirtyDaysAgo = getDaysAgo(30);
    const now = new Date();

    const projectFilter = userId ? { userId } : {};

    // 1️⃣ Count active projects
    const activeProjects = await db.project.count({
      where: {
        ...projectFilter,
        status: "ACTIVE",
      },
    });

    // 2️⃣ Count active keys
    const activeKeys = await db.key.count({
      where: {
        ...(userId
          ? {
              project: {
                userId,
              },
            }
          : {}),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    // 3️⃣ Count total codes
    const totalCodes = await db.optropicCode.count({
      where: userId
        ? {
            project: {
              userId,
            },
          }
        : {},
    });

    // 4️⃣ Count scan events in the last 30 days
    const scansThisMonth = await db.scan.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        ...(userId
          ? {
              code: {
                project: {
                  userId,
                },
              },
            }
          : {}),
      },
    });

    // 5️⃣ Generate time-series trend data (daily scans for 30 days)
    const recentScans = await db.scan.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        ...(userId
          ? {
              code: {
                project: {
                  userId,
                },
              },
            }
          : {}),
      },
      select: { createdAt: true },
    });

    const dateLabels = generateDateRange(30);
    const trendBuckets: Record<string, number> = {};
    dateLabels.forEach((label) => {
      trendBuckets[label] = 0;
    });

    recentScans.forEach((scan) => {
      const day = formatDate(new Date(scan.createdAt));
      if (trendBuckets[day] !== undefined) {
        trendBuckets[day]++;
      }
    });

    const trends = dateLabels.map((label) => ({
      label,
      scans: trendBuckets[label],
    }));

    // 6️⃣ Key usage distribution by type
    const keyUsageRaw = await db.key.groupBy({
      by: ["keyType"],
      where: userId
        ? {
            project: {
              userId,
            },
          }
        : {},
      _count: {
        keyType: true,
      },
    });

    const keyUsage = keyUsageRaw.map((k) => ({
      type: k.keyType,
      count: k._count.keyType,
    }));

    // 7️⃣ Project status distribution
    const projectStatusRaw = await db.project.groupBy({
      by: ["status"],
      where: projectFilter,
      _count: {
        status: true,
      },
    });

    const projectStatus = projectStatusRaw.map((p) => ({
      status: p.status,
      count: p._count.status,
    }));

    return {
      activeProjects,
      activeKeys,
      scansThisMonth,
      totalCodes,
      trends,
      keyUsage,
      projectStatus,
    };
  },

  /**
   * Get detailed analytics for a specific project
   */
  async getProjectAnalytics(
    projectId: number,
    days: number = 30
  ): Promise<ProjectAnalytics> {
    const startDate = getDaysAgo(days);

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Total codes
    const [totalCodes, activeCodes] = await Promise.all([
      db.optropicCode.count({
        where: { projectId },
      }),
      db.optropicCode.count({
        where: { projectId, isActive: true },
      }),
    ]);

    // Scan statistics
    const [totalScans, successfulScans, suspiciousScans] = await Promise.all([
      db.scan.count({
        where: {
          code: { projectId },
          createdAt: { gte: startDate },
        },
      }),
      db.scan.count({
        where: {
          code: { projectId },
          createdAt: { gte: startDate },
          verificationSuccess: true,
        },
      }),
      db.scan.count({
        where: {
          code: { projectId },
          createdAt: { gte: startDate },
          isSuspicious: true,
        },
      }),
    ]);

    const failedScans = totalScans - successfulScans;
    const successRate =
      totalScans > 0
        ? ((successfulScans / totalScans) * 100).toFixed(2)
        : "0.00";

    // Average trust score
    const avgTrustScoreResult = await db.scan.aggregate({
      where: {
        code: { projectId },
        createdAt: { gte: startDate },
        trustScore: { not: null },
      },
      _avg: {
        trustScore: true,
      },
    });

    const averageTrustScore = avgTrustScoreResult._avg.trustScore || 0;

    // Time-series trends (daily breakdown)
    const scanEvents = await db.scan.findMany({
      where: {
        code: { projectId },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        verificationSuccess: true,
      },
    });

    const dateLabels = generateDateRange(days);
    const trendData: Record<
      string,
      { scans: number; successful: number; failed: number }
    > = {};

    dateLabels.forEach((label) => {
      trendData[label] = { scans: 0, successful: 0, failed: 0 };
    });

    scanEvents.forEach((scan) => {
      const day = formatDate(new Date(scan.createdAt));
      if (trendData[day]) {
        trendData[day].scans++;
        if (scan.verificationSuccess) {
          trendData[day].successful++;
        } else {
          trendData[day].failed++;
        }
      }
    });

    const trends = dateLabels.map((label) => ({
      label,
      scans: trendData[label].scans,
      successful: trendData[label].successful,
      failed: trendData[label].failed,
    }));

    // Geographic distribution
    const geoData = await db.scan.groupBy({
      by: ["country"],
      where: {
        code: { projectId },
        createdAt: { gte: startDate },
        country: { not: null },
      },
      _count: {
        country: true,
      },
      orderBy: {
        _count: {
          country: "desc",
        },
      },
      take: 10,
    });

    const geoDistribution = geoData.map((g) => ({
      country: g.country || "Unknown",
      scans: g._count.country,
    }));

    // Device type distribution
    const deviceData = await db.scan.groupBy({
      by: ["deviceType"],
      where: {
        code: { projectId },
        createdAt: { gte: startDate },
        deviceType: { not: null },
      },
      _count: {
        deviceType: true,
      },
    });

    const deviceDistribution = deviceData.map((d) => ({
      deviceType: d.deviceType || "Unknown",
      scans: d._count.deviceType,
    }));

    // Top performing codes
    const topCodesData = await db.scan.groupBy({
      by: ["codeId"],
      where: {
        code: { projectId },
        createdAt: { gte: startDate },
      },
      _count: {
        codeId: true,
      },
      orderBy: {
        _count: {
          codeId: "desc",
        },
      },
      take: 10,
    });

    const topCodes = await Promise.all(
      topCodesData.map(async (item) => {
        const code = await db.optropicCode.findUnique({
          where: { id: item.codeId },
          select: { id: true, codeValue: true },
        });

        const successCount = await db.scan.count({
          where: {
            codeId: item.codeId,
            verificationSuccess: true,
            createdAt: { gte: startDate },
          },
        });

        const scanCount = item._count.codeId;
        const codeSuccessRate =
          scanCount > 0
            ? ((successCount / scanCount) * 100).toFixed(2)
            : "0.00";

        return {
          codeId: code?.id || item.codeId,
          codeValue: code?.codeValue || "Unknown",
          scanCount,
          successRate: codeSuccessRate,
        };
      })
    );

    return {
      projectId: project.id,
      projectName: project.name,
      totalCodes,
      activeCodes,
      totalScans,
      successfulScans,
      failedScans,
      suspiciousScans,
      averageTrustScore,
      successRate,
      trends,
      geoDistribution,
      deviceDistribution,
      topCodes,
    };
  },

  /**
   * Cache analytics snapshot for performance
   * Run this via cron job daily
   */
  async cacheDailySnapshot(userId?: number): Promise<void> {
    const today = formatDate(new Date());
    const snapshot = await this.getOverview(userId);

    const cacheKey = userId ? `overview_user_${userId}` : "overview_global";

    await db.analyticsCache.upsert({
      where: { cacheKey },
      update: {
        data: snapshot,
        updatedAt: new Date(),
      },
      create: {
        cacheKey,
        cacheType: "OVERVIEW",
        data: snapshot,
      },
    });
  },

  /**
   * Get cached analytics (with TTL check)
   */
  async getCachedOverview(
    userId?: number,
    maxAgeMinutes: number = 5
  ): Promise<AnalyticsResult | null> {
    const cacheKey = userId ? `overview_user_${userId}` : "overview_global";

    const cached = await db.analyticsCache.findUnique({
      where: { cacheKey },
    });

    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.updatedAt.getTime();
    const maxAge = maxAgeMinutes * 60 * 1000;

    if (age > maxAge) {
      return null;
    }

    return cached.data as AnalyticsResult;
  },

  /**
   * Get analytics with automatic caching
   */
  async getOverviewCached(userId?: number): Promise<AnalyticsResult> {
    const cached = await this.getCachedOverview(userId, 5);

    if (cached) {
      return cached;
    }

    const fresh = await this.getOverview(userId);

    this.cacheDailySnapshot(userId).catch((err) => {
      console.error("Failed to cache analytics:", err);
    });

    return fresh;
  },

  /**
   * Get anomaly detection insights
   */
  async detectAnomalies(
    projectId: number,
    threshold: number = 2.0
  ): Promise<{
    hasAnomaly: boolean;
    currentRate: number;
    averageRate: number;
    deviation: number;
  }> {
    const last24h = getDaysAgo(1);
    const last7d = getDaysAgo(7);

    const [scansLast24h, scansLast7d] = await Promise.all([
      db.scan.count({
        where: {
          code: { projectId },
          createdAt: { gte: last24h },
        },
      }),
      db.scan.count({
        where: {
          code: { projectId },
          createdAt: { gte: last7d, lt: last24h },
        },
      }),
    ]);

    const currentRate = scansLast24h;
    const averageRate = scansLast7d / 6;

    const deviation = averageRate > 0 ? currentRate / averageRate : 0;
    const hasAnomaly = deviation > threshold;

    return {
      hasAnomaly,
      currentRate,
      averageRate: Math.round(averageRate),
      deviation: parseFloat(deviation.toFixed(2)),
    };
  },
};
