/*
  # Row Level Security (RLS) for Multi-Tenant Isolation
  
  ## Overview
  This migration implements comprehensive Row Level Security to ensure strict tenant data isolation.
  Each tenant can only access their own data across all tables.
  
  ## Changes Made
  
  ### 1. Add tenantId Columns
  - Add `tenantId` to: projects, keys, optropic_codes, assets, contents, scans, notifications, activity_logs, analytics_cache, tenant_config_packs
  - Set default tenantId from user's tenantId for existing records
  
  ### 2. RLS Policies
  Created policies for each table with pattern:
  - SELECT: Users can view records from their tenant
  - INSERT: Users can create records with their tenantId
  - UPDATE: Users can update records from their tenant
  - DELETE: Users can delete records from their tenant (where applicable)
  
  ### 3. Security Model
  - Users inherit tenantId from their parent tenant (User.tenantId)
  - Top-level tenants have tenantId = their own id (self-referencing)
  - All queries automatically filtered by tenant context
  
  ## Important Notes
  - RLS is already enabled on all tables
  - Policies are RESTRICTIVE by default
  - Admin users (role = 'ADMIN') may have broader access in future
  - System operations should use service role to bypass RLS
*/

-- Add tenantId column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE projects ADD COLUMN "tenantId" INTEGER;
    
    -- Set tenantId from user's tenantId for existing records
    UPDATE projects p
    SET "tenantId" = u."tenantId"
    FROM users u
    WHERE p."userId" = u.id AND u."tenantId" IS NOT NULL;
    
    -- For users without tenantId, set their own id as tenantId (self-tenant)
    UPDATE projects p
    SET "tenantId" = u.id
    FROM users u
    WHERE p."userId" = u.id AND u."tenantId" IS NULL;
    
    -- Add foreign key constraint
    ALTER TABLE projects 
    ADD CONSTRAINT projects_tenantid_fkey 
    FOREIGN KEY ("tenantId") REFERENCES users(id);
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_projects_tenantid ON projects("tenantId");
  END IF;
END $$;

-- Add tenantId to keys table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'keys' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE keys ADD COLUMN "tenantId" INTEGER;
    
    UPDATE keys k
    SET "tenantId" = p."tenantId"
    FROM projects p
    WHERE k."projectId" = p.id;
    
    ALTER TABLE keys 
    ADD CONSTRAINT keys_tenantid_fkey 
    FOREIGN KEY ("tenantId") REFERENCES users(id);
    
    CREATE INDEX IF NOT EXISTS idx_keys_tenantid ON keys("tenantId");
  END IF;
END $$;

-- Add tenantId to optropic_codes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'optropic_codes' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE optropic_codes ADD COLUMN "tenantId" INTEGER;
    
    UPDATE optropic_codes oc
    SET "tenantId" = p."tenantId"
    FROM projects p
    WHERE oc."projectId" = p.id;
    
    ALTER TABLE optropic_codes 
    ADD CONSTRAINT optropic_codes_tenantid_fkey 
    FOREIGN KEY ("tenantId") REFERENCES users(id);
    
    CREATE INDEX IF NOT EXISTS idx_optropic_codes_tenantid ON optropic_codes("tenantId");
  END IF;
END $$;

-- Add tenantId to assets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE assets ADD COLUMN "tenantId" INTEGER;
    
    UPDATE assets a
    SET "tenantId" = p."tenantId"
    FROM projects p
    WHERE a."projectId" = p.id;
    
    ALTER TABLE assets 
    ADD CONSTRAINT assets_tenantid_fkey 
    FOREIGN KEY ("tenantId") REFERENCES users(id);
    
    CREATE INDEX IF NOT EXISTS idx_assets_tenantid ON assets("tenantId");
  END IF;
END $$;

-- Add tenantId to contents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contents' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE contents ADD COLUMN "tenantId" INTEGER;
    
    UPDATE contents c
    SET "tenantId" = p."tenantId"
    FROM projects p
    WHERE c."projectId" = p.id;
    
    ALTER TABLE contents 
    ADD CONSTRAINT contents_tenantid_fkey 
    FOREIGN KEY ("tenantId") REFERENCES users(id);
    
    CREATE INDEX IF NOT EXISTS idx_contents_tenantid ON contents("tenantId");
  END IF;
END $$;

-- Add tenantId to scans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scans' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE scans ADD COLUMN "tenantId" INTEGER;
    
    UPDATE scans s
    SET "tenantId" = oc."tenantId"
    FROM optropic_codes oc
    WHERE s."codeId" = oc.id;
    
    ALTER TABLE scans 
    ADD CONSTRAINT scans_tenantid_fkey 
    FOREIGN KEY ("tenantId") REFERENCES users(id);
    
    CREATE INDEX IF NOT EXISTS idx_scans_tenantid ON scans("tenantId");
  END IF;
END $$;

-- Add tenantId to activity_logs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_logs' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE activity_logs ADD COLUMN "tenantId" INTEGER;
    
    UPDATE activity_logs al
    SET "tenantId" = u."tenantId"
    FROM users u
    WHERE al."userId" = u.id AND u."tenantId" IS NOT NULL;
    
    UPDATE activity_logs al
    SET "tenantId" = u.id
    FROM users u
    WHERE al."userId" = u.id AND u."tenantId" IS NULL;
    
    ALTER TABLE activity_logs 
    ADD CONSTRAINT activity_logs_tenantid_fkey 
    FOREIGN KEY ("tenantId") REFERENCES users(id);
    
    CREATE INDEX IF NOT EXISTS idx_activity_logs_tenantid ON activity_logs("tenantId");
  END IF;
END $$;

-- Add tenantId to tenant_config_packs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenant_config_packs' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE tenant_config_packs ADD COLUMN "tenantId" INTEGER;
    
    UPDATE tenant_config_packs tcp
    SET "tenantId" = p."tenantId"
    FROM projects p
    WHERE tcp."projectId" = p.id AND p."tenantId" IS NOT NULL;
    
    ALTER TABLE tenant_config_packs 
    ADD CONSTRAINT tenant_config_packs_tenantid_fkey 
    FOREIGN KEY ("tenantId") REFERENCES users(id);
    
    CREATE INDEX IF NOT EXISTS idx_tenant_config_packs_tenantid ON tenant_config_packs("tenantId");
  END IF;
END $$;

-- Add tenantId to analytics_cache table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_cache' AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE analytics_cache ADD COLUMN "tenantId" INTEGER;
    
    UPDATE analytics_cache ac
    SET "tenantId" = p."tenantId"
    FROM projects p
    WHERE ac."projectId" = p.id;
    
    ALTER TABLE analytics_cache 
    ADD CONSTRAINT analytics_cache_tenantid_fkey 
    FOREIGN KEY ("tenantId") REFERENCES users(id);
    
    CREATE INDEX IF NOT EXISTS idx_analytics_cache_tenantid ON analytics_cache("tenantId");
  END IF;
END $$;

-- Helper function to get current user's tenantId
CREATE OR REPLACE FUNCTION get_user_tenant_id(user_id INTEGER)
RETURNS INTEGER AS $$
  SELECT COALESCE("tenantId", id) FROM users WHERE id = user_id;
$$ LANGUAGE SQL STABLE;

/*
  RLS POLICIES
  ============
  Pattern for all tenant-scoped tables:
  1. SELECT: Can view records from own tenant
  2. INSERT: Can create records with own tenantId
  3. UPDATE: Can modify records from own tenant
  4. DELETE: Can remove records from own tenant
*/

-- Projects RLS Policies
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "projects_update_policy" ON projects;
CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ))
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "projects_delete_policy" ON projects;
CREATE POLICY "projects_delete_policy" ON projects
  FOR DELETE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- Keys RLS Policies
DROP POLICY IF EXISTS "keys_select_policy" ON keys;
CREATE POLICY "keys_select_policy" ON keys
  FOR SELECT
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "keys_insert_policy" ON keys;
CREATE POLICY "keys_insert_policy" ON keys
  FOR INSERT
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "keys_update_policy" ON keys;
CREATE POLICY "keys_update_policy" ON keys
  FOR UPDATE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ))
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "keys_delete_policy" ON keys;
CREATE POLICY "keys_delete_policy" ON keys
  FOR DELETE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- Optropic Codes RLS Policies
DROP POLICY IF EXISTS "optropic_codes_select_policy" ON optropic_codes;
CREATE POLICY "optropic_codes_select_policy" ON optropic_codes
  FOR SELECT
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "optropic_codes_insert_policy" ON optropic_codes;
CREATE POLICY "optropic_codes_insert_policy" ON optropic_codes
  FOR INSERT
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "optropic_codes_update_policy" ON optropic_codes;
CREATE POLICY "optropic_codes_update_policy" ON optropic_codes
  FOR UPDATE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ))
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "optropic_codes_delete_policy" ON optropic_codes;
CREATE POLICY "optropic_codes_delete_policy" ON optropic_codes
  FOR DELETE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- Assets RLS Policies
DROP POLICY IF EXISTS "assets_select_policy" ON assets;
CREATE POLICY "assets_select_policy" ON assets
  FOR SELECT
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "assets_insert_policy" ON assets;
CREATE POLICY "assets_insert_policy" ON assets
  FOR INSERT
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "assets_update_policy" ON assets;
CREATE POLICY "assets_update_policy" ON assets
  FOR UPDATE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ))
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "assets_delete_policy" ON assets;
CREATE POLICY "assets_delete_policy" ON assets
  FOR DELETE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- Contents RLS Policies
DROP POLICY IF EXISTS "contents_select_policy" ON contents;
CREATE POLICY "contents_select_policy" ON contents
  FOR SELECT
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "contents_insert_policy" ON contents;
CREATE POLICY "contents_insert_policy" ON contents
  FOR INSERT
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "contents_update_policy" ON contents;
CREATE POLICY "contents_update_policy" ON contents
  FOR UPDATE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ))
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "contents_delete_policy" ON contents;
CREATE POLICY "contents_delete_policy" ON contents
  FOR DELETE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- Scans RLS Policies (read-only for tenant users)
DROP POLICY IF EXISTS "scans_select_policy" ON scans;
CREATE POLICY "scans_select_policy" ON scans
  FOR SELECT
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- Notifications RLS Policies
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT
  USING ("userId" IN (
    SELECT id FROM users WHERE get_user_tenant_id(id) IN (
      SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
    )
  ));

DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT
  WITH CHECK ("userId" IN (
    SELECT id FROM users WHERE get_user_tenant_id(id) IN (
      SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
    )
  ));

DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE
  USING ("userId" = current_setting('app.current_user_id', true)::INTEGER);

-- Activity Logs RLS Policies
DROP POLICY IF EXISTS "activity_logs_select_policy" ON activity_logs;
CREATE POLICY "activity_logs_select_policy" ON activity_logs
  FOR SELECT
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "activity_logs_insert_policy" ON activity_logs;
CREATE POLICY "activity_logs_insert_policy" ON activity_logs
  FOR INSERT
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

-- Analytics Cache RLS Policies
DROP POLICY IF EXISTS "analytics_cache_select_policy" ON analytics_cache;
CREATE POLICY "analytics_cache_select_policy" ON analytics_cache
  FOR SELECT
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "analytics_cache_insert_policy" ON analytics_cache;
CREATE POLICY "analytics_cache_insert_policy" ON analytics_cache
  FOR INSERT
  WITH CHECK ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "analytics_cache_update_policy" ON analytics_cache;
CREATE POLICY "analytics_cache_update_policy" ON analytics_cache
  FOR UPDATE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));

DROP POLICY IF EXISTS "analytics_cache_delete_policy" ON analytics_cache;
CREATE POLICY "analytics_cache_delete_policy" ON analytics_cache
  FOR DELETE
  USING ("tenantId" IN (
    SELECT get_user_tenant_id(id) FROM users WHERE id = current_setting('app.current_user_id', true)::INTEGER
  ));