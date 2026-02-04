# Frontend Deployment Guide – Learning Buddy (DCDeploy)

**Reference**: mahimapareek frontend deployment.  
**Repo**: https://github.com/vapmail16/learning_buddy  
**Backend URL**: https://backend-lye88yzj2e.dcdeploy.cloud

---

## Overview

Deploy the Learning Buddy React (Vite) frontend to DCDeploy so it talks to the deployed backend without CORS or routing issues.

**Prerequisites**

- Backend deployed and reachable at `https://backend-lye88yzj2e.dcdeploy.cloud`
- Frontend build uses **build argument** `VITE_API_URL` (Vite env vars are build-time only)

---

## 1. Create frontend service in DCDeploy

1. **Dashboard**: https://dash.dcdeploy.com → **New Service** → **Web Service**
2. **Repository**: Connect GitHub → `vapmail16/learning_buddy`, branch `main`
3. **Context**: `./frontend` (code lives in `frontend/`)
4. **Dockerfile**: `./frontend/Dockerfile` (or leave empty if auto-detected)
5. **Port**: `80` (nginx in container)
6. **Build arguments** (critical):

   | Name           | Value                                                  |
   |----------------|--------------------------------------------------------|
   | `VITE_API_URL` | `https://backend-lye88yzj2e.dcdeploy.cloud`            |

   Set this in DCDeploy **Build** / **Build arguments**. If you don’t set it, the app will use the default and API calls will go to the wrong place.

7. **Deploy** and note the frontend URL (e.g. `https://frontend-xxxxx.dcdeploy.cloud`).

---

## 2. Update backend CORS (avoid CORS errors)

After the frontend is live:

1. Copy the **frontend URL** from DCDeploy (e.g. `https://frontend-xxxxx.dcdeploy.cloud` – no trailing slash is fine).
2. Open the **backend** service in DCDeploy → **Environment variables**.
3. Add or set:

   ```env
   FRONTEND_URL=https://<your-frontend-url>.dcdeploy.cloud
   ALLOWED_ORIGINS=https://<your-frontend-url>.dcdeploy.cloud
   ```

   Use the same value for both; if you have multiple frontends, set `ALLOWED_ORIGINS` to a comma-separated list.

4. **Redeploy** (or restart) the backend so the new CORS settings apply.

---

## 3. What to set where (summary)

| Where        | What to set |
|-------------|-------------|
| **Frontend (DCDeploy)** | **Build argument**: `VITE_API_URL=https://backend-lye88yzj2e.dcdeploy.cloud` |
| **Backend (DCDeploy)**  | **Env vars**: `FRONTEND_URL` and `ALLOWED_ORIGINS` = your frontend URL (after frontend is deployed), then redeploy backend |

This way the frontend calls the correct API and the backend allows the frontend origin, so you avoid CORS issues.

---

## 4. Verify

- Open the frontend URL in a browser.
- Register / log in and use the app (courses, sessions, uploads, notes).
- In DevTools → Network, confirm API requests go to `https://backend-lye88yzj2e.dcdeploy.cloud` and return 200 (no CORS errors).
- Try direct navigation to a deep link (e.g. `/courses/1`); nginx should serve `index.html` (SPA routing).

---

## 5. Troubleshooting

| Issue | What to do |
|-------|------------|
| API calls go to wrong host or fail | Set **build argument** `VITE_API_URL` for the frontend and **rebuild** (not just restart). |
| CORS errors in browser | Set `FRONTEND_URL` and `ALLOWED_ORIGINS` on the backend to the exact frontend URL, then **redeploy** backend. |
| 404 on refresh / direct URL | Ensure `frontend/nginx.conf` is in the image and has `try_files $uri $uri/ /index.html;` for `location /`. |
| Build fails | Check Node version in `frontend/Dockerfile` (e.g. 18), and that build args are defined in DCDeploy. |

---

## 6. Auto-deploy

In the frontend service → **Settings** → **Auto Deploy**, enable deploy on push for `main`. If you change `VITE_API_URL`, update the build argument in DCDeploy and trigger a new build.

---

**Related**

- `backend/DCDeploy_ENV_VARS.md` – backend env vars (including CORS)
- `docs/BACKEND_DEPLOYMENT_DCDEPLOY.md` – backend deployment
- `DEPLOYMENT_CHECKLIST.md` – full checklist
