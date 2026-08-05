const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "123456", "12345678", "123456789",
  "qwerty", "qwerty123", "111111", "abc123", "letmein", "welcome", "admin",
  "admin123", "iloveyou", "monkey", "dragon", "sunshine", "princess",
  "football", "baseball", "trustno1", "passw0rd", "changeme", "test1234",
]);

/**
 * Password policy. Returns an error message, or null when valid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 72) return "Password must be at most 72 characters";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must include a number";
  const normalized = password.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (COMMON_PASSWORDS.has(normalized)) return "This password is too common — choose another";
  return null;
}

async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Leaked-password protection via the HaveIBeenPwned range API (k-anonymity:
 * only the first 5 hash chars ever leave the device). Fails open on network
 * errors so sign-up is never blocked by an outage.
 */
export async function isPasswordLeaked(password: string): Promise<boolean> {
  try {
    const hash = await sha1Hex(password);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`);
    if (!res.ok) return false;
    const body = await res.text();
    const suffix = hash.slice(5);
    return body.split("\n").some((line) => line.split(":")[0]?.trim() === suffix);
  } catch {
    return false;
  }
}

/**
 * Full check: policy rules + breached-password lookup.
 */
export async function checkPassword(password: string): Promise<string | null> {
  const policyError = validatePassword(password);
  if (policyError) return policyError;
  if (await isPasswordLeaked(password)) {
    return "This password has appeared in a known data breach — choose another";
  }
  return null;
}
