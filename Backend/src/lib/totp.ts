import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generate a random 20-byte Base32 TOTP secret
 */
export function generateTotpSecret(bytes = 20): string {
  const random = crypto.randomBytes(bytes);
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < random.length; i++) {
    value = (value << 8) | random[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 1_000_000).padStart(6, "0");
}

/**
 * Build an otpauth:// URI for Google Authenticator / Authy / 1Password
 */
export function buildTotpUri(email: string, secret: string, issuer = "Vode Admin"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Verify a 6-digit TOTP token with ±1 step (30s) clock skew tolerance
 */
export function verifyTotpCode(secret: string, code: string, window = 1): boolean {
  const cleanCode = code.trim();
  if (!/^\d{6}$/.test(cleanCode)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  const codeBuf = Buffer.from(cleanCode, "utf8");

  for (let offset = -window; offset <= window; offset++) {
    const expected = hotp(secret, currentStep + offset);
    const expectedBuf = Buffer.from(expected, "utf8");
    if (expectedBuf.length === codeBuf.length && crypto.timingSafeEqual(expectedBuf, codeBuf)) {
      return true;
    }
  }

  return false;
}

