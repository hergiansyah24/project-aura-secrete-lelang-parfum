import crypto from "node:crypto";

const MASTER_SECRET = process.env.ENCRYPTION_SECRET;

if (!MASTER_SECRET || MASTER_SECRET.length < 32) {
  throw new Error(
    "ENCRYPTION_SECRET wajib diatur dan minimal 32 karakter."
  );
}

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(MASTER_SECRET)
  .digest();

/**
 * Encrypt sensitive user data using AES-256-GCM (Authenticated Encryption)
 * Produces format: iv:authTag:ciphertext (hex)
 */
export function encryptSensitiveData(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt sensitive user data using AES-256-GCM
 * Verifies authentication tag to ensure data has not been tampered with
 */
export function decryptSensitiveData(encryptedString: string): string {
  if (!encryptedString) return "";
  try {
    const parts = encryptedString.split(":");
    if (parts.length !== 3) {
      // Return raw string if not matching format (backward compatibility)
      return encryptedString;
    }
    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(cipherHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("AES Decryption error:", err);
    return "[DECRYPTION_ERROR_TAMPERED_DATA]";
  }
}

/**
 * Compute SHA-256 Commitment Hash
 * Formula: SHA256(auctionId + ":" + bidAmount + ":" + nonce)
 */
export function computeCommitmentHash(auctionId: number | string, bidAmount: number | string, nonce: string): string {
  const payload = `${auctionId}:${bidAmount}:${nonce.trim()}`;
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * Constant-time hash verification to prevent timing side-channel attacks
 */
export function verifyCommitmentHash(
  auctionId: number | string,
  bidAmount: number | string,
  nonce: string,
  expectedHash: string
): boolean {
  try {
    const calculated = computeCommitmentHash(auctionId, bidAmount, nonce);
    const calculatedBuf = Buffer.from(calculated.toLowerCase(), "utf8");
    const expectedBuf = Buffer.from(expectedHash.trim().toLowerCase(), "utf8");
    
    if (calculatedBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(calculatedBuf, expectedBuf);
  } catch {
    return false;
  }
}

/**
 * Generate cryptographically secure 32-byte (64 hex characters) nonce
 */
export function generateSecureNonce(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** AES-256-GCM payload with a hexadecimal IV, ciphertext, and auth tag. */
export interface AEADPayload {
  iv: string;
  ciphertext: string;
  tag: string;
  aad: string;
}

/**
 * Derive a 256-bit AES key from an application secret.
 * A 64-character hexadecimal CSPRNG secret is used directly; other valid
 * secrets are deterministically reduced with SHA-256.
 */
export function deriveKeyFromSecret(secret = process.env.ENCRYPTION_SECRET): Buffer {
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("Fail-Closed: ENCRYPTION_SECRET must be a string of at least 32 characters");
  }

  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

/** Encrypt plaintext with AES-256-GCM and bind it to the supplied AAD. */
export function encryptAEAD(
  plaintext: string,
  aad: string,
  customSecret?: string
): AEADPayload {
  if (
    typeof plaintext !== "string" ||
    plaintext.length === 0 ||
    typeof aad !== "string" ||
    aad.length === 0
  ) {
    throw new Error("Invalid input: plaintext and AAD must be non-empty strings");
  }

  const key = deriveKeyFromSecret(customSecret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  cipher.setAAD(Buffer.from(aad, "utf8"));

  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);

  return {
    iv: iv.toString("hex"),
    ciphertext: ciphertext.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
    aad,
  };
}

/** Decrypt an AEAD payload and fail closed on malformed or unauthenticated data. */
export function decryptAEAD(
  payload: AEADPayload,
  expectedAAD: string,
  customSecret?: string
): string {
  const isHex = (value: unknown) =>
    typeof value === "string" && value.length > 0 && value.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(value);

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.aad !== "string" ||
    payload.aad.length === 0 ||
    typeof expectedAAD !== "string" ||
    expectedAAD.length === 0 ||
    !isHex(payload.iv) ||
    payload.iv.length !== 24 ||
    !isHex(payload.ciphertext) ||
    !isHex(payload.tag) ||
    payload.tag.length !== 32
  ) {
    throw new Error("Fail-Closed: Invalid AEAD payload parameters");
  }

  if (payload.aad !== expectedAAD) {
    throw new Error("Fail-Closed: Integrity check failed or unauthorized decryption attempt");
  }

  try {
    const key = deriveKeyFromSecret(customSecret);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(payload.iv, "hex"),
      { authTagLength: 16 }
    );
    decipher.setAAD(Buffer.from(expectedAAD, "utf8"));
    decipher.setAuthTag(Buffer.from(payload.tag, "hex"));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "hex")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    throw new Error("Fail-Closed: Integrity check failed or unauthorized decryption attempt");
  }
}

