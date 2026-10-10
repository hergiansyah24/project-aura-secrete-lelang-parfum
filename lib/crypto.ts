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

