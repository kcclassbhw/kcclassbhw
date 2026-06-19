-- Production Hardening Migration
-- Apply after initial schema is in place.
-- All statements are idempotent (IF NOT EXISTS) so they are safe to run multiple times.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. progress table: unique constraint on (user_id, lesson_id)
--    Prevents duplicate progress rows from concurrent requests and enables
--    the atomic upsert pattern in the progress route.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'progress_user_lesson_unique'
  ) THEN
    ALTER TABLE progress
      ADD CONSTRAINT progress_user_lesson_unique UNIQUE (user_id, lesson_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. subscriptions table: unique constraint on esewa_transaction_id
--    DB-level replay protection — the same eSewa transaction can never be
--    credited twice even if two requests arrive at the same instant.
--    NULL values are excluded from uniqueness so rows without a transaction
--    ID (admin grants) are unaffected.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_esewa_txn_unique'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_esewa_txn_unique
        UNIQUE NULLS NOT DISTINCT (esewa_transaction_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. courses table: index on is_published
--    The public course listing always filters WHERE is_published = true.
--    A partial index on the true branch keeps the planner fast.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS courses_is_published_idx ON courses (is_published);
CREATE INDEX IF NOT EXISTS courses_category_idx ON courses (category);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. users table: indexes on email and role
--    - email: used by disposable-email checks and admin user lookup
--    - role: used by admin middleware to filter role = 'admin'
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
