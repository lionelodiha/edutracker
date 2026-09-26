let enabled = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true";

/** Load the server's demo setting before rendering or making API requests. */
export async function loadDemoMode(): Promise<boolean> {
  if (import.meta.env.DEV) return enabled;

  const response = await fetch("/api/client-config", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the application configuration.");

  const config = await response.json() as { demoMode?: boolean };
  enabled = config.demoMode === true;
  return enabled;
}

export function isDemoMode(): boolean {
  return enabled;
}
