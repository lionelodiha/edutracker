// Typed extraction of API/client error messages.
//
// The generated hey-api client returns `data`/`error` as broad unions, which
// is why call sites used `as any`. These helpers keep the same fallback
// behaviour without the escape hatch.

type ErrorEnvelope = {
  message?: unknown;
};

export function apiErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === "object" && value !== null && "message" in value) {
    const message = (value as ErrorEnvelope).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export function thrownMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
