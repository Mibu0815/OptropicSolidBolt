# Analytics & Reporting Guide

## Overview

The Optropic Platform analytics system provides real-time insights into code usage, verification patterns, and project health. Built with performance and scalability in mind, it includes automatic caching and supports multiple time ranges.

## Features

### Dashboard Metrics
- **Active Projects**: Count of projects with status "ACTIVE"
- **Active Keys**: Non-expired, active cryptographic keys
- **Scans This Month**: Total verification attempts in last 30 days
- **Total Codes**: Count of all generated Optropic codes
- **Time-Series Trends**: Daily scan volumes over 30 days
- **Key Usage Distribution**: Breakdown by key type (SIGNING, ENCRYPTION, etc.)
- **Project Status**: Distribution across ACTIVE, PAUSED, ARCHIVED states

### Project Analytics
- Total and active code counts
- Scan statistics (total, successful, failed, suspicious)
- Success rates and trust scores
- Geographic distribution (top 10 countries)
- Device type breakdown
- Top performing codes
- Daily trends with success/failure breakdown

### Advanced Features
- **Anomaly Detection**: Identifies unusual scan spikes
- **Comparative Analytics**: Compare multiple projects
- **Custom Time-Series**: Query any metric over custom date ranges
- **Automatic Caching**: 5-minute TTL for dashboard queries

## API Reference

### `analytics.getOverview`
Get dashboard overview with automatic caching.

**Type**: `query`
**Auth**: Required

```typescript
const overview = await trpc.analytics.getOverview.query();

// Returns:
{
  activeProjects: 12,
  activeKeys: 48,
  scansThisMonth: 1834,
  totalCodes: 1275,
  trends: [
    { label: "2024-10-05", scans: 42 },
    { label: "2024-10-06", scans: 58 },
    // ... 30 days
  ],
  keyUsage: [
    { type: "SIGNING", count: 21 },
    { type: "ENCRYPTION", count: 27 }
  ],
  projectStatus: [
    { status: "ACTIVE", count: 10 },
    { status: "PAUSED", count: 2 }
  ]
}
```

---

### `analytics.getProjectAnalytics`
Get detailed analytics for a specific project.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
  days?: number; // Default: 30
}

Output: {
  projectId: number;
  projectName: string;
  totalCodes: number;
  activeCodes: number;
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  suspiciousScans: number;
  averageTrustScore: number;
  successRate: string; // e.g., "95.50"
  trends: Array<{
    label: string;
    scans: number;
    successful: number;
    failed: number;
  }>;
  geoDistribution: Array<{
    country: string;
    scans: number;
  }>;
  deviceDistribution: Array<{
    deviceType: string;
    scans: number;
  }>;
  topCodes: Array<{
    codeId: number;
    codeValue: string;
    scanCount: number;
    successRate: string;
  }>;
}
```

**Example**:
```typescript
const analytics = await trpc.analytics.getProjectAnalytics.query({
  projectId: 1,
  days: 30
});

console.log(`Success Rate: ${analytics.successRate}%`);
console.log(`Avg Trust Score: ${analytics.averageTrustScore.toFixed(1)}/100`);
console.log(`Top Country: ${analytics.geoDistribution[0]?.country}`);
```

---

### `analytics.detectAnomalies`
Detect unusual scan patterns.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
  threshold?: number; // Default: 2.0 (200% of average)
}

Output: {
  hasAnomaly: boolean;
  currentRate: number;  // Scans in last 24h
  averageRate: number;  // Daily average over last 7d
  deviation: number;    // Ratio: currentRate / averageRate
}
```

**Example**:
```typescript
const anomaly = await trpc.analytics.detectAnomalies.query({
  projectId: 1,
  threshold: 2.5
});

if (anomaly.hasAnomaly) {
  console.log(`⚠️ Anomaly Detected!`);
  console.log(`Current: ${anomaly.currentRate} scans`);
  console.log(`Average: ${anomaly.averageRate} scans`);
  console.log(`Deviation: ${anomaly.deviation}x normal`);
}
```

---

### `analytics.refreshCache`
Manually refresh analytics cache.

**Type**: `mutation`
**Auth**: Required

```typescript
await trpc.analytics.refreshCache.mutate();
// Returns: { success: true, message: "Analytics cache refreshed" }
```

---

### `analytics.getGlobalOverview`
Get system-wide analytics (admin only).

**Type**: `query`
**Auth**: Required (Admin role)

```typescript
// Same structure as getOverview, but aggregates all users
const global = await trpc.analytics.getGlobalOverview.query();
```

---

### `analytics.getTimeSeries`
Get custom time-series data.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
  startDate: string; // ISO format: "2024-10-01"
  endDate: string;   // ISO format: "2024-10-31"
  metric: "scans" | "verifications" | "trustScore";
}

Output: Array<{
  date: string;
  value: number;
}>
```

**Example**:
```typescript
const timeSeries = await trpc.analytics.getTimeSeries.query({
  projectId: 1,
  startDate: "2024-09-01",
  endDate: "2024-09-30",
  metric: "trustScore"
});

// Returns daily average trust scores
// [
//   { date: "2024-09-01", value: 95 },
//   { date: "2024-09-02", value: 98 },
//   ...
// ]
```

---

### `analytics.getComparative`
Compare analytics across multiple projects.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectIds: number[];
  days?: number; // Default: 30
}

Output: Array<{
  projectId: number;
  projectName: string;
  totalScans: number;
  successRate: string;
  averageTrustScore: number;
  activeCodes: number;
}>
```

**Example**:
```typescript
const comparison = await trpc.analytics.getComparative.query({
  projectIds: [1, 2, 3],
  days: 30
});

comparison.forEach(project => {
  console.log(`${project.projectName}: ${project.successRate}% success`);
});
```

## Caching Strategy

### Automatic Caching
The `getOverview` endpoint uses automatic caching with a 5-minute TTL:
- First request: Fetches fresh data, stores in cache
- Subsequent requests: Returns cached data if < 5 minutes old
- Background refresh: Cache updated asynchronously

### Manual Cache Control
```typescript
// Force refresh
await trpc.analytics.refreshCache.mutate();

// Then fetch fresh data
const overview = await trpc.analytics.getOverview.query();
```

### Cache Storage
Cached data stored in `analytics_cache` table:
```sql
model AnalyticsCache {
  id         Int      @id @default(autoincrement())
  cacheKey   String   @unique
  cacheType  String
  data       Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Performance Considerations

### Query Optimization
- Indexes on `createdAt`, `projectId`, `codeId`, `country`, `deviceType`
- Aggregation queries use Prisma's `groupBy` for efficiency
- Geographic data limited to top 10 countries
- Top codes limited to 10 results

### Scalability
For high-volume deployments:
1. **Enable caching**: Use `getOverview` (cached) instead of raw queries
2. **Reduce time ranges**: Query smaller date ranges when possible
3. **Batch updates**: Refresh cache via cron job during off-peak hours
4. **Database optimization**: Add composite indexes if needed

```sql
-- Recommended indexes for large datasets
CREATE INDEX idx_scans_project_date ON scans("codeId", "createdAt");
CREATE INDEX idx_scans_country ON scans("country", "createdAt");
CREATE INDEX idx_scans_device ON scans("deviceType", "createdAt");
```

## Dashboard Integration

### React Component Example
```typescript
import { trpc } from './trpc';

function DashboardOverview() {
  const { data: overview, isLoading } = trpc.analytics.getOverview.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        title="Active Projects"
        value={overview.activeProjects}
        icon={<ProjectIcon />}
      />
      <MetricCard
        title="Active Keys"
        value={overview.activeKeys}
        icon={<KeyIcon />}
      />
      <MetricCard
        title="Scans This Month"
        value={overview.scansThisMonth}
        icon={<ScanIcon />}
      />
      <MetricCard
        title="Total Codes"
        value={overview.totalCodes}
        icon={<CodeIcon />}
      />
    </div>
  );
}
```

### Chart Integration (Recharts)
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function TrendChart() {
  const { data } = trpc.analytics.getOverview.useQuery();

  return (
    <LineChart width={600} height={300} data={data?.trends}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="label" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="scans" stroke="#8884d8" />
    </LineChart>
  );
}
```

## Scheduled Jobs

### Daily Cache Refresh
Set up a cron job to refresh analytics cache:

```typescript
// scripts/refresh-analytics.ts
import { AnalyticsService } from './server/services/analyticsService';

async function refreshAnalytics() {
  console.log('Refreshing analytics cache...');

  // Refresh global cache
  await AnalyticsService.cacheDailySnapshot();

  // Optionally: refresh per-user caches
  const users = await db.user.findMany({ where: { isActive: true } });
  for (const user of users) {
    await AnalyticsService.cacheDailySnapshot(user.id);
  }

  console.log('Analytics cache refreshed successfully');
}

refreshAnalytics().catch(console.error);
```

**Cron schedule** (run daily at 2 AM):
```bash
0 2 * * * node dist/scripts/refresh-analytics.js
```

## Anomaly Detection

### Use Cases
1. **DDoS Detection**: Unusual scan spikes from single IP
2. **Bot Activity**: Repeated failed verifications
3. **Key Compromise**: Sudden drop in trust scores
4. **Geographic Anomalies**: Scans from unexpected regions

### Alert Configuration
```typescript
// Check for anomalies every hour
async function checkAnomalies() {
  const projects = await db.project.findMany({
    where: { status: "ACTIVE" }
  });

  for (const project of projects) {
    const anomaly = await trpc.analytics.detectAnomalies.query({
      projectId: project.id,
      threshold: 2.5
    });

    if (anomaly.hasAnomaly) {
      // Send alert
      await sendAlert({
        projectId: project.id,
        projectName: project.name,
        currentRate: anomaly.currentRate,
        averageRate: anomaly.averageRate,
        deviation: anomaly.deviation
      });
    }
  }
}
```

## Best Practices

### 1. Use Cached Endpoints
```typescript
// ✅ Good: Uses cache
const overview = await trpc.analytics.getOverview.query();

// ❌ Avoid: Bypasses cache (unless you need real-time data)
const overview = await AnalyticsService.getOverview(userId);
```

### 2. Choose Appropriate Time Ranges
```typescript
// ✅ Good: Reasonable range
const analytics = await trpc.analytics.getProjectAnalytics.query({
  projectId: 1,
  days: 30
});

// ⚠️ Caution: Large range may be slow
const analytics = await trpc.analytics.getProjectAnalytics.query({
  projectId: 1,
  days: 365
});
```

### 3. Monitor Cache Hit Rates
```typescript
// Add logging to track cache effectiveness
const cached = await AnalyticsService.getCachedOverview(userId);
if (cached) {
  console.log('Cache hit');
} else {
  console.log('Cache miss - fetching fresh data');
}
```

### 4. Handle Large Datasets
```typescript
// For projects with millions of scans, consider:
// - Aggregating to hourly/daily buckets
// - Sampling large result sets
// - Using database views for complex queries
```

## Troubleshooting

### Slow Queries
```typescript
// Add indexes
CREATE INDEX idx_scans_composite ON scans("codeId", "createdAt", "verificationSuccess");

// Limit result sets
const analytics = await trpc.analytics.getProjectAnalytics.query({
  projectId: 1,
  days: 7  // Reduce from 30 days
});
```

### Cache Issues
```typescript
// Clear stale cache
await db.analyticsCache.deleteMany({
  where: {
    updatedAt: {
      lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24h
    }
  }
});

// Force refresh
await trpc.analytics.refreshCache.mutate();
```

### Missing Data
```typescript
// Verify data exists
const scanCount = await db.scan.count();
console.log(`Total scans in database: ${scanCount}`);

// Check date filters
const recentScans = await db.scan.findMany({
  where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  take: 5
});
console.log('Recent scans:', recentScans);
```

## Extending Analytics

### Add Custom Metrics
```typescript
// In analyticsService.ts
async getCustomMetric(projectId: number) {
  const metric = await db.scan.aggregate({
    where: { code: { projectId } },
    _avg: { riskScore: true },
    _max: { trustScore: true }
  });

  return {
    averageRisk: metric._avg.riskScore,
    maxTrust: metric._max.trustScore
  };
}
```

### Add New Time Ranges
```typescript
// Add "last 7 days" option
async getWeeklyOverview(userId?: number) {
  const sevenDaysAgo = getDaysAgo(7);

  // Similar to getOverview but with different date filter
  // ...
}
```

---

**Built with 📊 by AiO.digital - Secure Touchpoint Ecosystem**
