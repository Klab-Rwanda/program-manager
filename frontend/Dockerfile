# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.16.0

# ---------- Build (Alpine) ----------
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# OS deps for native builds on Alpine (musl)
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy lockfiles first
COPY package.json package-lock.json ./

# Install deps (no optional), cache npm
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --omit=optional --no-audit --no-fund && \
    npm cache clean --force

# Copy the rest
COPY . .

# Build Next
RUN npx next build --experimental-build-mode compile

# Prune dev deps for runtime
RUN npm prune --omit=dev && npm cache clean --force

# ---------- Runtime (Alpine) ----------
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# Copy built app
COPY --from=build /app /app

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.js

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.js"]
CMD ["npm", "run", "start"]
