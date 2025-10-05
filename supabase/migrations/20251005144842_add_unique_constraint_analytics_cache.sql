/*
  # Add unique constraint to analytics_cache

  1. Changes
    - Add unique constraint on ("projectId", "cacheKey") for analytics_cache table
  
  2. Security
    - No RLS changes needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analytics_cache_projectId_cacheKey_key'
  ) THEN
    ALTER TABLE analytics_cache ADD CONSTRAINT analytics_cache_projectId_cacheKey_key UNIQUE ("projectId", "cacheKey");
  END IF;
END $$;
