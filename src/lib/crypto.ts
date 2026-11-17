import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // sem 0/o/1/l/i pra ditar fácil

/** Id curto e amigável pra URL: /p/k7m3qz9a */
export function newSlug(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  return out;
}

/** Token secreto (link de admin, cookie do votante). */
export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
