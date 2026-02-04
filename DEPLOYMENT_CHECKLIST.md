# Learning Buddy – Deployment Checklist (DCDeploy)

**Reference**: mahimapareek deployment (same approach).  
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

- [ ] **3.1** Do **not** commit `backend/.env` (sensitive; use DCDeploy env vars).
- [ ] **3.2** Push when ready:
  ```bash
  git remote add origin https://github.com/vapmail16/learning_buddy.git
  git add .
  git commit -m "Prepare for dcdeploy: migrations, Dockerfile, docs"
  git push -u origin main
  ```

---

## Phase 4: Frontend (later)

- [ ] Create frontend service on DCDeploy; set build env `VITE_API_URL=<backend-url>`.
- [ ] After frontend is live: set backend env `FRONTEND_URL` and `ALLOWED_ORIGINS`, then redeploy backend.
