# Learning Buddy — API Reference

Base URL: `http://localhost:3000` (or `PORT` env).

All protected routes require header: `Authorization: Bearer <JWT>`.

## Health

- **GET /health** — Returns `{ status: 'ok' }`. No auth.

## Auth

- **POST /auth/register** — Body: `{ email, password }`. Returns `201` with `{ id, email }`. `409` if email exists; `400` if missing fields.
- **POST /auth/login** — Body: `{ email, password }`. Returns `200` with `{ token, user: { id, email } }`. `401` if invalid credentials.

## Courses (all require auth)

- **POST /courses** — Body: `{ name }`. Returns `201` with course.
- **GET /courses** — Returns list of courses for the user.
- **GET /courses/:id** — Returns one course. `404` if not found or not owned.
- **GET /courses/:id/sessions** — Returns sessions for the course.
- **PATCH /courses/:id** — Body: `{ name }`. Returns updated course. `404` if not found.
- **DELETE /courses/:id** — Returns `204`. `404` if not found.

## Sessions (all require auth)

- **POST /sessions** — Body: `{ course_id, title, session_date? }`. Returns `201` with session. `404` if course not found or not owned.
- **GET /sessions/:id** — Returns one session. `404` if not found or course not owned.
- **PATCH /sessions/:id** — Body: `{ title?, session_date? }`. Returns updated session.
- **DELETE /sessions/:id** — Returns `204`.

## Uploads (all require auth)

- **POST /uploads/sessions/:sessionId** — Multipart: `file` (image or PDF). Stores under `public/uploads/`, saves metadata in DB. If `EXTRACTION_SERVICE_URL` is set and file is an image, the backend calls the extraction service and merges OCR/table/highlight results into the session note. Returns `201` with upload record. `404` if session not found or not owned; `400` if no file.

## Notes (all require auth)

- **GET /notes/sessions/:sessionId** — Returns `{ note, uploads }` for the session. `404` if session not found or not owned.
- **PUT /notes/sessions/:sessionId** — Body: `{ content?, table_data?, highlights? }`. Creates or updates note for the session. Returns the note. `404` if session not found or not owned.

## CORS

CORS is enabled for all origins (for development). Restrict in production.
