# DCDeploy Environment Variables - Learning Buddy Backend

**Full deployment guide**: **docs/DEPLOYMENT_FULL_GUIDE.md** (all steps and env vars in one place).

**Repo**: https://github.com/vapmail16/learning_buddy

---

## Copy These to DCDeploy Backend Service

In DCDeploy → Your Backend Service → **Environment Variables**, add:

### Required

```env
NODE_ENV=production
PORT=3000

# External database (dcdeploy). Password can contain { } ] etc.
DATABASE_URL=postgresql://IzFRYJ:5oYc})9g1l@database-lye88yzj2e.tcp-proxy-2212.dcdeploy.cloud:30216/database-db

# JWT (min 32 chars) - generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-jwt-secret-minimum-32-characters-long
```

### After Frontend Is Deployed (CORS)

```env
FRONTEND_URL=https://your-frontend-url.dcdeploy.cloud
ALLOWED_ORIGINS=https://your-frontend-url.dcdeploy.cloud
```

### Optional (for notes extraction from images/PDFs)

```env
OPENAI_API_KEY=sk-your-openai-key
```

---

## Notes

1. **DATABASE_URL**: Run `./migrate-to-remote-db.sh` from project root first so schema exists on the external DB. Password can contain `{` `}` `]` etc.; no encoding needed.
2. **FRONTEND_URL / ALLOWED_ORIGINS**: Set after you deploy the frontend; then redeploy backend so CORS allows the frontend origin.
3. **Migrations**: Run once from your machine (not in the container): `./migrate-to-remote-db.sh` from the repo root. The container only starts the API; it does not run migrations (avoids "relation already exists" when the DB was already migrated).

---

## Quick Steps

1. Migrate DB: from repo root run `./migrate-to-remote-db.sh` (and optionally copy data with `migrate:data`).
2. In DCDeploy: create backend service, set **Context** to `./backend`, add env vars above.
3. Deploy. Backend URL will be e.g. `https://learning-buddy-backend-xxxxx.dcdeploy.cloud`.
