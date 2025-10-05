import { z } from "zod";
export const AnalyticsOverviewSchema = z.object({
    activeProjects: z.number(),
    activeKeys: z.number(),
    scansThisMonth: z.number(),
    totalCodes: z.number(),
    totalScans: z.number(),
    successRate: z.number(),
    averageTrustScore: z.number(),
});
export const GetProjectAnalyticsSchema = z.object({
    projectId: z.number(),
    days: z.number().optional().default(30),
});
export const ProjectAnalyticsSchema = z.object({
    totalScans: z.number(),
    successRate: z.number(),
    averageTrustScore: z.number(),
    activeCodes: z.number(),
    scansByDay: z.array(z.object({
        date: z.string(),
        scans: z.number(),
    })),
});
export const DetectAnomaliesSchema = z.object({
    projectId: z.number(),
    threshold: z.number().optional().default(2.0),
});
export const AnomalySchema = z.object({
    date: z.string(),
    value: z.number(),
    average: z.number(),
    standardDeviation: z.number(),
    isAnomaly: z.boolean(),
});
export const GetTimeSeriesSchema = z.object({
    projectId: z.number(),
    startDate: z.string(),
    endDate: z.string(),
    metric: z.enum(["scans", "verifications", "trustScore"]),
});
export const TimeSeriesDataPointSchema = z.object({
    date: z.string(),
    value: z.number(),
});
export const GetComparativeSchema = z.object({
    projectIds: z.array(z.number()),
    days: z.number().optional().default(30),
});
export const ComparativeAnalyticsSchema = z.object({
    projectId: z.number(),
    projectName: z.string(),
    totalScans: z.number(),
    successRate: z.number(),
    averageTrustScore: z.number(),
    activeCodes: z.number(),
});
