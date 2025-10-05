/**
 * tRPC Router for Analytics & Reporting
 */

import { z } from "zod";
import {
  GetProjectAnalyticsSchema,
  DetectAnomaliesSchema,
  GetTimeSeriesSchema,
  GetComparativeSchema,
} from "@optropic/shared";
import { protectedProcedure, createTRPCRouter } from "../main";
import { AnalyticsService } from "../../services/analyticsService";
import { db } from "../../db";

export const analyticsRouter = createTRPCRouter({
  /**
   * Get dashboard overview metrics
   * Includes caching for performance
   */
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    return await AnalyticsService.getOverviewCached(ctx.user.id);
  }),

  /**
   * Get detailed project analytics
   */
  getProjectAnalytics: protectedProcedure
    .input(GetProjectAnalyticsSchema)
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

      return await AnalyticsService.getProjectAnalytics(
        input.projectId,
        input.days
      );
    }),

  /**
   * Detect anomalies in scan patterns
   */
  detectAnomalies: protectedProcedure
    .input(DetectAnomaliesSchema)
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

      return await AnalyticsService.detectAnomalies(
        input.projectId,
        input.threshold
      );
    }),

  /**
   * Manually refresh analytics cache
   */
  refreshCache: protectedProcedure.mutation(async ({ ctx }) => {
    await AnalyticsService.cacheDailySnapshot(ctx.user.id);

    return {
      success: true,
      message: "Analytics cache refreshed",
    };
  }),

  /**
   * Get global analytics (admin only)
   */
  getGlobalOverview: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    return await AnalyticsService.getOverview();
  }),

  /**
   * Get time-series data for custom date range
   */
  getTimeSeries: protectedProcedure
    .input(GetTimeSeriesSchema)
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

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const scans = await db.scan.findMany({
        where: {
          code: { projectId: input.projectId },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
          verificationSuccess: true,
          trustScore: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const dataPoints: Record<
        string,
        { date: string; value: number; count: number }
      > = {};

      scans.forEach((scan) => {
        const date = scan.createdAt.toISOString().split("T")[0];

        if (date && !dataPoints[date]) {
          dataPoints[date] = { date, value: 0, count: 0 };
        }

        if (date && input.metric === "scans") {
          dataPoints[date]!.value++;
        } else if (
          date &&
          input.metric === "verifications" &&
          scan.verificationSuccess
        ) {
          dataPoints[date]!.value++;
        } else if (date && input.metric === "trustScore" && scan.trustScore !== null) {
          dataPoints[date]!.value += scan.trustScore;
          dataPoints[date]!.count++;
        }
      });

      const result = Object.values(dataPoints).map((point) => ({
        date: point.date,
        value:
          input.metric === "trustScore" && point.count > 0
            ? Math.round(point.value / point.count)
            : point.value,
      }));

      return result;
    }),

  /**
   * Get comparative analytics across projects
   */
  getComparative: protectedProcedure
    .input(GetComparativeSchema)
    .query(async ({ input, ctx }) => {
      const projects = await db.project.findMany({
        where: {
          id: { in: input.projectIds },
          userId: ctx.user.id,
        },
      });

      if (projects.length === 0) {
        throw new Error("No authorized projects found");
      }

      const results = await Promise.all(
        projects.map(async (project) => {
          const analytics = await AnalyticsService.getProjectAnalytics(
            project.id,
            input.days
          );

          return {
            projectId: project.id,
            projectName: project.name,
            totalScans: analytics.totalScans,
            successRate: analytics.successRate,
            averageTrustScore: analytics.averageTrustScore,
            activeCodes: analytics.activeCodes,
          };
        })
      );

      return results;
    }),
});
