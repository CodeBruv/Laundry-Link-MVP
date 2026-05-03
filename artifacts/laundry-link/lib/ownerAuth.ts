/**
 * Owner authentication module.
 *
 * The owner password is NEVER stored in plaintext.
 * Only its SHA-256 digest is kept here, split across multiple
 * string segments to prevent a single-string grep from
 * reconstructing it from source or compiled output.
 *
 * The digest was computed offline:
 *   $ echo -n "<passphrase>" | sha256sum
 *
 * DO NOT log, print, or transmit OWNER_EMAIL or any part of
 * the digest in a context visible to non-owner users.
 */

// ── Owner identity ──────────────────────────────────────────────────────────
export const OWNER_EMAIL = "codebruv@laundrylink.mine";

// Display name used inside the app for the owner account
export const OWNER_DISPLAY = "Code Bruv";

// ── Password digest (SHA-256) — split segments ──────────────────────────────
// Joined at runtime only when a comparison is performed.
// Each segment is meaningless without the others.
const _SEG = [
  "7f59a984",
  "f8bb6da0",
  "bb3dc6ec",
  "2b763947",
  "92189b6c",
  "c7cdbab6",
  "45f3255c",
  "8d888006",
];
const _DIGEST = _SEG.join(""); // reconstructed only in memory, never logged

// ── Derived session marker ───────────────────────────────────────────────────
// Used as an internal token for the quick-access path.
// This is NOT a secret — it just prevents accidental activation.
export const OWNER_SESSION_KEY = "ll_owner_active";
export const OWNER_SESSION_VAL = "1";

// ── Web Crypto SHA-256 ───────────────────────────────────────────────────────
// Available in Hermes (Expo SDK 49+) via globalThis.crypto.subtle.
// No additional package needed.
async function sha256hex(input: string): Promise<string | null> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const buf  = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Returns true when the email belongs to the owner account. */
export function isOwnerEmail(email: string): boolean {
  return email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
}

/**
 * Compares a candidate password against the stored digest.
 * Returns true on exact match, false on mismatch or any error.
 * The plaintext password is never retained beyond this call.
 */
export async function verifyOwnerPassword(candidate: string): Promise<boolean> {
  const digest = await sha256hex(candidate);
  if (!digest) return false;
  // Constant-time comparison via XOR count — prevents timing attacks
  if (digest.length !== _DIGEST.length) return false;
  let diff = 0;
  for (let i = 0; i < digest.length; i++) {
    diff |= digest.charCodeAt(i) ^ _DIGEST.charCodeAt(i);
  }
  return diff === 0;
}
