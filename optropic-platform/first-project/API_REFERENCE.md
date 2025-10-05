# Optropic Platform - API Reference

Quick reference for all tRPC endpoints.

## 🔐 Authentication

All endpoints except `codes.verify` require JWT authentication.

```typescript
// Headers
{
  "Authorization": "Bearer <your-jwt-token>"
}
```

## 📦 Keys API

### `keys.generate`
Generate a new cryptographic key.

**Type**: `mutation`
**Auth**: Required

```typescript
Input: {
  projectId: number;
  keyName: string;
  keyType: "ENCRYPTION" | "SIGNING" | "NFC_PAIRING" | "RFID_PAIRING";
  expiresAt?: string; // ISO date string
}

Output: {
  id: number;
  keyName: string;
  type: KeyType;
  publicKey: string; // PEM format
  algorithm: string; // "prime256v1"
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}
```

**Example**:
```typescript
const key = await trpc.keys.generate.mutate({
  projectId: 1,
  keyName: "Production Signing Key",
  keyType: "SIGNING",
  expiresAt: "2025-12-31T23:59:59Z"
});
```

---

### `keys.list`
List all keys for a project.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
}

Output: KeyDTO[]
```

**Example**:
```typescript
const keys = await trpc.keys.list.query({ projectId: 1 });
```

---

### `keys.getActive`
Get only active (non-expired, non-revoked) keys.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
}

Output: KeyDTO[]
```

**Example**:
```typescript
const activeKeys = await trpc.keys.getActive.query({ projectId: 1 });
```

---

### `keys.rotate`
Rotate a key (deactivate old, create new).

**Type**: `mutation`
**Auth**: Required

```typescript
Input: {
  keyId: number;
}

Output: KeyDTO
```

**Example**:
```typescript
const newKey = await trpc.keys.rotate.mutate({ keyId: 123 });
```

---

### `keys.revoke`
Revoke a key permanently.

**Type**: `mutation`
**Auth**: Required

```typescript
Input: {
  keyId: number;
}

Output: KeyDTO
```

**Example**:
```typescript
await trpc.keys.revoke.mutate({ keyId: 123 });
```

## 🔢 Codes API

### `codes.generate`
Generate a new Optropic code.

**Type**: `mutation`
**Auth**: Required

```typescript
Input: {
  projectId: number;
  keyId: number;
  codeType: "OPTROPIC" | "QRSSL" | "GS1_COMPLIANT";
  encryptionLevel: "AES_128" | "AES_256" | "RSA_2048" | "RSA_4096";
  assetId?: number;
  metadata?: Record<string, any>;
}

Output: {
  id: number;
  codeValue: string; // Base64URL encoded
  codeType: CodeType;
  encryptionLevel: EncryptionLevel;
  entropySeed: string;
  isActive: boolean;
  createdAt: Date;
  qrCodeUrl?: string; // data:image/svg+xml;base64,...
}
```

**Example**:
```typescript
const code = await trpc.codes.generate.mutate({
  projectId: 1,
  keyId: 123,
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  metadata: {
    product: "Widget A",
    batch: "B2024-001",
    serial: "SN123456"
  }
});
```

---

### `codes.list`
List all codes for a project.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
}

Output: CodeDTO[]
```

**Example**:
```typescript
const codes = await trpc.codes.list.query({ projectId: 1 });
```

---

### `codes.revoke`
Revoke a code (mark as inactive).

**Type**: `mutation`
**Auth**: Required

```typescript
Input: {
  codeId: number;
}

Output: CodeDTO
```

**Example**:
```typescript
await trpc.codes.revoke.mutate({ codeId: 456 });
```

---

### `codes.verify` ⚠️ PUBLIC
Verify a scanned code (no authentication required).

**Type**: `mutation`
**Auth**: Not Required

```typescript
Input: {
  codeValue: string; // Base64URL encoded code
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: "MOBILE" | "DESKTOP" | "TABLET" | "IOT_DEVICE" | "SCANNER";
  geoHash?: string;
  country?: string;
  city?: string;
  region?: string;
}

Output: {
  success: boolean;
  trustScore: number; // 0-100
  message: string;
  isSuspicious: boolean;
  code?: {
    id: number;
    codeType: string;
    encryptionLevel: string;
    createdAt: Date;
  };
  project?: {
    id: number;
    name: string;
  };
}
```

**Example**:
```typescript
const result = await trpc.codes.verify.mutate({
  codeValue: "eyJlIjoiMTIzLWFiYyIsInMiOiJzaWduYXR1cmUiLCJrIjoxMjN9",
  deviceType: "MOBILE",
  country: "US",
  city: "San Francisco",
  ipAddress: "192.168.1.1"
});

if (result.success) {
  console.log(`Trust Score: ${result.trustScore}/100`);
  console.log(`Project: ${result.project.name}`);
}
```

---

### `codes.scanHistory`
Get scan history for a project.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
  limit?: number; // default: 100
  offset?: number; // default: 0
}

Output: {
  scans: Array<{
    id: number;
    code: {
      id: number;
      codeValue: string;
      codeType: string;
    };
    verificationSuccess: boolean;
    trustScore: number | null;
    isSuspicious: boolean;
    riskScore: number | null;
    failureReason: string | null;
    deviceType: string | null;
    country: string | null;
    city: string | null;
    region: string | null;
    createdAt: Date;
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

**Example**:
```typescript
const history = await trpc.codes.scanHistory.query({
  projectId: 1,
  limit: 50,
  offset: 0
});

console.log(`Total scans: ${history.total}`);
console.log(`Showing ${history.scans.length} scans`);
```

---

### `codes.stats`
Get code and scan statistics for a project.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
}

Output: {
  // Code stats
  totalCodes: number;
  activeCodes: number;
  revokedCodes: number;
  totalScans: number;

  // Scan stats
  successfulScans: number;
  failedScans: number;
  suspiciousScans: number;
  averageTrustScore: number;
  successRate: string; // percentage as string
}
```

**Example**:
```typescript
const stats = await trpc.codes.stats.query({ projectId: 1 });

console.log(`Success Rate: ${stats.successRate}%`);
console.log(`Average Trust Score: ${stats.averageTrustScore.toFixed(1)}/100`);
```

---

### `codes.detectSuspicious`
Detect suspicious activity in recent scans.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
  timeWindowHours?: number; // default: 24
}

Output: {
  totalSuspicious: number;
  recentScans: Array<{
    id: number;
    code: {
      id: number;
      codeValue: string;
    };
    verificationSuccess: boolean;
    trustScore: number | null;
    isSuspicious: boolean;
    failureReason: string | null;
    ipAddress: string | null;
    createdAt: Date;
  }>;
  suspiciousIPs: Array<{
    ip: string;
    count: number;
  }>;
  timeWindow: string; // e.g., "24h"
}
```

**Example**:
```typescript
const suspicious = await trpc.codes.detectSuspicious.query({
  projectId: 1,
  timeWindowHours: 24
});

if (suspicious.suspiciousIPs.length > 0) {
  console.log("⚠️ High-frequency IPs detected:");
  suspicious.suspiciousIPs.forEach(({ ip, count }) => {
    console.log(`  ${ip}: ${count} scans`);
  });
}
```

## 📊 Analytics API

### `analytics.getOverview`
Get dashboard overview with automatic caching (5-minute TTL).

**Type**: `query`
**Auth**: Required

```typescript
Output: {
  activeProjects: number;
  activeKeys: number;
  scansThisMonth: number;
  totalCodes: number;
  trends: Array<{
    label: string;  // "YYYY-MM-DD"
    scans: number;
  }>;
  keyUsage: Array<{
    type: string;
    count: number;
  }>;
  projectStatus: Array<{
    status: string;
    count: number;
  }>;
}
```

**Example**:
```typescript
const overview = await trpc.analytics.getOverview.query();

console.log(`Active Projects: ${overview.activeProjects}`);
console.log(`Scans This Month: ${overview.scansThisMonth}`);
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
  successRate: string;
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
  threshold?: number; // Default: 2.0
}

Output: {
  hasAnomaly: boolean;
  currentRate: number;
  averageRate: number;
  deviation: number;
}
```

**Example**:
```typescript
const anomaly = await trpc.analytics.detectAnomalies.query({
  projectId: 1,
  threshold: 2.5
});

if (anomaly.hasAnomaly) {
  console.log(`⚠️ ${anomaly.deviation}x normal activity detected!`);
}
```

---

### `analytics.refreshCache`
Manually refresh analytics cache.

**Type**: `mutation`
**Auth**: Required

```typescript
await trpc.analytics.refreshCache.mutate();
```

---

### `analytics.getTimeSeries`
Get custom time-series data.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectId: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
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
```

---

### `analytics.getComparative`
Compare analytics across multiple projects.

**Type**: `query`
**Auth**: Required

```typescript
Input: {
  projectIds: number[];
  days?: number;
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
```

## 🔍 Response Codes

### Success Responses
- `200` - Query/Mutation successful
- Response includes requested data

### Error Responses
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `400` - Bad request (validation error)
- `500` - Internal server error

### Error Format
```typescript
{
  error: {
    code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR";
    message: string;
    data?: {
      zodError?: ZodError; // If validation failed
    }
  }
}
```

## 📊 Trust Score Factors

Trust scores range from **0** (no trust) to **100** (full trust):

| Factor | Impact | Description |
|--------|--------|-------------|
| Code age > 365 days | -20 | Very old code |
| Code age > 180 days | -10 | Old code |
| Key expired | -30 | Past expiration date |
| Weak encryption | -10 | AES_128 or RSA_2048 |
| Inactive key | -50 | Key has been revoked |

**Example scores**:
- ✅ **100**: New code, active key, strong encryption
- ⚠️ **70**: 6-month-old code with active key
- ⚠️ **50**: 1-year-old code with weak encryption
- 🚨 **20**: Old code with expired key
- 🚨 **0**: Code with revoked key or invalid signature

## 🔗 Code Value Format

Optropic codes are encoded as Base64URL JSON:

```typescript
{
  e: string;  // Entropy seed (UUID-timestamp-random)
  s: string;  // ECDSA signature (Base64)
  k: number;  // Key ID
}
```

**Decoding example**:
```typescript
const decoded = JSON.parse(
  Buffer.from(codeValue, 'base64url').toString('utf8')
);
// { e: "abc-123-xyz", s: "signature...", k: 123 }
```

## 📱 Common Use Cases

### Use Case 1: Product Authentication
```typescript
// 1. Generate key for product line
const key = await trpc.keys.generate.mutate({
  projectId: 1,
  keyName: "Product Line A - 2024",
  keyType: "SIGNING"
});

// 2. Generate codes for each product
const code = await trpc.codes.generate.mutate({
  projectId: 1,
  keyId: key.id,
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  metadata: {
    sku: "PROD-001",
    batch: "2024-Q1",
    mfgDate: "2024-01-15"
  }
});

// 3. Print QR code on product
console.log(code.qrCodeUrl); // Use this SVG in label

// 4. Customer scans code
const result = await trpc.codes.verify.mutate({
  codeValue: code.codeValue,
  deviceType: "MOBILE",
  country: "US"
});
```

### Use Case 2: Key Rotation
```typescript
// 1. Get expiring keys
const keys = await trpc.keys.list.query({ projectId: 1 });
const expiringSoon = keys.filter(k => {
  const daysUntilExpiry = k.expiresAt
    ? (new Date(k.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    : Infinity;
  return daysUntilExpiry < 30;
});

// 2. Rotate each key
for (const key of expiringSoon) {
  const newKey = await trpc.keys.rotate.mutate({ keyId: key.id });
  console.log(`Rotated ${key.keyName} → ${newKey.keyName}`);
}
```

### Use Case 3: Monitoring Dashboard
```typescript
// Get real-time statistics
const stats = await trpc.codes.stats.query({ projectId: 1 });

// Get recent scans
const history = await trpc.codes.scanHistory.query({
  projectId: 1,
  limit: 10
});

// Check for suspicious activity
const suspicious = await trpc.codes.detectSuspicious.query({
  projectId: 1,
  timeWindowHours: 1
});

// Display dashboard
console.log(`
📊 Project Dashboard
────────────────────
Total Codes: ${stats.totalCodes}
Active: ${stats.activeCodes}
Success Rate: ${stats.successRate}%
Avg Trust Score: ${stats.averageTrustScore}/100

⚠️ Suspicious Activity (1h):
${suspicious.totalSuspicious} suspicious scans
${suspicious.suspiciousIPs.length} high-frequency IPs
`);
```

---

## 📞 Support

For API support:
- 📧 Email: info@aio.digital
- 🌐 Web: https://aio.digital
- 📚 Docs: See BACKEND_README.md

**Built with 🔒 by AiO.digital**
