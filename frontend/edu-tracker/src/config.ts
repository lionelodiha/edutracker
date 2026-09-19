import { client } from "./api/client.gen";

declare global {
  interface Window {
    __EDUTRACKER_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

const DEFAULT_API_BASE_URL = "http://localhost:3187";

/**
 * Resolve the API base URL with this precedence:
 *
 * 1. Runtime config (`window.__EDUTRACKER_CONFIG__.apiBaseUrl`) written to
 *    `/config.js` by the container entrypoint on every start. This is what
 *    lets ONE image run in staging and production — Vite bakes
 *    `import.meta.env` in at build time, so a build-time URL would freeze
 *    the image to a single environment (the Vite trap in Stage 03).
 * 2. Build-time `VITE_API_BASE_URL` (local dev, `npm run dev`).
 * 3. Localhost fallback for a bare checkout.
 */
export function getApiBaseUrl(): string {
  const runtime = window.__EDUTRACKER_CONFIG__?.apiBaseUrl?.trim();
  if (runtime) {
    return runtime.replace(/\/+$/, "");
  }

  const buildTime = import.meta.env.VITE_API_BASE_URL?.trim();
  if (buildTime) {
    return buildTime.replace(/\/+$/, "");
  }

  return DEFAULT_API_BASE_URL;
}

/** Point the generated hey-api client at the resolved base URL. */
export function configureApiClient(): void {
  client.setConfig({ baseUrl: getApiBaseUrl(), credentials: "include" });
}
