# Multi-stage Dockerfile for gbi-backend (Alpine)
# Builder stage: install build deps, install all node modules, compile TypeScript
FROM node:24-alpine AS builder

# Install build tools required for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++ linux-headers

WORKDIR /app

# Copy package files first to leverage layer caching
# use a safe glob so the build won't fail if lockfile is absent
COPY package*.json ./

# Install all dependencies (including dev) so we can build
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and build (keep devDeps for build), then prune devDeps
COPY . .
RUN npm run build


# Runtime stage: smaller image containing only what's necessary to run
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed for runtime
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copy entrypoint script (runs migrations) and make it executable
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Create a non-root app user and give ownership of app dir
# RUN addgroup -S app && adduser -S -G app app \
#   && chown -R app:app /app

# USER app

# Optional: add a HEALTHCHECK that fits your app (uncomment & adjust if you have a health endpoint)
# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD node -e "require('http').get('http://127.0.0.1:3000', r=> process.exit(r.statusCode===200?0:1)).on('error', ()=>process.exit(1))"

EXPOSE 3000 8296

# Run migrations on container start then exec the default command
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]