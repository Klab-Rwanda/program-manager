# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-slim AS base
LABEL andasy_launch_runtime="Next.js"
WORKDIR /app

# Runtime env
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# ---------- Build stage ----------
FROM base AS build

# Fix apt GPG issues: force HTTPS and install CA/GPG before anything else
RUN set -eux; \
    sed -i 's|http://|https://|g' /etc/apt/sources.list; \
    apt-get update -qq; \
    apt-get install --no-install-recommends -y ca-certificates gnupg dirmngr; \
    apt-get update -qq; \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3; \
    rm -rf /var/lib/apt/lists/*

# Copy lockfiles first for better caching
COPY package.json package-lock.json ./

# Install deps with cache mount; keep layer small; save space
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

# Copy built app from build stage
COPY --from=build /app /app

# Ensure entrypoint is executable
RUN chmod +x /app/docker-entrypoint.js

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.js"]
CMD ["npm", "run", "start"]
