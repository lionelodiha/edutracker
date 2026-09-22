/** Local requests use Vite's same-origin proxy, including session cookies. */
export const API_BASE = import.meta.env.DEV
    ? window.location.origin
    : (import.meta.env.VITE_API_BASE_URL || "http://localhost:3187");
