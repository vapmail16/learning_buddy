# Quick start

In **development**, the frontend (Vite) proxies API requests to the backend. You must run the **backend first**, then the frontend.

## 1. Start the backend (required first)

From the project root:

```bash
npm run start:backend
```

Or:

```bash
cd backend && npm start
```

You should see: `Learning Buddy API listening on port 3001`.

Learning Buddy uses **port 3001** by default (so it doesn't conflict with other apps on 3000). Set `PORT` in `backend/.env` to change it.

**Check it's up:**

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

**Test register:**

```bash
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"test123"}'
```

Expected: `{"id":...,"email":"you@example.com"}` (201). If you see `name`, `role`, or "8 characters", that response is from a different app — make sure nothing else is using port 3001.

## 2. Start the frontend

In another terminal:

```bash
npm run start:frontend
```

Open **http://localhost:5173** and try Register again. API calls go through the dev server to the backend.

- If you see **502 Bad Gateway** or **Proxy error** when registering → backend is not running. Start it (step 1).
- If you previously saw **404**, restart the frontend (Ctrl+C then `npm run start:frontend` again) so the new proxy is active.

## 3. Extraction (upload → notes)

Uploaded **images** and **PDFs** are converted into notes by the backend using:

- **Images:** OpenAI GPT-4o Vision API (extracts text from the image).
- **PDFs:** `pdf-parse` in Node (extracts text; no separate service).

Set your **OpenAI API key** in `backend/.env`:

```bash
OPENAI_API_KEY=sk-proj-...
```

Without `OPENAI_API_KEY`, image extraction is skipped (PDF text extraction still works). If notes stay empty after upload, check that `OPENAI_API_KEY` is set and restart the backend.

## Troubleshooting

- **404 on /auth/register or /auth/login** → Backend not running. Start it with `npm run start:backend` from the project root (or `cd backend && npm start`).
- **Connection refused** → Nothing is listening on port 3001. Start the backend.
- **"Notes updated" but Notes section empty** → Set `OPENAI_API_KEY` in `backend/.env` for image extraction; PDFs use Node only. Restart the backend after changing `.env`.
- **Database errors** → Ensure PostgreSQL is running and `backend/.env` has the correct `DATABASE_URL`. Run migrations: `npm run migrate:up` from project root.
