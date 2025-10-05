/*
  # Add link field to notifications

  1. Changes
    - Add optional `link` field to `notifications` table for action links
  
  2. Security
    - No RLS changes needed - existing policies remain
*/

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
