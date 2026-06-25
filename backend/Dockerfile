# --- Build stage ---
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# better-sqlite3 compiles a native addon — needs build tools.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage ---
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Reinstall prod deps on the same base/arch so the native binary matches.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force \
    && apt-get purge -y python3 make g++ && apt-get autoremove -y

COPY --from=builder /app/dist ./dist

VOLUME ["/app/data"]
EXPOSE 5050
CMD ["node", "dist/server.js"]
