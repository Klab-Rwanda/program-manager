# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.16.0

# ---------- Runtime base (slim) ----------
FROM node:${NODE_VERSION}-slim AS base
LABEL andasy_launch_runtime="Next.js"
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# ---------- Build stage (full image with CA certs) ----------
FROM node:${NODE_VERSION} AS build

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# System deps for native builds
RUN set -eux; \
    apt-get update -qq; \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3; \
    rm -rf /var/lib/apt/lists/*

# Copy lockfiles first for better caching
COPY package.json package-lock.json ./

# Install deps with cache; save space
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --omit=optional --no-audit --no-fund && \
    npm cache clean --force

# Copy the rest of the app
COPY . .

# Build Next app (compile mode)
RUN npx next build --experimental-build-mode compile

# Drop dev deps for runtime
RUN npm prune --omit=dev && \
    npm cache clean --force

# ---------- Runtime stage ----------
FROM base

# Copy built app
COPY --from=build /app /app

# Ensure entrypoint is executable
RUN chmod +x /app/docker-entrypoint.js

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.js"]
CMD ["npm", "run", "start"]
