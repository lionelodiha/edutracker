/**
 * Browser-side mock worker. Enabled locally by VITE_USE_MOCKS and on Render
 * by the API's DemoMode setting.
 */
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { isDemoMode } from "../demoMode";
export const worker = setupWorker(...handlers);

/**
 * Starts the mock worker only after the app has loaded its demo setting.
 *
 * onUnhandledRequest is "bypass" so every endpoint we have NOT mocked still
 * reaches the real API. Auth and organizations stay live while cohort,
 * faculty and academic structure requests use browser-side demo data.
 */
export async function startMocks(): Promise<void> {
  if (!isDemoMode()) return;

  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: false,
  });

  // A hard refresh (Ctrl+Shift+R) or DevTools "Bypass for network" loads the page
  // without its service worker. The worker registers but can't intercept, so every
  // mocked request silently falls through to the real API. Reload once to regain
  // control; the session flag stops a reload loop if the browser keeps refusing.
  const RELOAD_FLAG = "edutracker.mocks.reloaded";
  if (!navigator.serviceWorker.controller) {
    let alreadyTried = false;
    try { alreadyTried = sessionStorage.getItem(RELOAD_FLAG) === "1"; sessionStorage.setItem(RELOAD_FLAG, "1"); } catch { alreadyTried = true; }
    if (!alreadyTried) {
      window.location.reload();
      await new Promise(() => {}); // Hold rendering until the reload happens.
    }
    console.warn("[mocks] This page isn't controlled by the mock worker (hard refresh or 'Bypass for network' is on). Mocked pages will fail until a normal reload.");
  } else {
    try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* Nothing to clear. */ }
  }

  console.info(
    "%c[mocks] cohort, faculty and academic structure endpoints are mocked. Everything else hits the real API.",
    "color:#22d3ee",
  );
}
