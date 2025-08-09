# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-slim AS base

LABEL andasy_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

COPY . .

# Install packages needed to build node modules
RUN npm ci --include=dev

RUN npx next build --experimental-build-mode compile

ENTRYPOINT ["npx", "next", "start", "--port", "3000", "-H", "::"]