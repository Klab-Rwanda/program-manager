
# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.17.1
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ENV NODE_ENV=production

# ---- Build stage ----
FROM base AS build

# Install build dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential python-is-python3 pkg-config && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies including dev
COPY package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build Next.js app
RUN npx next build --experimental-build-mode compile

# Remove dev dependencies
RUN npm prune --omit=dev

# ---- Final stage ----
FROM node:${NODE_VERSION}-slim AS final

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=::

# Copy built app
COPY --from=build /app /app

EXPOSE 3000

# Run the server directly
CMD ["npm", "run", "start"]
