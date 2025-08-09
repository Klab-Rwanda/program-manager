# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-slim

LABEL andasy_launch_runtime="Next.js"
WORKDIR /app

# Runtime env
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

# 1) Copy lockfiles first for better caching
COPY package.json package-lock.json ./

# 2) Install deps (skip optional), cache if BuildKit is on
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --omit=optional --no-audit --no-fund && \
    npm cache clean --force

# 3) Copy the rest of the app
COPY . .

# 4) Build and then drop dev deps for a smaller image
RUN npx next build --experimental-build-mode compile && \
    npm prune --omit=dev && \
    npm cache clean --force

EXPOSE 3000
# Next binds to 0.0.0.0 by default in containers. Use your package.json start script.
CMD ["npm", "run", "start"]
