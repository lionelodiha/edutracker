/** Deterministic UUID-shaped fixture IDs scoped to the caller. */
export function fixtureId(...parts: string[]): string {
  const value = JSON.stringify(parts);
  const hex = [0, 1, 2, 3].map(seed => {
    let hash = 2166136261 ^ seed;
    for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(16).padStart(8, "0");
  }).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}

