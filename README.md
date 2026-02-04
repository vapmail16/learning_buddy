# Learning Buddy

A full-stack learning companion app: manage **courses** and **sessions**, upload **documents** (images/PDFs), and maintain **notes** with automatic text/table extraction and multimodal blocks (text + images).

**Stack**: React (Vite) + Node (Express) + PostgreSQL.  
**Deployment**: DCDeploy (database, backend, frontend).

---

## Features

- **Auth**: Register and log in (JWT).
- **Courses & sessions**: Create courses and sessions; list and edit them.
- **Uploads**: Upload images and PDFs per session; files stored and served by the backend.
- **Notes**: Per-session notes with:
  - **Text and table extraction** from images (OpenAI GPT-4o Vision) and PDFs (pdf-parse).
  - **Multimodal blocks**: text blocks and embedded images; drag-and-drop reorder, add text or insert image at any position.
  - **Lightbox**: Click an image to view fullscreen.
- **Collapsible uploads list** in the session view.

---

## Tech stack

| Layer     | Tech |
|----------|------|
| Frontend | React 19, Vite 7, React Router |
| Backend  | Node 18, Express |
| Database | PostgreSQL |
| Deploy   | DCDeploy (DB + backend + frontend) |

---

## Local development

### Prerequisites

- Node 18+
- PostgreSQL (local or external)
- (Optional) OpenAI API key for image extraction

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, optionally OPENAI_API_KEY
npm install
npm run migrate:up   # if using local DB
npm start
```

Backend runs on **port 3001** by default. Health: `curl http://localhost:3001/health`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# For local dev, .env can be empty; Vite proxies /api to backend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**. API calls go to the same origin and are proxied to the backend (see `frontend/vite.config.js`).

### 3. Environment variables (local)

**Backend (`.env`)**

- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – min 32 characters
- `PORT` – default 3001
- `OPENAI_API_KEY` – optional; required for image text/table extraction

**Frontend (`.env`)**

- In dev, optional; Vite proxies `/api` to backend.
- For production build: `VITE_API_URL=<backend base URL>`

---

## API overview

Base path: `/api`. All protected routes need `Authorization: Bearer <JWT>`.

- **Health**: `GET /api/health`
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`
- **Courses**: CRUD under `/api/courses`
- **Sessions**: CRUD under `/api/sessions`
- **Uploads**: `POST /api/uploads/sessions/:sessionId` (multipart), `GET /api/uploads/:uploadId/file`
- **Notes**: `GET /api/notes/sessions/:sessionId`, `PUT /api/notes/sessions/:sessionId` (supports `content`, `table_data`, `highlights`, `blocks`)

See `docs/api.md` and `docs/extraction-api.md` for details.

---

## Deployment (DCDeploy)

Deployment follows the same pattern as the [mahimapareek](https://github.com/vapmail16/mahimapareek) project.

### Order of operations

1. **Database**: Create PostgreSQL on DCDeploy; run migrations (and optional data migration) from your machine. See `migrate-to-remote-db.sh` and `backend/scripts/`.
2. **Backend**: Deploy from `./backend` with Dockerfile; set env vars (see `backend/DCDeploy_ENV_VARS.md`). Backend URL example: `https://backend-lye88yzj2e.dcdeploy.cloud`.
3. **Frontend**: Deploy from `./frontend` with Dockerfile; set **build argument** `VITE_API_URL` to the backend URL. Note the frontend URL.
4. **CORS**: In the **backend** service, set `FRONTEND_URL` and `ALLOWED_ORIGINS` to the frontend URL, then **redeploy backend**.

### What to set where (no CORS / wrong API issues)

| Service   | Where to set        | Variable / Build arg | Value |
|-----------|---------------------|----------------------|--------|
| Frontend  | DCDeploy build args | `VITE_API_URL`       | `https://backend-lye88yzj2e.dcdeploy.cloud` (your backend URL) |
| Backend   | DCDeploy env vars   | `FRONTEND_URL`       | `https://<your-frontend-url>.dcdeploy.cloud` |
| Backend   | DCDeploy env vars   | `ALLOWED_ORIGINS`    | Same as `FRONTEND_URL` (or comma-separated list) |

- **Frontend** uses `VITE_API_URL` at **build time** so the app calls the correct API.
- **Backend** uses `ALLOWED_ORIGINS` / `FRONTEND_URL` at **runtime** so CORS allows the frontend origin.

### Docs

- **Backend**: `docs/BACKEND_DEPLOYMENT_DCDEPLOY.md`, `backend/DCDeploy_ENV_VARS.md`
- **Frontend**: `docs/FRONTEND_DEPLOYMENT_GUIDE.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## Project layout

```
learning_buddy/
├── backend/           # Express API, migrations, Dockerfile
├── frontend/          # Vite + React, Dockerfile, nginx.conf
├── docs/               # API, deployment, product notes
├── migrate-to-remote-db.sh
├── DEPLOYMENT_CHECKLIST.md
└── README.md           # this file
```

---

## Scripts (from repo root)

- `./migrate-to-remote-db.sh` – run migrations against external DB and point `backend/.env` to it.
- `npm run start:backend` / `npm run start:frontend` – if defined in root `package.json`.

---

## Troubleshooting

- **502 / proxy error in dev** – Backend not running; start backend first.
- **CORS in production** – Set backend `ALLOWED_ORIGINS` (and `FRONTEND_URL`) to the exact frontend URL and redeploy backend.
- **API calls to wrong host in production** – Set frontend **build argument** `VITE_API_URL` and rebuild the frontend image.
- **Notes empty after image upload** – Set `OPENAI_API_KEY` in backend env and restart.
- **DB errors** – Check `DATABASE_URL` and that migrations have been run (see `docs/BACKEND_DEPLOYMENT_DCDEPLOY.md`).

---

## License

Private / internal use unless otherwise stated.
