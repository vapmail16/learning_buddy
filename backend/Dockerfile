# Learning Buddy Backend - DCDeploy
# Node 18. Migrations are run once via ./migrate-to-remote-db.sh (not on container start).

FROM node:18-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy application
COPY . .

# Keep seed in a separate path so entrypoint can merge without overwriting runtime uploads
COPY public/uploads-seed/ /app/uploads-seed/

# Create uploads directory (multer + entrypoint merge seed here; volume can be mounted here)
RUN mkdir -p public/uploads

# Entrypoint: merge seed into public/uploads only if files don't exist (preserves uploads from deployed app)
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port (default 3000; dcdeploy may use PORT env)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "-r", "dotenv/config", "src/index.js"]
