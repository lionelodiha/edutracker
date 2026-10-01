#!/bin/sh
# Stage 03 — runtime config. Vite substitutes import.meta.env at BUILD time,
# so an image built with a staging API URL is permanently a staging image.
# Instead this entrypoint writes a small /config.js on every container start
# and the app reads window.__EDUTRACKER_CONFIG__ at runtime (see src/config.ts).
# One image runs in every environment.
set -eu

: "${API_BASE_URL:=http://localhost:3187}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__EDUTRACKER_CONFIG__ = {
  apiBaseUrl: "${API_BASE_URL}"
};
EOF

exec nginx -g "daemon off;"
