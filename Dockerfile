# SoCutesy — single container: Vite build + Express API + static hosting
# Build: docker build --build-arg VITE_WHATSAPP_NUMBER=923xxxxxxxxxx -t socutesy .
#
# Plain RUN (no BuildKit cache mounts) — works on Railway and other hosts that
# reject or mishandle --mount=type=cache. Low npm concurrency + no audit/fund
# reduces OOM risk on small builders.

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_MAX_SOCKETS=1
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ARG VITE_WHATSAPP_NUMBER
ENV VITE_WHATSAPP_NUMBER=${VITE_WHATSAPP_NUMBER}
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
RUN npm install --omit=dev --no-audit --no-fund
COPY server/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
ENV STATIC_DIR=/app/frontend/dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/index.js"]
