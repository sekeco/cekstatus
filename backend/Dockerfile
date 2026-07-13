# ---- Build Stage ----
FROM oven/bun:1 AS build
WORKDIR /app

# Copy workspace manifests
COPY package.json bun.lock ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all workspace dependencies
RUN bun install --frozen-lockfile --ignore-scripts

# Copy backend source (including pre-generated Drizzle migrations)
COPY backend ./backend

# Build backend (bundles into a single executable file)
RUN bun run --filter @cekstatus/backend build

# Prune devDependencies — only production deps remain
RUN bun install --production --ignore-scripts

# ---- Runtime Stage ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app

# Copy pruned node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/node_modules ./backend/node_modules

# Copy built bundle
COPY --from=build /app/backend/dist ./dist

# Create storage directory for uploads
RUN mkdir -p storage/uploads

# Copy drizzle migrations (used at deploy time)
COPY --from=build /app/backend/drizzle ./drizzle

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:8000/api/health').then(r => { if(!r.ok) process.exit(1) }).catch(() => process.exit(1))"

ENV NODE_ENV=production

CMD ["bun", "run", "dist/index.js"]
