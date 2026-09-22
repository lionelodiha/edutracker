import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { client } from "./api/client.gen";
import { API_BASE } from "./apiBase";

client.setConfig({ baseUrl: API_BASE, credentials: "include" });

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// ── Cohort mock backend (temporary) ────────────────────────────────────
// Off unless VITE_USE_MOCKS=true in a dev build. Awaited before the first
// render so no request can escape to the network before the worker is
// listening. Delete this block, and src/mocks/, when the real cohort
// endpoints ship — see COHORT-MODEL.md.
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true") {
  import("./mocks/browser")
    .then(({ startMocks }) => startMocks())
    .catch((error) => {
      // A broken mock must not stop the app booting; fall through to the
      // real API and say why.
      console.error("[mocks] failed to start, continuing without them", error);
    })
    .finally(render);
} else {
  render();
}
