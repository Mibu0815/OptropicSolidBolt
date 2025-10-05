# Optropic Platform - Database Security Documentation

## Overview

This document describes the Row Level Security (RLS) implementation for multi-tenant data isolation in the Optropic Platform. RLS is a PostgreSQL feature that provides fine-grained access control at the database row level.

## Table of Contents

1. [Architecture](#architecture)
2. [Tenant Model](#tenant-model)
3. [RLS Policies](#rls-policies)
4. [Implementation Details](#implementation-details)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting](#troubleshooting)

## Architecture

### Multi-Tenancy Model

The Optropic Platform uses a **hierarchical tenant model**:

- Each user belongs to a tenant (via `User.tenantId`)
- Top-level tenants reference themselves (`tenantId = id`)
- Sub-users inherit their parent's `tenantId`
- All tenant-scoped tables include a `tenantId` column

### Tenant-Scoped Tables

The following tables have RLS policies enabled:

| Table | Description | RLS Enabled |
|-------|-------------|-------------|
| `users` | User accounts | ✅ |
| `projects` | Project management | ✅ |
| `keys` | Cryptographic keys | ✅ |
| `optropic_codes` | QR codes & identifiers | ✅ |
| `assets` | Physical/digital assets | ✅ |
| `contents` | Content management | ✅ |
| `scans` | Scan event logs | ✅ (read-only) |
| `notifications` | User notifications | ✅ |
| `activity_logs` | Audit logs | ✅ |
| `analytics_cache` | Analytics cache | ✅ |
| `tenant_config_packs` | Tenant configurations | ✅ |
| `role_archetypes` | Role definitions | ✅ |
| `tenant_role_mappings` | Tenant role mappings | ✅ |

## Tenant Model

### User-Tenant Relationship

```sql
-- Users table structure
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "tenantId" INTEGER REFERENCES users(id), -- Self-referencing for top-level tenants
  role TEXT NOT NULL,
  ...
);
```

### Tenant Hierarchy Examples

**Example 1: Top-Level Tenant**
```
User ID: 100
tenantId: 100 (self-reference)
Role: ADMIN
```

**Example 2: Sub-User**
```
User ID: 101
tenantId: 100 (references admin user)
Role: OPERATOR
```

## RLS Policies

### Policy Pattern

All tenant-scoped tables follow this pattern:

1. **SELECT Policy**: View records from own tenant only
2. **INSERT Policy**: Create records with own tenantId
3. **UPDATE Policy**: Modify records from own tenant only
4. **DELETE Policy**: Remove records from own tenant only

### Helper Function

```sql
CREATE FUNCTION get_user_tenant_id(user_id INTEGER)
RETURNS INTEGER AS $$
  SELECT COALESCE("tenantId", id) FROM users WHERE id = user_id;
$$ LANGUAGE SQL STABLE;
```

This function returns:
- User's `tenantId` if set (sub-user)
- User's own `id` if `tenantId` is NULL (top-level tenant)

### Example Policy: Projects Table

```sql
-- SELECT: Users can view projects from their tenant
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id)
    FROM users
    WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- INSERT: Users can create projects with their tenantId
CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id)
    FROM users
    WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- UPDATE: Users can update their tenant's projects
CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id)
    FROM users
    WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ))
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id)
    FROM users
    WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- DELETE: Users can delete their tenant's projects
CREATE POLICY "projects_delete_policy" ON projects
  FOR DELETE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id)
    FROM users
    WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));
```

## Implementation Details

### Database Session Configuration

RLS policies rely on the PostgreSQL `current_setting()` function to identify the current user:

```javascript
// Example: Setting user context in application
await db.$executeRaw`SET LOCAL app.current_user_id = ${userId}`;
```

### Prisma Integration

**Important**: As of now, Prisma does not automatically set the user context. Application code must:

1. Set the user context at the beginning of each transaction
2. Ensure `current_setting('app.current_user_id')` is available
3. Use service role credentials for system operations that bypass RLS

### TenantId Propagation

When creating records, `tenantId` is automatically derived from relationships:

```javascript
// Create project - tenantId inherited from user
const project = await db.project.create({
  data: {
    name: "New Project",
    userId: currentUser.id,
    tenantId: currentUser.tenantId || currentUser.id,
  },
});

// Create key - tenantId inherited from project
const key = await db.key.create({
  data: {
    keyName: "Signing Key",
    projectId: project.id,
    tenantId: project.tenantId,
  },
});
```

## Testing & Verification

### Manual Testing

**1. Verify RLS is Enabled**

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**2. List All Policies**

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**3. Test Policy Enforcement**

```sql
-- Set user context
SET app.current_user_id = 1;

-- Try to access another tenant's data
SELECT * FROM projects WHERE "tenantId" = 2;
-- Should return empty result

-- Access own tenant's data
SELECT * FROM projects WHERE "tenantId" = 1;
-- Should return results
```

### Automated Testing

Create integration tests that verify:

1. Users cannot access other tenants' data
2. INSERT operations enforce tenantId
3. UPDATE operations prevent cross-tenant modifications
4. DELETE operations respect tenant boundaries

```typescript
// Example test
it("should prevent cross-tenant data access", async () => {
  const tenant1User = await createUser({ tenantId: 1 });
  const tenant2User = await createUser({ tenantId: 2 });

  const tenant1Project = await createProject({
    userId: tenant1User.id,
    tenantId: 1
  });

  // Attempt to access from tenant2
  const result = await db.project.findMany({
    where: { id: tenant1Project.id }
  });

  expect(result).toHaveLength(0); // RLS should prevent access
});
```

## Troubleshooting

### Common Issues

**1. Empty Result Sets**

**Symptom**: Queries return no results even when data exists

**Cause**: `current_setting('app.current_user_id')` is not set

**Solution**:
```javascript
// Always set user context before queries
await db.$executeRaw`SET LOCAL app.current_user_id = ${ctx.user.id}`;
```

**2. Permission Denied Errors**

**Symptom**: `permission denied for table X`

**Cause**: RLS policy blocks the operation

**Solution**:
- Verify user has correct `tenantId`
- Check if policy conditions are met
- Use service role for system operations

**3. Policies Not Applied**

**Symptom**: Users can access other tenants' data

**Cause**: RLS not enabled on table

**Solution**:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Debugging Queries

```sql
-- Check current user context
SELECT current_setting('app.current_user_id', true);

-- View user's effective tenantId
SELECT id, "tenantId", get_user_tenant_id(id) as effective_tenant_id
FROM users
WHERE id = current_setting('app.current_user_id', true)::INTEGER;

-- Test policy with EXPLAIN
EXPLAIN (ANALYZE, VERBOSE, BUFFERS)
SELECT * FROM projects WHERE "tenantId" = 1;
```

## Security Best Practices

1. **Always Use Prepared Statements**: Prevent SQL injection
2. **Set User Context in Middleware**: Ensure every request has proper context
3. **Use Service Role Sparingly**: Only for system operations
4. **Audit Logs**: Track all tenant data access
5. **Regular Policy Reviews**: Verify policies match business requirements
6. **Test Cross-Tenant Access**: Continuously verify isolation
7. **Monitor Failed Access Attempts**: Alert on RLS violations

## Migration Strategy

### Adding RLS to Existing Tables

1. Backup database
2. Add `tenantId` column
3. Populate `tenantId` from relationships
4. Create RLS policies
5. Test thoroughly in staging
6. Deploy to production
7. Monitor query performance

### Removing Tenant Access

To revoke tenant access to specific data:

```sql
-- Option 1: Soft delete
UPDATE projects SET "isActive" = false WHERE "tenantId" = X;

-- Option 2: Change ownership
UPDATE projects SET "tenantId" = new_tenant_id WHERE id = Y;

-- Option 3: Hard delete (use with caution)
DELETE FROM projects WHERE id = Z AND "tenantId" = current_tenant_id;
```

## Performance Considerations

1. **Indexes**: Ensure `tenantId` columns are indexed
2. **Query Planning**: RLS policies add overhead to queries
3. **Connection Pooling**: Consider per-tenant connection pools
4. **Caching**: Cache tenant-specific data appropriately
5. **Monitoring**: Track query performance with tenant filters

## Compliance

RLS supports compliance with:

- **GDPR**: Data isolation and right to be forgotten
- **HIPAA**: Protected health information isolation
- **SOC 2**: Access control and audit logging
- **ISO 27001**: Information security management

## References

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)

---

**Last Updated**: 2025-10-05
**Version**: 1.0.0
**Maintained by**: Optropic Platform Team
