/**
 * Browser-side mock worker. Used in dev only, and only when
 * VITE_USE_MOCKS=true. See start() below.
 */
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
export const worker = setupWorker(...handlers);

/**
 * Starts the mock worker if — and only if — the flag is set AND we are in a
 * dev build. Both conditions on purpose: the flag alone would let a
 * mis-set production env var serve fake data to real users.
 *
 * onUnhandledRequest is "bypass" so every endpoint we have NOT mocked still
 * reaches the real API. That means auth, organizations and everything else
 * keep working normally while only cohorts are faked.
 */
export async function startMocks(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_USE_MOCKS !== "true") return;

  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: false,
  });

  console.info(
    "%c[mocks] cohort and faculty endpoints are mocked. Everything else hits the real API.",
    "color:#22d3ee",
  );
}
