# Learning Buddy – Backend Deployment to DCDeploy

**Full deployment guide**: **docs/DEPLOYMENT_FULL_GUIDE.md** (database, backend, frontend, CORS, learnings). This doc is a backend-focused summary.

**Repo**: https://github.com/vapmail16/learning_buddy

---

## 1. Database first (migrate schema + optional data)

### 1.1 Migrate schema to external DB and point backend to it

From project root:

```bash
./migrate-to-remote-db.sh
```

This:

- Runs all `node-pg-migrate` migrations against the external DB (dcdeploy).
- Backs up `backend/.env` and sets `DATABASE_URL` in `backend/.env` to the external URL.

External DB URL (already set in the script):

- `postgresql://IzFRYJ:5oYc})9g1l@database-lye88yzj2e.tcp-proxy-2212.dcdeploy.cloud:30216/database-db`  
- Password can contain `{` `}` `]` etc.; no encoding needed.

### 1.2 (Optional) Copy existing local data to remote

If you have data in a local PostgreSQL DB and want it on the external DB:

```bash
cd backend
LOCAL_DATABASE_URL='postgresql://localhost:5432/learning_buddy' \
REMOTE_DATABASE_URL='postgresql://IzFRYJ:5oYc})9g1l@database-lye88yzj2e.tcp-proxy-2212.dcdeploy.cloud:30216/database-db' \
node scripts/migrate-data-to-remote.js
```

Run this **after** schema migration (so remote tables exist). Tables copied: `users`, `courses`, `sessions`, `uploads`, `notes`.

---

## 2. Backend preparation (aligned with mahimapareek)

- **Dockerfile**: `backend/Dockerfile` – Node 18, runs migrations on start then starts the API.
- **Env**: DCDeploy injects env vars at runtime; no `.env` in the image (see `.dockerignore`).
- **Health**: Container exposes port 3000 and has a healthcheck on `/api/health`.

---

## 3. Deploy backend on DCDeploy

1. **Dashboard**: https://dash.dcdeploy.com → New Service → Web Service.
2. **Repo**: Connect GitHub → `vapmail16/learning_buddy`, branch (e.g. `main`).
3. **Context**: `./backend` (build and run from backend folder).
4. **Dockerfile**: `./backend/Dockerfile` (or leave empty if DCDeploy detects it).
5. **Port**: `3000`.
6. **Environment variables**: Add the same vars as in `backend/DCDeploy_ENV_VARS.md`:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `DATABASE_URL=postgresql://IzFRYJ:5oYc})9g1l@database-lye88yzj2e.tcp-proxy-2212.dcdeploy.cloud:30216/database-db`
   - `JWT_SECRET=<min 32 chars>`
   - After frontend is deployed: `FRONTEND_URL`, `ALLOWED_ORIGINS` (then redeploy backend).
7. **Deploy**. Backend URL will be like `https://learning-buddy-backend-xxxxx.dcdeploy.cloud`.

---

## 4. Verify

- Health: `curl https://<your-backend-url>/api/health`
- Auth: `curl -X POST https://<your-backend-url>/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"testpass123"}'`

---

## 5. Git push (after DB + backend are set)

When DB migration and backend setup are done and verified:

```bash
git remote add origin https://github.com/vapmail16/learning_buddy.git
git add .
git commit -m "Prepare for dcdeploy: migrations, Dockerfile, docs"
git push -u origin main
```

Do **not** commit `backend/.env` (keep it in `.gitignore`); DCDeploy uses its own env vars.
