# ---- Build Stage ----
FROM oven/bun:1 AS build
WORKDIR /app

# Copy workspace manifests
COPY package.json bun.lock ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install all workspace dependencies (including devDeps needed for build)
RUN bun install --frozen-lockfile --ignore-scripts

# Copy frontend source
COPY frontend ./frontend

# Accept build-time args for Next.js public env vars
ARG NEXT_PUBLIC_BACKEND_URL

# Build Next.js app
WORKDIR /app/frontend
RUN bun run build

# Prune devDependencies — only production deps remain
WORKDIR /app
RUN bun install --production --ignore-scripts

# ---- Runtime Stage ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app/frontend

# Copy pruned node_modules (root hoisted + workspace-specific)
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/frontend/node_modules ./node_modules

# Copy built Next.js output
COPY --from=build /app/frontend/.next ./.next
COPY --from=build /app/frontend/next.config.mjs ./next.config.mjs
COPY --from=build /app/frontend/package.json ./package.json

# Copy public assets (served statically by Next.js)
COPY --from=build /app/frontend/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000').then(r => { if(!r.ok) process.exit(1) }).catch(() => process.exit(1))"

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["bun", "run", "start"]
