import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { configureApiClient } from "./config.ts";

// Resolve the API base URL once at boot (runtime /config.js first,
// then VITE_API_BASE_URL, then localhost). Individual pages no longer
// hardcode it; they import getApiBaseUrl / configureApiClient instead.
configureApiClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
