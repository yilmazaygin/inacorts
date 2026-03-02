# =============================================================================
# INACORTS Frontend Dockerfile — Multi-stage build
# =============================================================================
# Stage 1 (build):  Node 20 — install deps, compile TypeScript, build Vite
# Stage 2 (serve):  Nginx Alpine — serve static files, proxy /api to backend
#
# The production build uses relative API URLs so that Nginx can proxy /api
# requests to the backend container on the Docker network.
# =============================================================================

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (layer cached separately from source)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build the production bundle
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:stable-alpine

LABEL maintainer="INACORTS" \
      description="React frontend for INACORTS served via Nginx" \
      version="1.1.0"

# Remove the default Nginx site
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React artifacts from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck — verify Nginx is serving the SPA
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
