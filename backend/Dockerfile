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

# Create uploads directory (multer stores files in public/uploads)
RUN mkdir -p public/uploads
# Include any seed files (copy local public/uploads/* into public/uploads-seed/ and commit)
COPY public/uploads-seed/ public/uploads/

# Expose port (default 3000; dcdeploy may use PORT env)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Start app only. Run migrations once against external DB: ./migrate-to-remote-db.sh
CMD ["node", "-r", "dotenv/config", "src/index.js"]
