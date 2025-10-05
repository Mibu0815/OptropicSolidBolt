# Optropic Platform - Backend Implementation Guide

## 📋 Overview

The Optropic Platform backend is a secure, cryptographic system for generating, managing, and verifying Optropic codes. It's built with:

- **TypeScript** for type safety
- **tRPC** for end-to-end type-safe APIs
- **Prisma** for database access
- **Supabase** for PostgreSQL database
- **Node.js crypto** for ECC (P-256) and AES-256-GCM encryption
- **MinIO** for object storage

## 🏗️ Architecture

### Service Layer

The backend follows a clean architecture with three main services:

#### 1. KeyService (`/server/services/keyService.ts`)
Handles all cryptographic key operations:
- Generate ECC (P-256) key pairs
- Encrypt private keys with AES-256-GCM
- Store encrypted keys in database
- Rotate and revoke keys
- Sign data with private keys
- Verify signatures with public keys

#### 2. CodeService (`/server/services/codeService.ts`)
Manages Optropic code generation:
- Generate unique entropy seeds
- Create signed code payloads
- Encode codes as Base64URL
- Generate QR code representations
- Track code statistics

#### 3. VerificationService (`/server/services/verificationService.ts`)
Handles code verification:
- Verify code signatures
- Calculate trust scores (0-100)
- Log scan events
- Detect suspicious activity
- Track geographic and device data

### API Layer (tRPC Routers)

#### Keys Router (`keys.*`)
```typescript
// Generate a new key
trpc.keys.generate.mutate({
  projectId: 1,
  keyName: "Production Signing Key",
  keyType: "SIGNING"
});

// List all keys
trpc.keys.list.query({ projectId: 1 });

// Rotate a key
trpc.keys.rotate.mutate({ keyId: 123 });

// Revoke a key
trpc.keys.revoke.mutate({ keyId: 123 });

// Get only active keys
trpc.keys.getActive.query({ projectId: 1 });
```

#### Codes Router (`codes.*`)
```typescript
// Generate a code
trpc.codes.generate.mutate({
  projectId: 1,
  keyId: 123,
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  metadata: { product: "Widget A" }
});

// List codes
trpc.codes.list.query({ projectId: 1 });

// Revoke a code
trpc.codes.revoke.mutate({ codeId: 456 });

// Verify a code (public - no auth required)
trpc.codes.verify.mutate({
  codeValue: "eyJlIjoiMTIzLi4uIiwicyI6ImFiYy4uLiIsIms6MTIzfQ",
  deviceType: "MOBILE",
  country: "US"
});

// Get scan history
trpc.codes.scanHistory.query({
  projectId: 1,
  limit: 50,
  offset: 0
});

// Get statistics
trpc.codes.stats.query({ projectId: 1 });

// Detect suspicious activity
trpc.codes.detectSuspicious.query({
  projectId: 1,
  timeWindowHours: 24
});
```

## 🔐 Security Features

### Cryptographic Implementation

#### Key Generation
```typescript
// ECC P-256 (also known as prime256v1 or secp256r1)
const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" }
});
```

#### Private Key Encryption
```typescript
// AES-256-GCM with random IV and authentication tag
const iv = crypto.randomBytes(12);  // 96-bit IV for GCM
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const encrypted = cipher.update(privateKey, "utf8", "hex") + cipher.final("hex");
const authTag = cipher.getAuthTag();

// Stored as: iv:authTag:encrypted
```

#### Code Signing
```typescript
// SHA256 with ECDSA
const sign = crypto.createSign("SHA256");
sign.update(payloadString);
const signature = sign.sign(privateKey, "base64");
```

### Trust Score Calculation

Trust scores range from 0-100 and factor in:
- **Code age**: Older codes score lower
  - > 365 days: -20 points
  - > 180 days: -10 points
- **Key expiration**: Expired keys: -30 points
- **Encryption level**: Weaker encryption: -10 points
  - AES_128 or RSA_2048 considered weaker
- **Key status**: Inactive keys: -50 points

### Row Level Security (RLS)

All database tables have RLS enabled:
```sql
-- Example: Users can only access their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId"::text);
```

## 📊 Database Schema

### Core Tables

```
users
├── id (serial)
├── email (unique)
├── password (bcrypt hashed)
├── role (ADMIN | MANAGER | OPERATOR)
└── ...

projects
├── id (serial)
├── name
├── userId (FK → users)
└── status (DRAFT | ACTIVE | PAUSED | COMPLETED | ARCHIVED)

keys
├── id (serial)
├── keyName
├── keyType (ENCRYPTION | SIGNING | NFC_PAIRING | RFID_PAIRING)
├── publicKey (PEM format)
├── encryptedPrivateKey (AES-256-GCM encrypted)
├── algorithm (prime256v1)
├── isActive
├── expiresAt
└── projectId (FK → projects)

optropic_codes
├── id (serial)
├── codeValue (Base64URL encoded)
├── codeType (OPTROPIC | QRSSL | GS1_COMPLIANT)
├── encryptionLevel (AES_128 | AES_256 | RSA_2048 | RSA_4096)
├── entropySeed (UUID-timestamp-random)
├── signature (Base64 ECDSA signature)
├── payload (JSONB)
├── isActive
├── projectId (FK → projects)
└── keyId (FK → keys)

scans
├── id (serial)
├── codeId (FK → optropic_codes)
├── verificationSuccess
├── trustScore (0-100)
├── isSuspicious
├── riskScore
├── deviceType
├── country, city, region
└── createdAt
```

## 🚀 Setup Instructions

### 1. Environment Configuration

Create `.env` file:
```env
# Authentication
JWT_SECRET=your-secret-key-min-32-chars
ADMIN_PASSWORD=secure-admin-password

# Cryptography (REQUIRED - must be exactly 32 chars or will be padded)
SECRET_KEY=supersecureaeskeysupersecureaeskey32

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# Supabase Frontend URLs
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=your-anon-key

# Optional: MinIO for file storage
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### 2. Database Setup

The database schema has already been migrated to Supabase with:
- All tables created
- Foreign keys configured
- Indexes added for performance
- Row Level Security enabled
- Default role archetypes seeded

### 3. Install Dependencies

```bash
cd /tmp/cc-agent/58063543/project/optropic-platform/first-project
npm install --legacy-peer-deps
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Start Development Server

```bash
npm run dev
```

## 🧪 Testing the API

### Example 1: Complete Key → Code → Verify Flow

```typescript
// 1. Generate a signing key
const key = await trpc.keys.generate.mutate({
  projectId: 1,
  keyName: "Production Key 2024",
  keyType: "SIGNING"
});
// Returns: { id, publicKey, isActive, createdAt, ... }

// 2. Generate an Optropic code
const code = await trpc.codes.generate.mutate({
  projectId: 1,
  keyId: key.id,
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  metadata: {
    product: "Widget A",
    batch: "B2024-001"
  }
});
// Returns: { id, codeValue, qrCodeUrl, entropySeed, ... }

// 3. Verify the code (public endpoint - no auth)
const result = await trpc.codes.verify.mutate({
  codeValue: code.codeValue,
  deviceType: "MOBILE",
  country: "US",
  city: "San Francisco"
});
// Returns: {
//   success: true,
//   trustScore: 100,
//   message: "Code verified successfully",
//   code: { id, codeType, ... },
//   project: { id, name }
// }

// 4. View scan history
const scans = await trpc.codes.scanHistory.query({
  projectId: 1,
  limit: 10
});
// Returns: { scans: [...], total, limit, offset }
```

### Example 2: Key Rotation

```typescript
// Rotate a key (old key marked inactive, new key generated)
const newKey = await trpc.keys.rotate.mutate({
  keyId: oldKeyId
});

// Old codes using the old key will still verify
// New codes should use the new key
```

### Example 3: Detecting Suspicious Activity

```typescript
const suspicious = await trpc.codes.detectSuspicious.query({
  projectId: 1,
  timeWindowHours: 24
});

// Returns: {
//   totalSuspicious: 15,
//   recentScans: [...],
//   suspiciousIPs: [
//     { ip: "123.45.67.89", count: 25 }
//   ],
//   timeWindow: "24h"
// }
```

## 📈 Performance Considerations

### Database Indexes

Indexes are created on frequently queried columns:
```sql
CREATE INDEX idx_keys_projectId ON keys("projectId");
CREATE INDEX idx_optropic_codes_codeValue ON optropic_codes("codeValue");
CREATE INDEX idx_scans_codeId ON scans("codeId");
CREATE INDEX idx_scans_createdAt ON scans("createdAt");
```

### Caching Strategy

Consider implementing Redis caching for:
- Active keys per project
- Recent verification results
- Analytics aggregations

## 🔍 Monitoring & Alerts

### Key Metrics to Track

1. **Verification Rate**: `successfulScans / totalScans`
2. **Average Trust Score**: Monitor declining scores
3. **Suspicious Activity**: Alert on > 10 failed verifications from same IP
4. **Key Expiration**: Alert 30 days before expiry
5. **Code Generation Rate**: Unusual spikes may indicate abuse

### Activity Logging

All operations are logged to `activity_logs` table:
```typescript
{
  action: "KEY_GENERATED",
  entityType: "Key",
  entityId: 123,
  userId: 456,
  newValues: { keyName: "...", keyType: "..." },
  createdAt: "2024-10-05T10:00:00Z"
}
```

## 🛠️ Development Tools

### Prisma Studio
```bash
npx prisma studio
```
Open http://localhost:5555 to browse database

### Type Generation
```bash
npx prisma generate  # Generate Prisma types
npm run typecheck    # Check TypeScript types
```

## 🔒 Security Best Practices

### ✅ Implemented
- Private keys encrypted at rest with AES-256-GCM
- JWT authentication with 7-day expiry
- Row Level Security on all tables
- Input validation with Zod schemas
- HTTPS required in production
- Activity logging for audit trails
- Trust score calculation
- Suspicious activity detection

### 🚨 Important Notes
- **Never** expose the `getPrivateKey` method via API
- **Never** log or return encrypted private keys
- **Always** use HTTPS in production
- **Always** validate user ownership before operations
- **Rotate** keys regularly (every 90-180 days)
- **Monitor** for suspicious patterns
- **Backup** database regularly

## 📚 Frontend Integration

### Setting up tRPC Client

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from './server/trpc/root';

export const trpc = createTRPCReact<AppRouter>();

// Use in components
const { data: keys } = trpc.keys.list.useQuery({ projectId: 1 });
const generateKey = trpc.keys.generate.useMutation();
```

### Authentication

```typescript
// Include JWT token in headers
const token = localStorage.getItem('auth_token');

const trpcClient = createTRPCClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      headers: {
        authorization: token ? `Bearer ${token}` : '',
      },
    }),
  ],
});
```

## 🎯 Next Steps

1. **Add Analytics**: Implement dashboard metrics and visualizations
2. **Add Notifications**: Real-time alerts for security events
3. **Add Content Management**: File uploads with MinIO
4. **Add Tests**: Jest/Vitest unit and integration tests
5. **Add Documentation**: OpenAPI/Swagger docs from tRPC schema
6. **Add Rate Limiting**: Protect public verify endpoint
7. **Add Webhooks**: Notify external systems of events

## 📞 Support

For issues or questions:
- Email: info@aio.digital
- Web: https://aio.digital
- GitHub: Check repository issues

---

**Built with ❤️ by AiO.digital - Secure Touchpoint Ecosystem**
