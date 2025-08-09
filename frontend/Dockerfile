# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-slim

LABEL andasy_launch_runtime="Next.js"
WORKDIR /app

# Runtime env
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    HOST=0.0.0.0

# 1) Copy lockfiles first for caching
COPY package.json package-lock.json ./

# 2) Install ONLY production deps (tiny footprint = avoids ENOSPC)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --omit=optional --no-audit --no-fund && \
    npm cache clean --force

# 3) Copy the rest of the app
COPY . .

# 4) Build with prod deps (works because "next" is in dependencies)
RUN npm run build

EXPOSE 3000
# Pass -p and -H via npm args to ensure proper binding in container
CMD ["npm","run","start","--","-p","3000","-H","0.0.0.0"]
