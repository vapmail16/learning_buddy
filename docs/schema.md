# Learning Buddy — Database Schema

PostgreSQL schema for Phase 1. Managed by `node-pg-migrate` in `backend/migrations/`.

## Tables

### users

| Column         | Type         | Nullable | Default           | Description        |
|----------------|--------------|----------|-------------------|--------------------|
| id             | serial       | NO       | —                 | Primary key        |
| email          | varchar(255) | NO       | —                 | Unique, for login  |
| password_hash  | varchar(255) | NO       | —                 | Hashed password    |
| created_at     | timestamp    | NO       | current_timestamp |                    |

- **Unique:** `email`
- **Index:** `users_email_idx` on `email`

---

### courses

| Column     | Type         | Nullable | Default           | Description   |
|------------|--------------|----------|-------------------|---------------|
| id         | serial       | NO       | —                 | Primary key   |
| user_id    | integer      | NO       | —                 | FK → users(id) |
| name       | varchar(255) | NO       | —                 | Course name   |
| created_at | timestamp    | NO       | current_timestamp |               |

- **Foreign key:** `user_id` → `users(id)` ON DELETE CASCADE
- **Index:** `courses_user_id_idx` on `user_id`

---

### sessions

| Column       | Type      | Nullable | Default           | Description     |
|--------------|-----------|----------|-------------------|-----------------|
| id           | serial    | NO       | —                 | Primary key     |
| course_id    | integer   | NO       | —                 | FK → courses(id) |
| title        | varchar(255) | NO    | —                 | Session title   |
| session_date | date      | YES      | —                 | Optional date   |
| created_at   | timestamp | NO       | current_timestamp |                 |

- **Foreign key:** `course_id` → `courses(id)` ON DELETE CASCADE
- **Index:** `sessions_course_id_idx` on `course_id`

---

### uploads

| Column           | Type         | Nullable | Default           | Description          |
|------------------|--------------|----------|-------------------|----------------------|
| id               | serial       | NO       | —                 | Primary key          |
| session_id       | integer      | NO       | —                 | FK → sessions(id)     |
| file_path        | varchar(512) | NO       | —                 | Path under public/    |
| original_filename| varchar(255) | NO      | —                 | Original file name   |
| file_type        | varchar(64)  | YES      | —                 | e.g. image, pdf      |
| created_at       | timestamp    | NO       | current_timestamp |                      |

- **Foreign key:** `session_id` → `sessions(id)` ON DELETE CASCADE
- **Index:** `uploads_session_id_idx` on `session_id`

---

### notes

| Column     | Type      | Nullable | Default           | Description (extracted content) |
|------------|-----------|----------|-------------------|---------------------------------|
| id         | serial    | NO       | —                 | Primary key                      |
| session_id | integer   | NO       | —                 | FK → sessions(id)                |
| content    | text      | YES      | —                 | Main text                        |
| table_data | jsonb     | YES      | —                 | Tables as JSON                   |
| highlights | jsonb     | YES      | —                 | Highlights as JSON               |
| updated_at | timestamp | NO       | current_timestamp | Last update                     |

- **Foreign key:** `session_id` → `sessions(id)` ON DELETE CASCADE
- **Index:** `notes_session_id_idx` on `session_id`

---

## Relationships

```
users 1 —→ * courses
courses 1 —→ * sessions
sessions 1 —→ * uploads
sessions 1 —→ * notes
```

## Migrations

- **Up:** `cd backend && npm run migrate:up` (uses `DATABASE_URL` from `.env`)
- **Down:** `cd backend && npm run migrate:down`
- **Reset test DB:** `cd backend && npm run db:reset` (uses `DATABASE_URL_TEST` or `DATABASE_URL`)

Ensure `learning_buddy` and `learning_buddy_test` exist (e.g. `createdb learning_buddy_test`) before running migrations or tests.
