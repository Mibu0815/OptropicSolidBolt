import { z } from "zod";
export declare const AnalyticsOverviewSchema: z.ZodObject<{
    activeProjects: z.ZodNumber;
    activeKeys: z.ZodNumber;
    scansThisMonth: z.ZodNumber;
    totalCodes: z.ZodNumber;
    totalScans: z.ZodNumber;
    successRate: z.ZodNumber;
    averageTrustScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    activeProjects: number;
    activeKeys: number;
    scansThisMonth: number;
    totalCodes: number;
    totalScans: number;
    successRate: number;
    averageTrustScore: number;
}, {
    activeProjects: number;
    activeKeys: number;
    scansThisMonth: number;
    totalCodes: number;
    totalScans: number;
    successRate: number;
    averageTrustScore: number;
}>;
export declare const GetProjectAnalyticsSchema: z.ZodObject<{
    projectId: z.ZodNumber;
    days: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    projectId: number;
    days: number;
}, {
    projectId: number;
    days?: number | undefined;
}>;
export declare const ProjectAnalyticsSchema: z.ZodObject<{
    totalScans: z.ZodNumber;
    successRate: z.ZodNumber;
    averageTrustScore: z.ZodNumber;
    activeCodes: z.ZodNumber;
    scansByDay: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        scans: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        date: string;
        scans: number;
    }, {
        date: string;
        scans: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalScans: number;
    successRate: number;
    averageTrustScore: number;
    activeCodes: number;
    scansByDay: {
        date: string;
        scans: number;
    }[];
}, {
    totalScans: number;
    successRate: number;
    averageTrustScore: number;
    activeCodes: number;
    scansByDay: {
        date: string;
        scans: number;
    }[];
}>;
export declare const DetectAnomaliesSchema: z.ZodObject<{
    projectId: z.ZodNumber;
    threshold: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    projectId: number;
    threshold: number;
}, {
    projectId: number;
    threshold?: number | undefined;
}>;
export declare const AnomalySchema: z.ZodObject<{
    date: z.ZodString;
    value: z.ZodNumber;
    average: z.ZodNumber;
    standardDeviation: z.ZodNumber;
    isAnomaly: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    value: number;
    date: string;
    average: number;
    standardDeviation: number;
    isAnomaly: boolean;
}, {
    value: number;
    date: string;
    average: number;
    standardDeviation: number;
    isAnomaly: boolean;
}>;
export declare const GetTimeSeriesSchema: z.ZodObject<{
    projectId: z.ZodNumber;
    startDate: z.ZodString;
    endDate: z.ZodString;
    metric: z.ZodEnum<["scans", "verifications", "trustScore"]>;
}, "strip", z.ZodTypeAny, {
    projectId: number;
    startDate: string;
    endDate: string;
    metric: "scans" | "verifications" | "trustScore";
}, {
    projectId: number;
    startDate: string;
    endDate: string;
    metric: "scans" | "verifications" | "trustScore";
}>;
export declare const TimeSeriesDataPointSchema: z.ZodObject<{
    date: z.ZodString;
    value: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    value: number;
    date: string;
}, {
    value: number;
    date: string;
}>;
export declare const GetComparativeSchema: z.ZodObject<{
    projectIds: z.ZodArray<z.ZodNumber, "many">;
    days: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    days: number;
    projectIds: number[];
}, {
    projectIds: number[];
    days?: number | undefined;
}>;
export declare const ComparativeAnalyticsSchema: z.ZodObject<{
    projectId: z.ZodNumber;
    projectName: z.ZodString;
    totalScans: z.ZodNumber;
    successRate: z.ZodNumber;
    averageTrustScore: z.ZodNumber;
    activeCodes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalScans: number;
    successRate: number;
    averageTrustScore: number;
    projectId: number;
    activeCodes: number;
    projectName: string;
}, {
    totalScans: number;
    successRate: number;
    averageTrustScore: number;
    projectId: number;
    activeCodes: number;
    projectName: string;
}>;
export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;
export type GetProjectAnalyticsInput = z.infer<typeof GetProjectAnalyticsSchema>;
export type ProjectAnalytics = z.infer<typeof ProjectAnalyticsSchema>;
export type DetectAnomaliesInput = z.infer<typeof DetectAnomaliesSchema>;
export type Anomaly = z.infer<typeof AnomalySchema>;
export type GetTimeSeriesInput = z.infer<typeof GetTimeSeriesSchema>;
export type TimeSeriesDataPoint = z.infer<typeof TimeSeriesDataPointSchema>;
export type GetComparativeInput = z.infer<typeof GetComparativeSchema>;
export type ComparativeAnalytics = z.infer<typeof ComparativeAnalyticsSchema>;
//# sourceMappingURL=analytics.d.ts.map