/** Browser-only mock credentials. The real API remains responsible for production auth. */
export type PasswordCredential = { salt: string; hash: string };

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 120_000, hash: "SHA-256" },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function makeCredential(password: string): Promise<PasswordCredential> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: Array.from(salt, byte => byte.toString(16).padStart(2, "0")).join(""), hash: await derive(password, salt) };
}

export async function verifyPassword(password: string, credential: PasswordCredential): Promise<boolean> {
  const salt = Uint8Array.from(credential.salt.match(/.{2}/g) ?? [], pair => Number.parseInt(pair, 16));
  const hash = await derive(password, salt);
  return hash.length === credential.hash.length && hash === credential.hash;
}
