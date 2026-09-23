import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./app-theme.css";
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
    .then(render)
    .catch((error) => {
      console.error("[mocks] could not start", error);
      createRoot(document.getElementById("root")!).render(
        <main style={{ padding: "3rem", maxWidth: 640, margin: "auto" }}>
          <h1>Could not start the preview</h1>
          <p role="alert">The mock service could not start. No requests have been sent to the backend.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry preview</button>
        </main>,
      );
    });
} else {
  render();
}
