import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./app-theme.css";
import { client } from "./api/client.gen";
import { API_BASE } from "./apiBase";
import { loadDemoMode } from "./demoMode";

client.setConfig({ baseUrl: API_BASE, credentials: "include" });

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Start demo handlers before rendering so their requests cannot reach the API.
// Local development uses VITE_USE_MOCKS; deployments use the API's setting.
loadDemoMode()
  .then(async (demoMode) => {
    if (demoMode) {
      const { startMocks } = await import("./mocks/browser");
      await startMocks();
    }
    render();
  })
  .catch((error) => {
    console.error("Could not start EduTracker", error);
    createRoot(document.getElementById("root")!).render(
      <main style={{ padding: "3rem", maxWidth: 640, margin: "auto" }}>
        <h1>Could not start the app</h1>
        <p role="alert">The app could not load its configuration or demo data.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </main>,
    );
  });
