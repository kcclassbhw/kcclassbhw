# 07. DATABASE

## 1. Database Requirements
- PostgreSQL 15+ relational database.
- Schema defined using TypeScript with **Drizzle ORM**.
- Robust referential integrity with foreign keys and cascading updates/deletes where appropriate.
- Performance indexes on frequently queried search paths (e.g., `email`, `role`, `course_id`, `published`).

## 2. Entity Relationship Diagram (ERD)
```
       ┌──────────────────────┐
       │        USERS         │
       ├──────────────────────┤
       │ clerk_id (PK, text)  │◄────────┐
       │ email (text, unique) │         │
       │ password_hash (text) │         │
       │ name (text)          │         │
       │ role (text: user|adm)│         │
       │ created_at / upd_at  │         │
       └──────────┬───────────┘         │
                  │ 1                   │ 1
                  │                     │
                  │ *                   │ *
       ┌──────────▼───────────┐  ┌──────┴────────────────┐
       │    SUBSCRIPTIONS     │  │     ANNOUNCEMENTS     │
       ├──────────────────────┤  ├───────────────────────┤
       │ id (PK, serial)      │  │ id (PK, serial)       │
       │ user_id (FK -> users)│  │ title (text)          │
       │ plan (text)          │  │ content (text)        │
       │ status (active|exp)  │  │ priority (text)       │
       │ starts_at / ends_at  │  │ author_id (FK->users) │
       └──────────────────────┘  └───────────────────────┘

                  │
                  ▼
       ┌──────────────────────┐
       │       COURSES        │
       ├──────────────────────┤
       │ id (PK, serial)      │
       │ title (text)         │
       │ description (text)   │
       │ year (text: 1|2|3|4) │
       │ thumbnail_url (text) │
       │ published (boolean)  │
       └──────────┬───────────┘
                  │ 1
                  │
                  │ *
       ┌──────────▼───────────┐
       │       LESSONS        │
       ├──────────────────────┤
       │ id (PK, serial)      │
       │ course_id (FK->crs)  │
       │ title (text)         │
       │ youtube_video_id     │
       │ is_premium (boolean) │
       │ order_index (integer)│
       │ content (text)       │
       └──────────┬───────────┘
                  │ 1
                  │
                  │ *
       ┌──────────▼───────────┐
       │      RESOURCES       │
       ├──────────────────────┤
       │ id (PK, serial)      │
       │ lesson_id (FK->lsn)  │
       │ title (text)         │
       │ file_url (text)      │
       │ file_type (pdf|doc)  │
       └──────────────────────┘
```

## 3. Tables & Fields Specification
### `users` Table
- `clerk_id` (`text`, Primary Key): Unique platform identifier (format: `usr_` + 16 random hex characters).
- `email` (`text`, Not Null, Indexed): User email address.
- `password_hash` (`text`, Nullable): Salted and hashed password via `bcryptjs`.
- `name` (`text`, Not Null, Default `""`): User display name.
- `role` (`text`, Not Null, Default `"user"`, Indexed): `"user"` or `"admin"`.
- `bio` (`text`, Nullable): Optional user bio.
- `avatar_url` (`text`, Nullable): Profile picture link.
- `created_at` (`timestamp with timezone`, Not Null, Default `now()`).
- `updated_at` (`timestamp with timezone`, Not Null, Default `now()`).

### `courses` Table
- `id` (`serial`, Primary Key): Course ID.
- `title` (`text`, Not Null): Subject title (e.g. "Phonetics and Phonology").
- `slug` (`text`, Not Null, Unique): URL slug (e.g. `phonetics-and-phonology`).
- `description` (`text`, Not Null): Course overview and TU syllabus reference.
- `academic_year` (`text`, Not Null): `"1st Year"`, `"2nd Year"`, `"3rd Year"`, `"4th Year"`.
- `thumbnail_url` (`text`): Preview image asset.
- `published` (`boolean`, Default `true`).
- `created_at` / `updated_at` (`timestamp with timezone`).

### `lessons` Table
- `id` (`serial`, Primary Key): Lesson ID.
- `course_id` (`integer`, Not Null, Foreign Key referencing `courses.id`).
- `title` (`text`, Not Null): Unit or topic title.
- `youtube_video_id` (`text`, Nullable): 11-character YouTube video ID.
- `video_url` (`text`, Nullable): Full video streaming link.
- `is_premium` (`boolean`, Default `false`): Requires active subscription if `true`.
- `order_index` (`integer`, Not Null, Default `0`): Sequential display order.
- `content` (`text`): Detailed lesson notes in Markdown format.

### `resources` Table
- `id` (`serial`, Primary Key): Resource ID.
- `lesson_id` (`integer`, Not Null, Foreign Key referencing `lessons.id`).
- `title` (`text`, Not Null): E.g., "Unit 1 Lecture Slides & TU Model Questions".
- `file_url` (`text`, Not Null): PDF/Document download link.
- `file_type` (`text`, Default `"pdf"`).
- `file_size_kb` (`integer`).

### `subscriptions` Table
- `id` (`serial`, Primary Key).
- `user_id` (`text`, Not Null, Foreign Key referencing `users.clerk_id`).
- `plan` (`text`, Not Null): E.g., `"term_pass"`, `"annual_pass"`.
- `status` (`text`, Not Null): `"active"`, `"pending"`, `"expired"`.
- `payment_reference` (`text`): eSewa/Khalti/Bank transaction code.
- `starts_at` (`timestamp with timezone`).
- `expires_at` (`timestamp with timezone`).

## 4. Database Indexes
- `users_email_idx` on `users(email)`: For fast O(1) login and lookup.
- `users_role_idx` on `users(role)`: For fast admin list filtering.
- `lessons_course_id_idx` on `lessons(course_id)`: For instant course syllabus rendering.
- `subscriptions_user_status_idx` on `subscriptions(user_id, status)`: For zero-delay authorization checks on premium lessons.

## 5. Migration Strategy
- Drizzle migrations reside in `lib/db/migrations/`.
- Managed using `drizzle-kit`:
  - Generate migration: `pnpm --filter @workspace/db run generate`
  - Apply migrations: `pnpm --filter @workspace/db run push`
- All schema changes are versioned and stored in git.

## 6. Backup Strategy
- **Automated Nightly Backups:** Managed by cloud provider (Neon / Supabase) with 7-day point-in-time recovery (PITR).
- **Manual Backups:** Pre-migration `pg_dump` snapshots before applying disruptive schema alters.

## 7. Data Retention & Archival
- Student accounts remain active indefinitely unless account deletion is requested.
- Expired subscription rows are retained for historical audit trails and tax reporting.
