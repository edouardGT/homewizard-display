# --- Build stage ---
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Same-origin in production: nginx proxies /api to the backend, so the API base
# URL is empty (relative requests). This also lets the PWA cache /api/dashboard.
ENV VITE_API_BASE_URL=""
RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
