# Optropic Platform - Deployment Guide
**Version**: 3.0.0
**Last Updated**: 2025-10-05

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Local Development](#local-development)
5. [Staging Deployment](#staging-deployment)
6. [Production Deployment](#production-deployment)
7. [Docker Deployment](#docker-deployment)
8. [Monitoring Setup](#monitoring-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18+ (v20 recommended)
- **npm**: v9+ or **pnpm**: v8+
- **PostgreSQL**: v14+ (Supabase managed recommended)
- **Git**: For version control

### Required Accounts

- **Supabase**: Database hosting (https://supabase.com)
- **Sentry** (optional): Error tracking (https://sentry.io)
- **Hosting Platform**: One of:
  - Vercel (recommended for frontend + serverless)
  - Render (full-stack deployment)
  - Railway (full-stack deployment)
  - AWS/GCP/Azure (advanced)

---

## Environment Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-64-chars-recommended"
SECRET_KEY="your-encryption-secret-min-64-chars-for-crypto"

# Application
NODE_ENV="development" # or "staging" or "production"
BASE_URL="http://localhost:3000" # or your deployment URL

# Error Tracking (Optional)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# Supabase (if using direct connection)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Generating Secrets

**JWT_SECRET & SECRET_KEY**:
```bash
# Generate secure random strings (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Important**: Use different secrets for staging and production!

---

## Database Setup

### Option 1: Supabase (Recommended)

1. **Create Supabase Project**
   ```
   Visit: https://app.supabase.com
   Create new project
   Wait for provisioning (~2 minutes)
   ```

2. **Get Connection String**
   ```
   Project Settings → Database → Connection String (Pooler)
   Copy the connection string
   Add to .env as DATABASE_URL
   ```

3. **Run Migrations**
   ```bash
   npm install
   npx prisma migrate deploy
   ```

4. **Verify Schema**
   ```bash
   npx prisma studio
   # Opens browser to view database
   ```

### Option 2: Self-Hosted PostgreSQL

1. **Install PostgreSQL 14+**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql-14

   # macOS
   brew install postgresql@14
   ```

2. **Create Database**
   ```bash
   psql -U postgres
   CREATE DATABASE optropic_platform;
   CREATE USER optropic_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE optropic_platform TO optropic_user;
   \q
   ```

3. **Configure Connection**
   ```bash
   DATABASE_URL="postgresql://optropic_user:secure_password@localhost:5432/optropic_platform"
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

---

## Local Development

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd optropic-platform

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Copy environment template
cp .env.example .env
# Edit .env with your values

# Run migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

### Development Server

```bash
npm run dev
# Opens at http://localhost:3000
```

### Available Commands

```bash
npm run dev          # Start dev server with HMR
npm run build        # Build for production
npm run start        # Start production server
npm run preview      # Preview production build
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run typecheck    # Check TypeScript errors
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npx prisma studio    # Open database GUI
```

---

## Staging Deployment

### Step 1: Prepare Staging Environment

**Create Staging Database (Supabase)**:
1. Create new Supabase project: `optropic-staging`
2. Copy connection string
3. Store as `DATABASE_URL_STAGING`

**Configure Staging Secrets**:
```bash
# .env.staging
DATABASE_URL="<staging-database-url>"
JWT_SECRET="<different-secret-from-prod>"
SECRET_KEY="<different-secret-from-prod>"
NODE_ENV="staging"
BASE_URL="https://staging.yourdomain.com"
SENTRY_DSN="<staging-sentry-dsn>"
```

### Step 2: Deploy to Vercel (Recommended)

**Install Vercel CLI**:
```bash
npm i -g vercel
```

**Deploy to Staging**:
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add SECRET_KEY production
vercel env add NODE_ENV production
vercel env add BASE_URL production
vercel env add SENTRY_DSN production

# Redeploy with env vars
vercel --prod
```

**Configure Custom Domain**:
```bash
vercel domains add staging.yourdomain.com
```

### Step 3: Run Migrations on Staging

```bash
# Set staging database URL locally
DATABASE_URL="<staging-database-url>" npx prisma migrate deploy

# Or use Vercel CLI
vercel env pull .env.staging
npx prisma migrate deploy
```

### Step 4: Verify Staging Deployment

**Health Check**:
```bash
curl https://staging.yourdomain.com/api/health
# Should return: {"status":"healthy",...}
```

**Metrics Check**:
```bash
curl https://staging.yourdomain.com/api/metrics
# Should return Prometheus metrics
```

**Test Authentication**:
```bash
# Login test
curl -X POST https://staging.yourdomain.com/api/trpc/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Staging environment validated
- [ ] Database backups configured
- [ ] Monitoring dashboards set up
- [ ] Sentry configured and tested
- [ ] SSL/TLS certificates configured
- [ ] Environment variables secured
- [ ] Rollback plan documented

### Step 1: Production Database Setup

**Create Production Database (Supabase)**:
1. Create new Supabase project: `optropic-production`
2. Enable Point-in-Time Recovery (PITR)
3. Configure automated backups
4. Copy connection string

**Production Environment Variables**:
```bash
# .env.production
DATABASE_URL="<production-database-url>"
JWT_SECRET="<unique-production-secret-64-chars>"
SECRET_KEY="<unique-production-secret-64-chars>"
NODE_ENV="production"
BASE_URL="https://yourdomain.com"
SENTRY_DSN="<production-sentry-dsn>"
```

### Step 2: Deploy to Production

**Vercel Production Deployment**:
```bash
# Create production project
vercel --prod

# Add production environment variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add SECRET_KEY production
vercel env add NODE_ENV production
vercel env add BASE_URL production
vercel env add SENTRY_DSN production

# Deploy
vercel --prod

# Assign custom domain
vercel domains add yourdomain.com
```

**Alternative: Render Deployment**:

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: optropic-platform
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: SECRET_KEY
        generateValue: true
      - key: NODE_ENV
        value: production
      - key: BASE_URL
        sync: false
```

2. Connect GitHub repository
3. Configure environment variables
4. Deploy

### Step 3: Run Production Migrations

```bash
# Connect to production database
DATABASE_URL="<production-database-url>" npx prisma migrate deploy

# Verify migration status
DATABASE_URL="<production-database-url>" npx prisma migrate status
```

### Step 4: Verify Production Deployment

**Automated Health Check**:
```bash
./scripts/verify-deployment.sh https://yourdomain.com
```

**Manual Verification**:
```bash
# Health check
curl https://yourdomain.com/api/health

# Metrics endpoint
curl https://yourdomain.com/api/metrics

# Test authentication flow
curl -X POST https://yourdomain.com/api/trpc/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"secure_password"}'
```

---

## Docker Deployment

### Build Docker Image

**Dockerfile** (already provided in `docker/Dockerfile`):
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Build and Run**:
```bash
# Build image
docker build -t optropic-platform:latest .

# Run container
docker run -d \
  --name optropic-platform \
  -p 3000:3000 \
  --env-file .env.production \
  optropic-platform:latest
```

### Docker Compose Deployment

**docker-compose.yml** (already provided):
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: optropic_platform
      POSTGRES_USER: optropic_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy with Docker Compose**:
```bash
docker-compose up -d
```

---

## Monitoring Setup

### Sentry Configuration

1. **Create Sentry Project**:
   - Visit https://sentry.io
   - Create new project (Node.js)
   - Copy DSN

2. **Add to Environment**:
   ```bash
   SENTRY_DSN="https://xxx@sentry.io/xxx"
   ```

3. **Verify Integration**:
   ```bash
   # Trigger test error
   curl https://yourdomain.com/api/test-error
   # Check Sentry dashboard for error
   ```

### Prometheus + Grafana Setup

**Option 1: Grafana Cloud** (Recommended)

1. **Create Grafana Cloud Account**:
   - Visit https://grafana.com/auth/sign-up/create-user
   - Create free account

2. **Add Prometheus Data Source**:
   ```yaml
   # prometheus.yml
   scrape_configs:
     - job_name: 'optropic-platform'
       scrape_interval: 15s
       static_configs:
         - targets: ['yourdomain.com']
       metrics_path: '/api/metrics'
   ```

3. **Import Dashboard**:
   - Use Dashboard ID: 15759 (Node.js Application Dashboard)
   - Or create custom dashboard (see below)

**Option 2: Self-Hosted**

1. **Install Prometheus**:
   ```bash
   docker run -d \
     --name prometheus \
     -p 9090:9090 \
     -v ./prometheus.yml:/etc/prometheus/prometheus.yml \
     prom/prometheus
   ```

2. **Install Grafana**:
   ```bash
   docker run -d \
     --name grafana \
     -p 3001:3000 \
     grafana/grafana
   ```

3. **Configure Prometheus Scraping**:
   ```yaml
   # prometheus.yml
   global:
     scrape_interval: 15s
     evaluation_interval: 15s

   scrape_configs:
     - job_name: 'optropic-platform'
       static_configs:
         - targets: ['host.docker.internal:3000']
       metrics_path: '/api/metrics'
   ```

4. **Access Dashboards**:
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001

### Grafana Dashboard Configuration

**Create Dashboard JSON** (save as `grafana-dashboard.json`):
```json
{
  "dashboard": {
    "title": "Optropic Platform Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(optropic_http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Request Duration (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(optropic_http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(optropic_errors_total[5m])"
          }
        ]
      },
      {
        "title": "Database Query Duration",
        "targets": [
          {
            "expr": "rate(optropic_db_query_duration_seconds_sum[5m]) / rate(optropic_db_query_duration_seconds_count[5m])"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "process_resident_memory_bytes"
          }
        ]
      },
      {
        "title": "Authentication Success Rate",
        "targets": [
          {
            "expr": "rate(optropic_auth_attempts_total{status=\"success\"}[5m]) / rate(optropic_auth_attempts_total[5m])"
          }
        ]
      }
    ]
  }
}
```

**Import to Grafana**:
```bash
curl -X POST http://localhost:3001/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <api-key>" \
  -d @grafana-dashboard.json
```

---

## Load Testing

### Using Apache Bench (ab)

**Install**:
```bash
# Ubuntu/Debian
sudo apt install apache2-utils

# macOS
brew install apache-bench
```

**Test Health Endpoint**:
```bash
ab -n 1000 -c 10 https://yourdomain.com/api/health
# 1000 requests, 10 concurrent
```

**Test Authentication**:
```bash
ab -n 100 -c 5 -p login-data.json -T application/json \
  https://yourdomain.com/api/trpc/login
```

### Using k6 (Recommended)

**Install k6**:
```bash
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Create Test Script** (`loadtest.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
  },
};

export default function () {
  // Health check
  const healthRes = http.get('https://yourdomain.com/api/health');
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health check passes': (r) => JSON.parse(r.body).status === 'healthy',
  });

  sleep(1);

  // Metrics endpoint
  const metricsRes = http.get('https://yourdomain.com/api/metrics');
  check(metricsRes, {
    'metrics status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

**Run Load Test**:
```bash
k6 run loadtest.js
```

**Expected Results** (for production-ready):
- Request duration P95: < 500ms
- Error rate: < 1%
- Throughput: > 100 req/s
- Success rate: > 99%

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```
Error: Can't reach database server
```

**Solution**:
- Verify DATABASE_URL is correct
- Check database is running
- Verify network connectivity
- Check Supabase project status

**2. JWT Token Invalid**
```
Error: Invalid or expired token
```

**Solution**:
- Verify JWT_SECRET matches between environments
- Check token expiration (1 hour for access tokens)
- Use refresh token to get new access token

**3. Build Fails**
```
Error: Module not found
```

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npm run build
```

**4. Migrations Failed**
```
Error: Migration failed
```

**Solution**:
```bash
# Reset migrations (CAUTION: Data loss)
npx prisma migrate reset

# Or fix manually
npx prisma migrate resolve --rolled-back "migration-name"
npx prisma migrate deploy
```

### Health Check Diagnostics

```bash
# Check all endpoints
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/metrics

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check logs
# Vercel: vercel logs
# Render: render logs
# Docker: docker logs optropic-platform
```

---

## Rollback Procedures

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Database Rollback

```bash
# Revert last migration
npx prisma migrate resolve --rolled-back "20251005162758_add_refresh_tokens"

# Restore from backup
pg_restore -d $DATABASE_URL backup.sql
```

---

## Security Best Practices

1. **Never commit secrets**:
   - Use environment variables
   - Add .env to .gitignore

2. **Rotate secrets regularly**:
   - JWT_SECRET every 90 days
   - Database passwords every 90 days

3. **Use strong secrets**:
   - Minimum 64 characters
   - Cryptographically random

4. **Enable HTTPS**:
   - Required for production
   - Configure SSL certificates

5. **Database security**:
   - Use connection pooling
   - Enable SSL for database connections
   - Restrict database access by IP

6. **Monitor security**:
   - Set up Sentry alerts
   - Monitor failed authentication attempts
   - Track API error rates

---

## Support

**Documentation**:
- Database Security: See `DATABASE_SECURITY.md`
- Platform Audit: See `PLATFORM_AUDIT_REPORT.md`
- API Reference: See `API_REFERENCE.md`

**Monitoring**:
- Health: `https://yourdomain.com/api/health`
- Metrics: `https://yourdomain.com/api/metrics`

**Emergency Contacts**:
- Technical Lead: [Contact Info]
- DevOps Team: [Contact Info]
- Security Team: [Contact Info]

---

**Last Updated**: 2025-10-05
**Version**: 3.0.0
**Maintained By**: Optropic Platform Team
