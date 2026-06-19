-- Security & Integrity Migration
-- Applies two hardening changes:
--   1. FK constraint: lessons.course_id → courses.id (ON DELETE CASCADE)
--   2. audit_logs table for recording sensitive admin actions
-- All statements are idempotent (IF NOT EXISTS / DO $$ blocks).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Foreign key: lessons.course_id → courses.id
--    Prevents orphaned lessons if a course is deleted outside the ORM.
--    CASCADE means deleting a course removes all its lessons automatically.
--    NOTE: If any orphaned lessons exist, remove them first with:
--      DELETE FROM lessons WHERE course_id NOT IN (SELECT id FROM courses);
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lessons_course_id_fk'
      AND table_name = 'lessons'
  ) THEN
    ALTER TABLE lessons
      ADD CONSTRAINT lessons_course_id_fk
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. audit_logs table
--    Records sensitive admin actions (CSV exports, role changes, etc.)
--    for security auditing and incident response.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         serial PRIMARY KEY,
  admin_id   text        NOT NULL,
  action     text        NOT NULL,
  target_type text,
  target_id  text,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_admin_id_idx  ON audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
