# Learning Buddy – Deployment Checklist (DCDeploy)

**Full guide**: See **docs/DEPLOYMENT_FULL_GUIDE.md** for all steps, learnings, and troubleshooting (database, backend, frontend). This checklist is a short phase list.

**Repo**: https://github.com/vapmail16/learning_buddy

---

## Phase 1: Database migration and mapping

- [ ] **1.1** External DB created in DCDeploy (done – URL below).
- [ ] **1.2** Run schema migration to external DB:
  ```bash
  ./migrate-to-remote-db.sh
  ```
- [ ] **1.3** Optional: copy local data to remote (if you have existing data):
  ```bash
  LOCAL_DATABASE_URL='postgresql://localhost:5432/learning_buddy' \
  REMOTE_DATABASE_URL='postgresql://IzFRYJ:5oYc})9g1l@database-lye88yzj2e.tcp-proxy-2212.dcdeploy.cloud:30216/database-db' \
  node backend/scripts/migrate-data-to-remote.js
  ```
- [ ] **1.4** Confirm `backend/.env` has `DATABASE_URL` pointing to external DB (script updates it).
- [ ] **1.5** Test backend locally against external DB: `cd backend && npm start` → health + auth work.

**External DB URL**:  
`postgresql://IzFRYJ:5oYc})9g1l@database-lye88yzj2e.tcp-proxy-2212.dcdeploy.cloud:30216/database-db`

---

## Phase 2: Backend on DCDeploy

- [ ] **2.1** DCDeploy backend service created (Context: `./backend`).
- [ ] **2.2** Env vars set (see `backend/DCDeploy_ENV_VARS.md`): `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`; later `FRONTEND_URL`, `ALLOWED_ORIGINS`.
- [ ] **2.3** Deploy backend; note backend URL (e.g. `https://learning-buddy-backend-xxxxx.dcdeploy.cloud`).
- [ ] **2.4** Verify: `curl https://<backend-url>/api/health`.

---

## Phase 3: Git push (after DB + backend are done)

- [ ] **3.1** Do **not** commit `backend/.env` or `frontend/.env` (sensitive; use DCDeploy env vars / build args).
- [ ] **3.2** Push when ready (includes frontend Dockerfile, nginx.conf, README, CORS, docs):
  ```bash
  git remote add origin https://github.com/vapmail16/learning_buddy.git
  git add .
  git commit -m "Frontend DCDeploy prep: Dockerfile, nginx, CORS, README, deployment docs"
  git push -u origin main
  ```

---

## Phase 4: Frontend on DCDeploy

- [ ] **4.1** Create frontend service in DCDeploy (Context: `./frontend`, Dockerfile: `./frontend/Dockerfile`, Port: `80`).
- [ ] **4.2** Set **build argument** in DCDeploy: `VITE_API_URL=https://backend-lye88yzj2e.dcdeploy.cloud` (or your backend URL).
- [ ] **4.3** Deploy frontend; note frontend URL (e.g. `https://frontend-xxxxx.dcdeploy.cloud`).
- [ ] **4.4** In **backend** service → Environment variables: set `FRONTEND_URL` and `ALLOWED_ORIGINS` to the frontend URL.
- [ ] **4.5** Redeploy backend so CORS allows the frontend origin.
- [ ] **4.6** Verify: open frontend URL, register/login, use app; no CORS errors in console.

See **docs/FRONTEND_DEPLOYMENT_GUIDE.md** for step-by-step and troubleshooting.
