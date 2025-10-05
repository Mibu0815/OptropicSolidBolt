# Optropic Platform - Security Guide

## Overview

This document outlines the security measures implemented in the Optropic Platform to protect against common web vulnerabilities and attacks.

## 🔐 Authentication & Secrets

### JWT Authentication
- **JWT_SECRET**: 128 hex characters (64 bytes) for signing JSON Web Tokens
- **Expiration**: Tokens expire after 24 hours
- **Storage**: Client-side tokens stored in Zustand store (not localStorage)

### Encryption
- **SECRET_KEY**: 128 hex characters (64 bytes) for AES-256-GCM encryption
- **Algorithm**: AES-256-GCM with 12-byte IV and 16-byte auth tag
- **Use Case**: Encrypting private keys before database storage

### Secret Generation
```bash
# Generate secure JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate secure SECRET_KEY
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Production Validation
- Automatic detection of default secrets in production mode
- Warning messages logged if insecure defaults are detected
- Environment validation on startup

## 🛡️ Rate Limiting

### Global Rate Limit
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Scope**: All API endpoints

### Authentication Rate Limit
- **Window**: 1 minute
- **Max Requests**: 5 per IP
- **Scope**: Login and authentication endpoints
- **Protection**: Prevents brute-force attacks

### Implementation
- In-memory store with automatic cleanup
- IP-based tracking (respects X-Forwarded-For header)
- Per-endpoint configuration via tRPC middleware

## 🌐 CORS Protection

### Development Mode
Allowed origins:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

### Production Mode
- Configure allowed origins in `src/server/middleware/cors.ts`
- Replace placeholder domains with your production domains
- Credentials: Enabled for authenticated requests

### Configuration
```typescript
const allowedOrigins = [
  "https://yourdomain.com",
  "https://www.yourdomain.com",
];
```

## 🔑 Key Management

### Keypair Generation
- **Algorithm**: ECDSA with P-256 curve (prime256v1)
- **Format**: PEM encoding (SPKI for public, PKCS8 for private)
- **Storage**: Private keys encrypted before database storage

### Key Rotation
- Keys can be marked inactive without deletion
- Support for key pairing (dual verification)
- Expiration date tracking

## 🗄️ Database Security

### Connection
- PostgreSQL via Supabase
- SSL/TLS encryption in transit
- Connection string stored in environment variables

### Schema Protection
- Foreign key constraints
- Unique constraints on critical fields
- Timestamp tracking (createdAt, updatedAt)

### Data Validation
- Zod schemas for all input validation
- Type-safe database queries via Prisma
- Automatic SQL injection prevention

## 📝 Security Best Practices

### Environment Variables
1. Never commit `.env` to version control
2. Use `.env.example` as template
3. Rotate secrets regularly in production
4. Use different secrets per environment

### Password Handling
- Bcrypt hashing with salt rounds
- No plaintext password storage
- Secure password reset flows

### API Security
- All sensitive endpoints require authentication
- Token validation on every protected request
- Automatic token expiration

### Error Handling
- Generic error messages to prevent information leakage
- Detailed errors logged server-side only
- Stack traces hidden in production

## 🚨 Security Checklist

Before deploying to production:

- [ ] Generate and set secure JWT_SECRET
- [ ] Generate and set secure SECRET_KEY
- [ ] Update CORS allowed origins
- [ ] Configure rate limits for your traffic
- [ ] Review and test authentication flows
- [ ] Enable HTTPS/TLS on all endpoints
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Review database access policies
- [ ] Implement regular security audits
- [ ] Set up automated dependency updates

## 📞 Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT create a public GitHub issue
2. Email security@yourdomain.com
3. Include detailed steps to reproduce
4. Allow reasonable time for patching

## 🔄 Updates

This security guide is updated with each major release. Last updated: 2025-10-05

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [tRPC Security Best Practices](https://trpc.io/docs/server/authorization)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
