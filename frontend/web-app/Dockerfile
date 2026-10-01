# Stage 03 — frontend image. Build context is this directory:
#   docker build -f frontend/edu-tracker/Dockerfile frontend/edu-tracker
FROM node:22-alpine AS build
WORKDIR /app

# Lockfile first so a source-only change reuses the install layer.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS final

# SPA fallback: every unknown path serves index.html, or a refresh on
# /dashboard/organizations returns 404 from nginx instead of your router.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
