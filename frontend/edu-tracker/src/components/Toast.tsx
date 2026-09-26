import { useEffect, useRef, useState } from "react";

type ToastState = { id: number; tone: "success" | "error"; text: string } | null;

/**
 * Minimal Sonner-style toast: one at a time, bottom-centre, auto-dismiss.
 * Returns the element to render and a `show` function.
 * Timer pauses while the tab is hidden, so a toast isn't missed.
 */
export function useToast(duration = 3200) {
  const [toast, setToast] = useState<ToastState>(null);
  const counter = useRef(0);

  useEffect(() => {
    if (!toast) return;
    let remaining = duration;
    let started = Date.now();
    let timer = window.setTimeout(() => setToast(null), remaining);
    const onVisibility = () => {
      if (document.hidden) { window.clearTimeout(timer); remaining -= Date.now() - started; }
      else { started = Date.now(); timer = window.setTimeout(() => setToast(null), Math.max(800, remaining)); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [toast, duration]);

  const element = toast
    ? <div key={toast.id} className={`ws-toast ws-toast-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"} aria-live="polite">{toast.text}</div>
    : null;
  const show = (text: string, tone: "success" | "error" = "success") => { counter.current += 1; setToast({ id: counter.current, tone, text }); };
  return { toast: element, show };
}
