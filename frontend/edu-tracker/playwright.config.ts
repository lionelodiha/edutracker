import { defineConfig, devices } from "@playwright/test";

// End-to-end smoke path (Stage 01): register, create an organization,
// create a semester, sign out. Needs the API on http://localhost:3187
// (frontend hardcodes that base URL) with Postgres + Redis behind it:
// locally `docker compose up -d postgres redis` + `dotnet run`, in CI the
// e2e job wires the same. Only the web dev-server is managed here.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --port 3000 --strictPort",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
