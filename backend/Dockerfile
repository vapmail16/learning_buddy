# Learning Buddy Backend - DCDeploy
# Node 18, run migrations on start, then start API

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

# Expose port (default 3000; dcdeploy may use PORT env)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Run migrations then start (migrations use DATABASE_URL from env at runtime)
CMD ["sh", "-c", "node -r dotenv/config node_modules/.bin/node-pg-migrate up && node -r dotenv/config src/index.js"]
