/**
 * FACULTY-BUILD §7 — identifier generation.
 *
 * Both identifiers are generated, stored, and emailed. Neither is ever
 * editable in the UI. The serial is allocated at approval, never at form
 * submission, and a retired number is never reissued.
 */

export type IdentifierFormat = {
  organizationId: string;
  parts: Array<
    | { type: "entrySession"; style: "full" | "short" } // 2025/2026 → "2025" or "25"
    | { type: "unitCode" } // "CPE"
    | { type: "serial"; width: number } // 0041
    | { type: "literal"; value: string } // "/" or "U"
  >;
  serialResetsPer: "Session" | "SessionAndUnit";
};

export function defaultIdentifierFormat(organizationId: string): IdentifierFormat {
  // 2025/CPE/0041
  return {
    organizationId,
    parts: [
      { type: "entrySession", style: "full" },
      { type: "literal", value: "/" },
      { type: "unitCode" },
      { type: "literal", value: "/" },
      { type: "serial", width: 4 },
    ],
    serialResetsPer: "SessionAndUnit",
  };
}

/** 2025/2026 → full "2025", short "25". A bare year passes through. */
export function sessionPart(sessionName: string, style: "full" | "short"): string {
  const head = sessionName.split("/")[0].trim() || sessionName.trim();
  if (style === "full") return head;
  const digits = head.replace(/[^0-9]/g, "");
  return digits.length >= 2 ? digits.slice(-2) : head;
}

export function renderIdentifier(
  format: IdentifierFormat,
  input: { sessionName: string; unitCode: string; serial: number },
): string {
  return format.parts.map(part => {
    switch (part.type) {
      case "entrySession": return sessionPart(input.sessionName, part.style);
      case "unitCode": return input.unitCode;
      case "serial": return String(input.serial).padStart(part.width, "0");
      case "literal": return part.value;
    }
  }).join("");
}

export function serialScopeKey(format: IdentifierFormat, sessionId: string, unitCode: string): string {
  return format.serialResetsPer === "Session"
    ? `${format.organizationId}::${sessionId}`
    : `${format.organizationId}::${sessionId}::${unitCode}`;
}

/**
 * Allocate the next serial for a scope. `usedSerials` are the serials already
 * taken in this scope; `isIssued` guards the global issued-identifiers set so
 * a counter bug can never produce a collision silently.
 */
export function allocateSerial(
  format: IdentifierFormat,
  input: { sessionId: string; sessionName: string; unitCode: string },
  usedSerials: number[],
  isIssued: (identifier: string) => boolean,
): { serial: number; identifier: string } {
  let serial = usedSerials.length ? Math.max(...usedSerials) + 1 : 1;
  // Never reuse a number: keep walking until the rendered identifier is fresh.
  for (let guard = 0; guard < 100000; guard += 1) {
    const identifier = renderIdentifier(format, { sessionName: input.sessionName, unitCode: input.unitCode, serial });
    if (!isIssued(identifier)) return { serial, identifier };
    serial += 1;
  }
  throw new Error("Could not allocate an identifier.");
}

function cleanNamePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * School email from the name against the org pattern. Collisions use the
 * documented tie-break, applied silently: middle initial, then 2, 3, …
 * Never surfaced as a username choice.
 */
export function generateSchoolEmail(
  fullName: string,
  kind: "Student" | "Staff",
  domain: string,
  isTaken: (email: string) => boolean,
): string {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  const first = cleanNamePart(tokens[0] ?? "user") || "user";
  const last = cleanNamePart(tokens.length > 1 ? tokens[tokens.length - 1] : "user") || "user";
  const middles = tokens.slice(1, -1).map(cleanNamePart).filter(Boolean);
  const suffix = kind === "Student" ? `@student.${domain}` : `@${domain}`;
  const plain = `${first}.${last}`;
  const bases: string[] = [plain];
  // Tie-break, applied silently: middle initial first, then 2, 3, …
  if (middles.length) bases.push(`${first}.${middles[0].charAt(0)}.${last}`);
  for (let n = 2; n <= 1000; n += 1) bases.push(`${plain}${n}`);
  for (const base of bases) {
    const email = `${base}${suffix}`;
    if (!isTaken(email)) return email;
  }
  throw new Error("Could not generate a school email.");
}

export const DEFAULT_SCHOOL_DOMAIN = "school.edu.ng";
export const DEFAULT_SESSION_NAME = "2025/2026";
