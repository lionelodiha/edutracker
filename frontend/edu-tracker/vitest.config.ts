import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Unit/component behaviour tests (Stage 01). Fast, no backend, runs on
// every PR via `npm test`. End-to-end lives in playwright.config.ts.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true, // lets Testing Library auto-cleanup between tests
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
