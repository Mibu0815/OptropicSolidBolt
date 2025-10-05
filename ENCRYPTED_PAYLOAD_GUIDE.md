# Encrypted Payload Feature Guide

## Overview

The Optropic Platform now supports **two modes** for code generation:

1. **Standard Mode** - Payload stored as plaintext JSONB in database, signed but not encrypted
2. **Encrypted Mode** - Payload encrypted with AES-256-GCM, then signed and embedded in the code

Both modes provide cryptographic signatures for verification, but encrypted mode adds an additional layer of security by encrypting the payload data itself.

## When to Use Encrypted Payloads

### Use Encrypted Payloads When:
- ✅ Payload contains sensitive business data
- ✅ Compliance requires data-at-rest encryption
- ✅ Code will be printed/stored in untrusted environments
- ✅ Payload contains PII or confidential product information
- ✅ Higher security requirements justify slightly larger QR codes

### Use Standard Payloads When:
- ✅ Performance is critical (faster verification)
- ✅ Smaller QR codes preferred
- ✅ Payload data is already public
- ✅ Simpler debugging needed
- ✅ Database encryption (like Supabase) is sufficient

## Architecture

### Standard Mode Flow
```
1. Generate payload (JSON)
2. Sign payload with ECC private key
3. Encode: { e: entropySeed, s: signature, k: keyId }
4. Store plaintext payload in database
5. Return Base64URL encoded code
```

### Encrypted Mode Flow
```
1. Generate payload (JSON)
2. Encrypt payload with AES-256-GCM
3. Sign encrypted payload hash with ECC private key
4. Encode: { e: entropySeed, s: signature, k: keyId, enc: encrypted, iv: iv, tag: tag }
5. Store plaintext payload in database (for backend access)
6. Return Base64URL encoded code with embedded encrypted payload
```

## API Usage

### Generate Standard Code

```typescript
const code = await trpc.codes.generate.mutate({
  projectId: 1,
  keyId: 123,
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  role: "INSPECTOR",
  metadata: {
    product: "Widget A",
    batch: "2024-Q1"
  },
  encryptPayload: false  // Default: standard mode
});

// Returns:
{
  id: 456,
  codeValue: "eyJlIjoiYWJjLTEyMy14eXoiLCJzIjoic2lnbmF0dXJlIiwiayI6MTIzfQ",
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  entropySeed: "abc-123-xyz",
  isActive: true,
  createdAt: "2024-10-05T...",
  qrCodeUrl: "data:image/svg+xml;base64,..."
}
```

### Generate Encrypted Code

```typescript
const code = await trpc.codes.generate.mutate({
  projectId: 1,
  keyId: 123,
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  role: "INSPECTOR",
  contentId: 789,  // Optional: link to content
  metadata: {
    product: "Widget A",
    batch: "2024-Q1",
    confidential: "Internal Use Only"
  },
  encryptPayload: true  // Enable encrypted mode
});

// Returns:
{
  id: 456,
  codeValue: "eyJlIjoiYWJjLTEyMy14eXoiLCJzIjoic2lnbmF0dXJlIiwiayI6MTIzLCJlbmMiOiIuLi4iLCJpdiI6Ii4uLiIsInRhZyI6Ii4uLiJ9",
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  entropySeed: "abc-123-xyz",
  isActive: true,
  createdAt: "2024-10-05T...",
  qrCodeUrl: "data:image/svg+xml;base64,...",
  encryptedPayload: {
    encrypted: "base64...",
    iv: "base64...",
    tag: "base64..."
  }
}
```

### Verify Standard Code

```typescript
const result = await trpc.codes.verify.mutate({
  codeValue: "eyJlIjoiYWJjLTEyMy14eXoiLCJzIjoic2lnbmF0dXJlIiwiayI6MTIzfQ",
  deviceType: "MOBILE",
  country: "US"
});

// Returns:
{
  success: true,
  trustScore: 100,
  message: "Code verified successfully",
  isSuspicious: false,
  code: {
    id: 456,
    codeType: "OPTROPIC",
    encryptionLevel: "AES_256",
    createdAt: "2024-10-05T..."
  },
  project: {
    id: 1,
    name: "My Project"
  }
}
```

### Verify Encrypted Code

```typescript
const result = await trpc.codes.verifyEncrypted.mutate({
  codeValue: "eyJlIjoiYWJjLTEyMy14eXoiLCJzIjoic2lnbmF0dXJlIiwiayI6MTIzLCJlbmMiOiIuLi4iLCJpdiI6Ii4uLiIsInRhZyI6Ii4uLiJ9",
  deviceId: "device-abc-123",
  geoHash: "u4pruydqqvj"
});

// Returns:
{
  valid: true,
  trustScore: 100,
  message: "Verification successful",
  payload: {
    projectId: 1,
    keyId: 123,
    entropySeed: "abc-123-xyz",
    timestamp: 1696512000000,
    codeType: "OPTROPIC",
    encryptionLevel: "AES_256",
    contentId: 789,
    role: "INSPECTOR",
    metadata: {
      product: "Widget A",
      batch: "2024-Q1",
      confidential: "Internal Use Only"
    }
  },
  code: {
    id: 456,
    codeType: "OPTROPIC",
    project: "My Project"
  }
}
```

## Code Structure

### Standard Code Structure
```json
{
  "e": "uuid-timestamp-random",  // Entropy seed
  "s": "base64signature",        // ECC signature
  "k": 123                       // Key ID
}
```
Encoded as Base64URL → Smaller QR code

### Encrypted Code Structure
```json
{
  "e": "uuid-timestamp-random",  // Entropy seed
  "s": "base64signature",        // ECC signature
  "k": 123,                      // Key ID
  "enc": "base64encrypted",      // Encrypted payload
  "iv": "base64iv",              // AES initialization vector
  "tag": "base64tag"             // AES authentication tag
}
```
Encoded as Base64URL → Larger QR code (but still scannable)

## Security Considerations

### Encryption Details
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key**: Derived from `SECRET_KEY` environment variable
- **IV**: Random 12 bytes per code (96-bit)
- **Authentication Tag**: 16 bytes (128-bit)
- **Padding**: Not needed (GCM is a stream cipher)

### Key Management
- Same ECC keys used for both modes
- Private keys always encrypted at rest
- Public keys used for signature verification
- Key rotation supported without re-generating codes

### Attack Resistance
Both modes protect against:
- ✅ Code cloning/duplication (unique entropy seed)
- ✅ Signature forgery (ECC cryptography)
- ✅ Key tampering (immutable once signed)
- ✅ Replay attacks (entropy seed + timestamp)

Encrypted mode additionally protects against:
- ✅ Payload inspection (data encrypted)
- ✅ Metadata exposure (all fields encrypted)
- ✅ Content enumeration (encrypted values)

## Performance Comparison

| Operation | Standard Mode | Encrypted Mode |
|-----------|---------------|----------------|
| Code Generation | ~50ms | ~55ms |
| Code Verification | ~60ms | ~70ms |
| QR Code Size | Smaller (~30% less) | Larger |
| Database Storage | Same (both store plaintext) | Same |

**Recommendation**: For most use cases, standard mode is sufficient. Use encrypted mode only when payload sensitivity justifies the trade-offs.

## Example Use Cases

### Use Case 1: Product Authentication (Standard Mode)
```typescript
// Public product information - no encryption needed
const code = await trpc.codes.generate.mutate({
  projectId: 1,
  keyId: signingKey.id,
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  metadata: {
    sku: "PROD-001",
    name: "Widget Pro",
    mfgDate: "2024-01-15"
  },
  encryptPayload: false
});
```

### Use Case 2: Equipment Maintenance (Encrypted Mode)
```typescript
// Sensitive maintenance records - encrypt payload
const code = await trpc.codes.generate.mutate({
  projectId: 1,
  keyId: signingKey.id,
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  role: "MAINTAINER",
  metadata: {
    equipment: "Turbine-A1",
    lastService: "2024-09-15",
    nextService: "2024-12-15",
    notes: "Replace bearing #3",
    technician: "John Doe"
  },
  encryptPayload: true  // Protect sensitive data
});
```

### Use Case 3: Compliance Documents (Encrypted Mode)
```typescript
// Regulatory information - encrypt for compliance
const code = await trpc.codes.generate.mutate({
  projectId: 1,
  keyId: signingKey.id,
  codeType: "OPTROPIC",
  encryptionLevel: "AES_256",
  role: "INSPECTOR",
  contentId: regulatoryDocId,
  metadata: {
    docType: "FDA_COMPLIANCE",
    certNumber: "FDA-2024-00123",
    expiryDate: "2025-12-31",
    restrictions: "Internal Use Only"
  },
  encryptPayload: true
});
```

## Migration from Standard to Encrypted

If you need to migrate existing codes:

```typescript
// Option 1: Generate new encrypted codes
// Old codes remain valid, new codes use encryption
const newCode = await trpc.codes.generate.mutate({
  ...existingCodeParams,
  encryptPayload: true
});

// Option 2: Revoke old, generate encrypted replacement
await trpc.codes.revoke.mutate({ codeId: oldCodeId });
const newCode = await trpc.codes.generate.mutate({
  ...existingCodeParams,
  encryptPayload: true
});
```

## Debugging

### Decode Standard Code
```javascript
const decoded = JSON.parse(
  Buffer.from(codeValue, 'base64url').toString('utf8')
);
console.log(decoded);
// { e: "...", s: "...", k: 123 }
```

### Decode Encrypted Code
```javascript
const decoded = JSON.parse(
  Buffer.from(codeValue, 'base64url').toString('utf8')
);
console.log(decoded);
// { e: "...", s: "...", k: 123, enc: "...", iv: "...", tag: "..." }

// To decrypt (requires SECRET_KEY):
// Use CodeService.verifyEncryptedCode() - don't decrypt manually
```

## FAQ

**Q: Can I mix standard and encrypted codes in the same project?**
A: Yes! Each code is independent. Generate some with `encryptPayload: false` and others with `encryptPayload: true`.

**Q: Do encrypted codes work with existing keys?**
A: Yes! The same ECC keys work for both modes. Only the payload encryption changes.

**Q: What's stored in the database?**
A: Both modes store the **plaintext** payload in the database for backend access. The encryption is only applied to the code value itself.

**Q: Can I decrypt codes manually?**
A: Not recommended. Use `trpc.codes.verifyEncrypted.mutate()` which handles decryption, verification, and logging.

**Q: What happens if SECRET_KEY changes?**
A: Existing encrypted codes become unverifiable. **Never change SECRET_KEY** in production without a migration plan.

**Q: How much larger are encrypted QR codes?**
A: Approximately 30-40% larger due to the encrypted payload, IV, and auth tag. Still scannable with standard readers.

**Q: Should I use encrypted mode by default?**
A: Not necessarily. Evaluate your security requirements. Standard mode with database encryption (Supabase) is often sufficient.

---

**Built with 🔒 by AiO.digital - Secure Touchpoint Ecosystem**
