# Production Deployment Checklist
**Optropic Platform v3.0.0**
**Date**: 2025-10-05

---

## Pre-Deployment Requirements

### 1. Code Quality ✅

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] Linter checks passing (`npm run lint`)
- [ ] Production build successful (`npm run build`)
- [ ] Code reviewed and approved
- [ ] No critical security vulnerabilities

**Verification**:
```bash
npm test && npm run typecheck && npm run build
```

---

### 2. Environment Configuration 🔐

- [ ] Production `.env` file created
- [ ] All required environment variables set:
  - [ ] `DATABASE_URL` (production database)
  - [ ] `JWT_SECRET` (64+ characters, unique)
  - [ ] `SECRET_KEY` (64+ characters, unique)
  - [ ] `NODE_ENV=production`
  - [ ] `BASE_URL` (production URL)
  - [ ] `SENTRY_DSN` (optional but recommended)
- [ ] Secrets stored securely (Vercel/Render secrets, not in repo)
- [ ] Different secrets from staging
- [ ] `.env` file added to `.gitignore`

**Verification**:
```bash
# Check .env.production has all required vars
grep -E "(DATABASE_URL|JWT_SECRET|SECRET_KEY|NODE_ENV|BASE_URL)" .env.production
```

---

### 3. Database Setup 💾

- [ ] Production database provisioned (Supabase recommended)
- [ ] Database backups configured
- [ ] Point-in-Time Recovery (PITR) enabled
- [ ] Connection pooling configured
- [ ] SSL/TLS enabled for database connections
- [ ] All migrations applied successfully
- [ ] RLS policies verified
- [ ] Database performance tested

**Verification**:
```bash
# Run migrations
DATABASE_URL="<production-db-url>" npx prisma migrate deploy

# Verify migration status
DATABASE_URL="<production-db-url>" npx prisma migrate status

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

---

### 4. Security Configuration 🔒

- [ ] SSL/TLS certificates configured
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Helmet.js or equivalent security headers
- [ ] Content Security Policy (CSP) configured
- [ ] SQL injection protection verified (Prisma)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Sensitive data not exposed in logs
- [ ] Error messages sanitized (no stack traces to clients)

**Verification**:
```bash
# Check SSL
curl -I https://yourdomain.com | grep -i "strict-transport-security"

# Verify CORS
curl -H "Origin: https://unauthorized.com" https://yourdomain.com/api/health
```

---

### 5. Monitoring & Observability 📊

- [ ] Sentry error tracking configured
- [ ] Sentry DSN set in environment
- [ ] Test error reported to Sentry
- [ ] Prometheus metrics endpoint accessible
- [ ] Grafana dashboard created
- [ ] Alert rules configured
- [ ] Health check endpoint operational
- [ ] Logging configured (structured JSON logs)
- [ ] Log aggregation set up (optional: Datadog, CloudWatch)

**Verification**:
```bash
# Health check
curl https://yourdomain.com/api/health

# Metrics
curl https://yourdomain.com/api/metrics | grep optropic_

# Trigger test error (in staging)
curl https://staging.yourdomain.com/api/test-error
# Check Sentry dashboard
```

---

### 6. Performance Testing ⚡

- [ ] Load testing completed successfully
- [ ] P95 latency < 500ms
- [ ] P99 latency < 1000ms
- [ ] Error rate < 1%
- [ ] Memory usage stable under load
- [ ] No memory leaks detected
- [ ] Database query performance optimized
- [ ] CDN configured (if needed)
- [ ] Static assets optimized

**Verification**:
```bash
# Run load test against staging
cd loadtest
BASE_URL=https://staging.yourdomain.com k6 run k6-loadtest.js

# Check results meet thresholds
```

---

### 7. Deployment Platform 🚀

- [ ] Hosting platform selected (Vercel/Render/AWS/etc)
- [ ] Account created and verified
- [ ] Billing configured
- [ ] Auto-scaling configured
- [ ] Geographic regions selected
- [ ] Custom domain configured
- [ ] DNS records updated
- [ ] CDN enabled (if available)

**Platform-Specific Checklists**:

**Vercel**:
- [ ] Project created
- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] Custom domain added
- [ ] SSL certificate provisioned

**Render**:
- [ ] Service created
- [ ] `render.yaml` configured
- [ ] Environment variables set
- [ ] Health check path configured
- [ ] Auto-deploy enabled

---

### 8. Backup & Recovery 💾

- [ ] Database backup strategy defined
- [ ] Automated daily backups configured
- [ ] Backup retention policy set (30+ days)
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined
- [ ] Rollback procedure documented

**Verification**:
```bash
# Create test backup
pg_dump $DATABASE_URL > backup-test.sql

# Verify backup size
ls -lh backup-test.sql

# Test restoration (on staging)
psql $STAGING_DATABASE_URL < backup-test.sql
```

---

## Deployment Steps

### Step 1: Final Code Freeze 🔒

- [ ] Create release branch (`release/v3.0.0`)
- [ ] All features merged to main/master
- [ ] All tests passing on main branch
- [ ] Code freeze communicated to team
- [ ] Release notes prepared

```bash
git checkout -b release/v3.0.0
git push origin release/v3.0.0
```

---

### Step 2: Staging Deployment & Validation ✅

- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Verify all features working
- [ ] Test authentication flow
- [ ] Test critical user paths
- [ ] Load test against staging
- [ ] Monitor staging for 24 hours
- [ ] No critical issues found

```bash
# Deploy to staging
vercel --prod --environment=staging

# Run smoke tests
npm run test:e2e

# Load test
BASE_URL=https://staging.yourdomain.com k6 run loadtest/k6-loadtest.js
```

---

### Step 3: Production Database Migration 💾

- [ ] Create database backup
- [ ] Run migrations on production database
- [ ] Verify migration success
- [ ] Test database connectivity
- [ ] Verify RLS policies active

```bash
# Backup production database
pg_dump $PRODUCTION_DATABASE_URL > backup-pre-deploy-$(date +%Y%m%d).sql

# Run migrations
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma migrate deploy

# Verify
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma migrate status
```

---

### Step 4: Production Deployment 🚀

- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Check health endpoint
- [ ] Check metrics endpoint
- [ ] Test authentication
- [ ] Monitor error rates
- [ ] Monitor latency
- [ ] Monitor memory usage

```bash
# Deploy to production
vercel --prod

# Verify health
curl https://yourdomain.com/api/health

# Monitor
watch -n 5 "curl -s https://yourdomain.com/api/metrics | grep -E '(http_requests_total|errors_total)'"
```

---

### Step 5: Post-Deployment Verification ✅

- [ ] All critical paths working
- [ ] Authentication functional
- [ ] Database queries working
- [ ] No error spikes in Sentry
- [ ] Latency within acceptable range
- [ ] Memory usage stable
- [ ] No user-reported issues
- [ ] Monitoring dashboards green

**Verification Commands**:
```bash
# Test authentication
curl -X POST https://yourdomain.com/api/trpc/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check error rate
curl -s https://yourdomain.com/api/metrics | grep optropic_errors_total

# Monitor for 1 hour
# Watch dashboards, check Sentry, review logs
```

---

### Step 6: Monitoring & Alerting Setup 📊

- [ ] Grafana dashboards operational
- [ ] Alert rules configured
- [ ] Notification channels set up (Slack/Email/PagerDuty)
- [ ] On-call rotation defined
- [ ] Escalation policy documented
- [ ] First alert received and verified

**Alert Channels to Configure**:
- High error rate alert
- High latency alert
- Service down alert
- High memory usage alert
- Database connection issues alert

---

### Step 7: Documentation Update 📝

- [ ] README.md updated with production info
- [ ] API documentation current
- [ ] Deployment guide verified
- [ ] Runbook created for common issues
- [ ] Contact information updated
- [ ] Architecture diagram current
- [ ] Release notes published

---

### Step 8: Team Communication 📢

- [ ] Deployment announcement sent
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Known issues documented
- [ ] Monitoring links shared
- [ ] Feedback channels opened

---

## Post-Deployment Monitoring (First 24 Hours)

### Hour 1: Critical Monitoring ⏰

- [ ] Health checks passing
- [ ] Error rate < 1%
- [ ] Latency P95 < 500ms
- [ ] No Sentry alerts
- [ ] Database connections healthy
- [ ] Memory usage stable

### Hour 6: Stability Check ⏰

- [ ] No increase in error rates
- [ ] Latency remains stable
- [ ] No memory leaks detected
- [ ] Database performance good
- [ ] No user-reported issues

### Hour 24: Full Validation ⏰

- [ ] All metrics stable
- [ ] No unexpected behaviors
- [ ] User feedback positive
- [ ] Performance baselines established
- [ ] Ready for normal operations

---

## Rollback Procedure 🔄

If critical issues are discovered:

### Immediate Rollback (< 5 minutes)

```bash
# Vercel: Rollback to previous deployment
vercel rollback <previous-deployment-url>

# Render: Rollback via dashboard or CLI
render services rollback <service-id>
```

### Database Rollback (if needed)

```bash
# Revert migrations
npx prisma migrate resolve --rolled-back "migration-name"

# Restore from backup
pg_restore -d $DATABASE_URL backup-pre-deploy-YYYYMMDD.sql
```

### Communication

- [ ] Announce rollback to stakeholders
- [ ] Create incident report
- [ ] Schedule post-mortem
- [ ] Document issues and learnings

---

## Success Criteria ✨

Deployment is considered successful when:

- ✅ All deployment steps completed
- ✅ Health checks passing for 24 hours
- ✅ Error rate < 1%
- ✅ Latency P95 < 500ms
- ✅ No critical bugs reported
- ✅ Monitoring operational
- ✅ Team confident in stability

---

## Contacts & Resources

**Emergency Contacts**:
- Technical Lead: [Contact]
- DevOps: [Contact]
- Database Admin: [Contact]
- Security: [Contact]

**Resources**:
- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- Security Documentation: `DATABASE_SECURITY.md`
- Platform Audit: `PLATFORM_AUDIT_REPORT.md`
- Monitoring Dashboard: [Grafana URL]
- Error Tracking: [Sentry URL]
- Status Page: [URL]

---

**Checklist Version**: 1.0.0
**Last Updated**: 2025-10-05
**Next Review**: Post-deployment
