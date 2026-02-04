# Learning Buddy – Full Deployment Guide (DCDeploy)

**Self-contained guide** for deploying database, backend, and frontend to DCDeploy. Use this document for future deployments; no need to reference another project.

**Repo**: https://github.com/vapmail16/learning_buddy  
**Platform**: DCDeploy (https://dash.dcdeploy.com)

---

## Table of contents

1. [Overview and order of operations](#1-overview-and-order-of-operations)
2. [Database](#2-database)
3. [Backend](#3-backend)
4. [Frontend](#4-frontend)
5. [CORS and connectivity](#5-cors-and-connectivity)
6. [Verification](#6-verification)
7. [Learnings and gotchas](#7-learnings-and-gotchas)
8. [Troubleshooting](#8-troubleshooting)
9. [Quick reference](#9-quick-reference)

---

## 1. Overview and order of operations

Deploy in this order:

| Step | What | Where |
|------|------|--------|
| 1 | Create PostgreSQL database | DCDeploy dashboard → New Service → Database |
| 2 | Run schema migrations (and optionally copy data) | Your machine, using DB URL from DCDeploy |
| 3 | Deploy backend | DCDeploy → Web Service, context `./backend` |
| 4 | Deploy frontend | DCDeploy → Web Service, context `./frontend` |
| 5 | Set backend CORS to frontend URL | Backend env vars, then redeploy backend |

**Why this order**: The backend needs a live database. The frontend needs the backend URL at **build time**. The backend needs the frontend URL for **CORS** after the frontend is live.

---

## 2. Database

### 2.1 Create database on DCDeploy

1. Go to **https://dash.dcdeploy.com** → **New Service** → **Database** (or **PostgreSQL**).
2. Create the database; choose region and plan.
3. After creation, DCDeploy shows:
   - **Host** (e.g. `database-xxxxx.tcp-proxy-2212.dcdeploy.cloud`)
   - **Port** (e.g. `30216`)
   - **Database name** (e.g. `database-db`)
   - **User** and **Password**

4. Build the connection URL:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
   ```
   Example:
   ```
   postgresql://IzFRYJ:5oYc})9g1l@database-lye88yzj2e.tcp-proxy-2212.dcdeploy.cloud:30216/database-db
   ```

**Note**: Passwords may contain special characters (`{`, `}`, `)`, `]`, etc.). Use them as-is in the URL; no encoding. In shell scripts use **single quotes** so the shell does not interpret them.

### 2.2 Run schema migrations (from your machine)

Migrations are **not** run inside the backend container. Run them once from your machine against the external DB URL.

From the **project root**:

```bash
./migrate-to-remote-db.sh
```

This script:

- Uses `REMOTE_DATABASE_URL` if set; otherwise uses the URL hardcoded in the script (update the script if your DB URL is different).
- Runs all files in `backend/migrations/` (e.g. `1738500000001_initial_schema.js`, `1738500000002_notes_blocks.js`) against the remote DB.
- Backs up `backend/.env` and updates `DATABASE_URL` in `backend/.env` to the remote URL.

To use a custom URL without editing the script:

```bash
REMOTE_DATABASE_URL='postgresql://user:pass@host:port/dbname' ./migrate-to-remote-db.sh
```

**Learning**: Running migrations in the container on every start caused failures when the DB was already migrated (e.g. "relation already exists"). So migrations are run once from the repo; the container only starts the API.

### 2.3 (Optional) Copy existing data from local to remote

If you have data in a local PostgreSQL database and want it on the remote DB, run **after** migrations (so remote tables exist):

```bash
cd backend
LOCAL_DATABASE_URL='postgresql://localhost:5432/learning_buddy' \
REMOTE_DATABASE_URL='postgresql://USER:PASS@HOST:PORT/DB' \
node scripts/migrate-data-to-remote.js
```

Replace `LOCAL_DATABASE_URL` and `REMOTE_DATABASE_URL` with your values. Tables copied: `users`, `courses`, `sessions`, `uploads`, `notes`.

### 2.4 Fix sequences after data migration (required if you ran 2.3)

After copying data, PostgreSQL **sequences** for `id` columns are not updated. The next `INSERT` then gets an id that already exists → **"duplicate key value violates unique constraint"** and uploads return 500. Run this **once** against the remote DB:

```bash
cd backend
REMOTE_DATABASE_URL='postgresql://USER:PASS@HOST:PORT/DB' node scripts/fix-sequences-after-migrate.js
```

Or if `backend/.env` already has `DATABASE_URL` pointing at the remote DB:

```bash
cd backend && node scripts/fix-sequences-after-migrate.js
```

This sets each table’s `id` sequence so the next value is `MAX(id)+1`. New uploads (and other inserts) will then succeed.

### 2.5 Verify database

- Option A: Start the backend locally with the updated `backend/.env` and hit health/auth.
- Option B: Use `psql` or any PostgreSQL client with the same URL to list tables and row counts.

---

## 3. Backend

### 3.1 What the backend needs

- **Dockerfile**: `backend/Dockerfile` (Node 18, no migrations on start).
- **Context**: Build and run from the `backend` folder so paths like `migrations/`, `src/`, `package.json` resolve.
- **Port**: Container listens on `PORT` (default 3000). DCDeploy maps this to the public URL.
- **Environment variables**: Set in DCDeploy; do **not** rely on `.env` in the image (`.dockerignore` excludes it).

### 3.2 Create backend service on DCDeploy

1. **Dashboard** → **New Service** → **Web Service**.
2. **Repository**: Connect GitHub → `vapmail16/learning_buddy`, branch `main`.
3. **Context**: `./backend`.
4. **Dockerfile path**: `./backend/Dockerfile` (or leave empty if auto-detected).
5. **Port**: `3000`.
6. **Environment variables** (add in DCDeploy):

   | Variable     | Required | Example / notes |
   |-------------|----------|------------------|
   | `NODE_ENV`  | Yes      | `production` |
   | `PORT`      | Yes      | `3000` |
   | `DATABASE_URL` | Yes   | `postgresql://USER:PASS@HOST:PORT/DB` (from DCDeploy DB) |
   | `JWT_SECRET`   | Yes   | Min 32 characters. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `FRONTEND_URL` | After frontend is live | `https://your-frontend-xxxxx.dcdeploy.cloud` |
   | `ALLOWED_ORIGINS` | After frontend is live | Same as `FRONTEND_URL` (or comma-separated list) |
   | `OPENAI_API_KEY` | Optional | For image text/table extraction; e.g. `sk-proj-...` |

7. **Deploy**. Note the backend URL (e.g. `https://backend-lye88yzj2e.dcdeploy.cloud`).

### 3.3 Backend Dockerfile behavior

- **Does not run migrations** on startup (avoids "relation already exists" on an already-migrated DB).
- Creates `public/uploads` for file uploads.
- Healthcheck: `GET /api/health` on container port.
- Start command: `node -r dotenv/config src/index.js` (uses env vars from DCDeploy).

### 3.4 Verify backend

```bash
curl https://<your-backend-url>/api/health
# Expect: {"status":"ok"}

curl -X POST https://<your-backend-url>/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
# Expect: 201 with { id, email }
```

### 3.5 Upload files (images) on the deployed backend

The **data migration script** copies database rows (e.g. `uploads` table) but **does not copy the actual files** in `backend/public/uploads/`. The deployed backend container starts with an **empty** `public/uploads` folder. So:

- Upload **records** exist in the DB (after data migration).
- The **files** (images/PDFs) are only on your local machine.
- When the frontend requests an image (e.g. `GET /api/uploads/15/file`), the backend finds the row but the file is missing on disk and returns **404** → "Image unavailable".

**Options:**

1. **Re-upload after deployment**  
   Use the deployed app to upload the same (or new) files again. New uploads are stored in the container’s `public/uploads`. Note: each redeploy may start with an empty uploads folder unless you use a volume.

2. **Persistent volume for uploads**  
   If DCDeploy supports persistent volumes, mount one at `backend/public/uploads` (or a path your app uses for uploads). Then:
   - Either **re-upload** once via the app (files land on the volume and survive redeploys).
   - Or **copy local files into the volume once** (e.g. via a one-off job or file sync, if the platform allows it). Copy the contents of your local `backend/public/uploads/` (filenames must match the `file_path` values in the `uploads` table, e.g. `uploads/1234567890-filename.jpg`).

3. **No volume / one-off copy**  
   If you cannot use a volume and need existing local uploads on the server, you would need a one-off way to put files into the running container or into a path the backend serves (platform-dependent). Otherwise, re-upload via the app after deployment.

**Summary**: For images to display, the backend must have the actual files on disk (or behind the same path). Fix the URL if wrong (frontend uses `/api/uploads/:id/file`); then ensure files exist on the server via re-upload or volume + copy.

#### Option: Include local upload images in the deployed image

If you want the **same files** that are in your local `backend/public/uploads/` to be available on the deployed backend (e.g. so existing upload rows show images without re-uploading):

1. **Copy files into the repo** so the Docker build includes them:
   - The Dockerfile copies the app with `COPY . .`, so anything under `backend/` that is **not** in `.dockerignore` is in the image.
   - By default `backend/.gitignore` has `public/uploads/*` (only `public/uploads/.gitkeep` is tracked), so uploads are not in the repo or image.
   - To include them: either **remove** `public/uploads/*` from `backend/.gitignore` and commit the files, or copy your local upload files into a **committed** folder (e.g. `backend/public/uploads-seed/`) and in the Dockerfile add a step to copy that folder into `public/uploads/` at build time.
2. **Redeploy** the backend so the new image contains those files.
3. **Filenames must match** the `file_path` values in the `uploads` table (e.g. the DB has `uploads/1738xxx-filename.jpg`; the file on disk must be named `1738xxx-filename.jpg` in `public/uploads/`).

**Downsides**: Repo size grows with binary files; code and user data are mixed. Prefer re-upload or a persistent volume for long-term use.

#### Seed merge at startup (don’t overwrite runtime uploads)

The backend **entrypoint** copies files from `uploads-seed` into `public/uploads` **only if each file doesn’t already exist**. So:

- **Push code → redeploy**: Seed files from the repo are merged in; any file already in `public/uploads` (e.g. uploaded from the deployed app) is **not** overwritten.
- **Without a persistent volume**: The container’s `public/uploads` is new on each deploy, so uploads from the deployed app are lost on redeploy. Use a **persistent volume** mounted at `public/uploads` in DCDeploy if you want those uploads to survive redeploys.

---

## 4. Frontend

### 4.1 What the frontend needs

- **Dockerfile**: `frontend/Dockerfile` (multi-stage: Node build → nginx serve).
- **nginx.conf**: SPA routing (`try_files $uri $uri/ /index.html`) so deep links and refresh work.
- **Build argument**: `VITE_API_URL` must be set at **build time** (Vite bakes it into the bundle). Runtime env vars do **not** affect the built app.

### 4.2 Create frontend service on DCDeploy

1. **Dashboard** → **New Service** → **Web Service**.
2. **Repository**: `vapmail16/learning_buddy`, branch `main`.
3. **Context**: `./frontend`.
4. **Dockerfile path**: `./frontend/Dockerfile`.
5. **Port**: `80` (nginx listens on 80).
6. **Build arguments** (critical – set under Build / Build arguments):

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | `https://<your-backend-url>.dcdeploy.cloud` |

   Example: `VITE_API_URL=https://backend-lye88yzj2e.dcdeploy.cloud`

   If you omit this, the app will use the default (e.g. `http://localhost:3000`) and API calls from the deployed site will fail or go to the wrong host.

7. **Deploy**. Note the frontend URL (e.g. `https://frontend-xxxxx.dcdeploy.cloud`).

### 4.3 Frontend build and runtime

- **Stage 1 (builder)**: `npm ci` / `npm install`, then `npm run build` with `VITE_API_URL` from build arg. Output in `dist/`.
- **Stage 2 (production)**: nginx serves `dist/` at `/usr/share/nginx/html`. `nginx.conf` handles SPA routing and health at `/health`.

**Learning**: Vite only exposes env vars prefixed with `VITE_`, and they are embedded at build time. Changing DCDeploy runtime env vars after the build has no effect; you must set **build arguments** and **rebuild**.

---

## 5. CORS and connectivity

### 5.1 Why CORS matters

The frontend runs on one origin (e.g. `https://frontend-xxxxx.dcdeploy.cloud`) and the API on another (e.g. `https://backend-lye88yzj2e.dcdeploy.cloud`). Browsers block cross-origin requests unless the server sends the right CORS headers. The backend is configured to allow only origins listed in `ALLOWED_ORIGINS` (or `FRONTEND_URL`).

### 5.2 What to set and when

1. **After the frontend is live**, copy the frontend URL from DCDeploy (no trailing slash needed).
2. In the **backend** service → **Environment variables**, add or update:
   - `FRONTEND_URL=https://<frontend-url>.dcdeploy.cloud`
   - `ALLOWED_ORIGINS=https://<frontend-url>.dcdeploy.cloud`
   If you have multiple frontends (e.g. staging + prod), set `ALLOWED_ORIGINS` to a comma-separated list.
3. **Redeploy** (or restart) the backend so the new CORS config is loaded.

**Learning**: If you deploy the frontend first and open it before setting CORS, you will see CORS errors in the browser console. Always set `ALLOWED_ORIGINS` (and redeploy backend) after you know the frontend URL.

### 5.3 Summary: what to set where

| Service  | Type | Variable / Build arg | When | Value |
|----------|------|----------------------|------|--------|
| Frontend | Build argument | `VITE_API_URL` | At frontend deploy | Backend base URL (e.g. `https://backend-xxxxx.dcdeploy.cloud`) |
| Backend  | Env var | `FRONTEND_URL` | After frontend is live | Frontend URL |
| Backend  | Env var | `ALLOWED_ORIGINS` | After frontend is live | Frontend URL (or comma-separated list) |

---

## 6. Verification

### 6.1 Database

- Migrations ran without errors.
- Backend (local or deployed) can connect and return health/auth.

### 6.2 Backend

- `curl https://<backend-url>/api/health` → `{"status":"ok"}`.
- Register and login via curl or frontend; no 500s.

### 6.3 Frontend

- Open frontend URL in browser; no blank page or console errors.
- Register / log in; create course and session; upload file; edit notes.
- DevTools → Network: API requests go to the backend URL and return 200 (no CORS errors).
- Navigate to a deep link (e.g. `/courses/1`) and refresh; page loads (SPA routing works).

### 6.4 End-to-end

- Full flow: register → login → course → session → upload → notes (text + images). No CORS, no wrong-host requests.

---

## 7. Learnings and gotchas

### Database

- **Migrations run once, from your machine.** Do not run migrations inside the backend container on startup if the DB is already migrated; it leads to "relation already exists" and deployment failures. Use a script like `./migrate-to-remote-db.sh` and document that step.
- **DB passwords with special characters**: Use as-is in the URL; no encoding. In shell, wrap the URL in single quotes so `{`, `}`, `)`, etc. are not interpreted.
- **Data migration**: If you copy data from local to remote, run it **after** schema migrations. The data script assumes tables exist and uses `ON CONFLICT (id) DO NOTHING` for idempotency.

- **Upload files are not migrated**: The data migration script copies only DB rows (e.g. `uploads` table). The actual files in `backend/public/uploads/` stay on your machine. The deployed backend has an empty uploads folder, so existing uploads return 404 until you re-upload or copy files (e.g. via a persistent volume).

### Backend

- **No `.env` in image**: `.dockerignore` should exclude `.env`. All secrets and config come from DCDeploy environment variables.
- **CORS**: Allow only the frontend origin(s) via `ALLOWED_ORIGINS` or `FRONTEND_URL`. Defaulting to `cors()` with no origin list is insecure in production. Update CORS after the frontend URL is known and redeploy.
- **Healthcheck**: Use the same path the app exposes (e.g. `/api/health`) and the same port (`PORT`). Alpine image may need `curl` installed for the healthcheck command.

### Frontend

- **Vite env vars are build-time only.** `VITE_API_URL` must be provided as a **build argument** in DCDeploy (or in CI). Runtime env vars are not read by the built bundle.
- **Context must be `./frontend`.** The Dockerfile and `package.json` live there; building from repo root will break paths.
- **SPA routing**: nginx must serve `index.html` for all non-file routes (`try_files $uri $uri/ /index.html`). Otherwise direct URLs and refresh return 404.

### General

- **Deploy order**: Database → Backend → Frontend → set backend CORS → redeploy backend. Skipping or reordering causes wrong URLs or CORS errors.
- **Build args vs env vars**: Build args are for build time (e.g. `VITE_API_URL`). Env vars are for runtime (e.g. `DATABASE_URL`, `ALLOWED_ORIGINS`). Don’t confuse them.
- **Document your URLs**: Keep a note of backend URL, frontend URL, and DB URL (in a secure place). You’ll need them for CORS, build args, and debugging.

---

## 8. Troubleshooting

### Database

| Symptom | What to check |
|--------|----------------|
| Migrations fail: connection refused / timeout | Firewall, DB host/port, and that the DB service is running on DCDeploy. |
| Migrations fail: "relation already exists" | Migrations were already applied. Either skip or use a fresh DB / down migrations if you need to re-run. |
| Backend can’t connect | Same URL in backend env as used for migrations; password and special characters correct. |

### Backend

| Symptom | What to check |
|--------|----------------|
| 500 on startup / DB errors | `DATABASE_URL` correct; migrations have been run on that DB. |
| CORS errors in browser | Set `ALLOWED_ORIGINS` (and `FRONTEND_URL`) to the exact frontend origin; redeploy backend. No trailing slash. |
| Health check failing | Container exposes correct port; `/api/health` exists and returns 200. |
| Uploads / file serve fail | `public/uploads` exists in image; multer and route use correct path. |

### Frontend

| Symptom | What to check |
|--------|----------------|
| API calls go to localhost or wrong host | Set **build argument** `VITE_API_URL` to backend URL and **rebuild** (not just restart). |
| CORS errors | Backend `ALLOWED_ORIGINS` includes frontend origin; backend redeployed. |
| 404 on refresh or direct URL | nginx.conf has `try_files $uri $uri/ /index.html` for `location /`. |

### Images / uploads

| Symptom | What to check |
|--------|----------------|
| "Image unavailable" or 404 on `/api/uploads/:id/file` | Frontend uses `BASE` + `/api/uploads/:id/file`. Backend returns 404 when the file is missing on disk: **upload records** may exist (migrated DB) but **files** are not in the container’s `public/uploads`. Re-upload via the app or use a persistent volume and copy local `backend/public/uploads` contents so filenames match the DB `file_path`. |
| Upload returns 500 / "duplicate key value violates unique constraint" | Sequences are out of sync after data migration. Run `backend/scripts/fix-sequences-after-migrate.js` against the remote DB once (see §2.4). |
| 404 for a specific upload id (e.g. `/api/uploads/19/file`) | Upload id may not exist (e.g. only 17 rows). Run `backend/scripts/list-uploads.js` to see ids and file_path. If the note references a stale id (e.g. 19), run `backend/scripts/fix-note-block-upload-id.js <sessionId> 19 <correctId>` to point the block to an existing upload (e.g. 12). If the row exists but the file is missing on disk, add the file to uploads-seed or fix file_path with `backend/scripts/update-upload-filepath.js <id> <basename>`. |

---

## 9. Quick reference

### Commands (from project root)

```bash
# Migrate schema to remote DB and update backend/.env
./migrate-to-remote-db.sh

# Optional: custom remote URL
REMOTE_DATABASE_URL='postgresql://...' ./migrate-to-remote-db.sh

# Optional: copy local data to remote (after migrations)
cd backend && LOCAL_DATABASE_URL='...' REMOTE_DATABASE_URL='...' node scripts/migrate-data-to-remote.js
```

### DCDeploy settings

| Service  | Context   | Dockerfile            | Port | Build args | Env vars |
|----------|-----------|------------------------|------|------------|----------|
| Backend  | `./backend`  | `./backend/Dockerfile`  | 3000 | —          | `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `ALLOWED_ORIGINS`, optional `OPENAI_API_KEY` |
| Frontend | `./frontend` | `./frontend/Dockerfile` | 80   | `VITE_API_URL=<backend-url>` | — |

### Files involved

| File | Purpose |
|------|---------|
| `migrate-to-remote-db.sh` | Entrypoint to run migrations and update `backend/.env` |
| `backend/scripts/migrate-to-remote-db.js` | Runs node-pg-migrate against remote DB; updates `.env` |
| `backend/scripts/migrate-data-to-remote.js` | Copies data from local DB to remote (optional) |
| `backend/migrations/*.js` | Schema migrations |
| `backend/Dockerfile` | Backend image; no migrations on start |
| `frontend/Dockerfile` | Multi-stage: build + nginx |
| `frontend/nginx.conf` | SPA routing, gzip, health |

---

**End of deployment guide.** For API details see `docs/api.md`; for product/roadmap see `docs/product_roadmap` and `README.md`.
