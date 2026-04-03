# syntax=docker/dockerfile:1
# SoCutesy — single container: Vite build + Express API + static hosting
# Build: docker build --build-arg VITE_WHATSAPP_NUMBER=923xxxxxxxxxx -t socutesy .
#
# Railway / small builders: exit 137 during npm often = OOM. We cap npm concurrency,
# skip audit/fund, use cache mounts, and use `npm install` for the production server
# layer (lighter peak RAM than `npm ci` on constrained hosts).

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_MAX_SOCKETS=1
RUN --mount=type=cache,id=npm-frontend,target=/root/.npm \
    npm ci --no-audit --no-fund
COPY frontend/ ./
# Vite bakes these at build time
ARG VITE_WHATSAPP_NUMBER
ENV VITE_WHATSAPP_NUMBER=${VITE_WHATSAPP_NUMBER}
# Same-origin deploy: leave empty so /api hits this server
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/server
COPY server/package*.json ./
ENV NODE_ENV=production
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_MAX_SOCKETS=1
# `npm install` with lockfile is less memory-hungry than `npm ci` for small trees
RUN --mount=type=cache,id=npm-server,target=/root/.npm \
    npm install --omit=dev --no-audit --no-fund
COPY server/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
ENV STATIC_DIR=/app/frontend/dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/index.js"]
