import { createCipheriv, createDecipheriv, createHash, pbkdf2Sync, randomBytes } from "crypto";

/**
 * Encrypted payload structure for AES-256-GCM encrypted data.
 * All binary values are hex-encoded strings for safe JSON serialization.
 */
export interface EncryptedPayload {
  /** Initialization vector (hex) */
  iv: string;
  /** Encrypted data (hex) */
  data: string;
  /** GCM authentication tag (hex) */
  tag: string;
  /** PBKDF2 salt (hex) */
  salt: string;
}

/** AES-256-GCM key length in bytes */
const KEY_LENGTH = 32;
/** Initialization vector length in bytes */
const IV_LENGTH = 16;
/** GCM authentication tag length in bytes */
const TAG_LENGTH = 16;
/** PBKDF2 salt length in bytes */
const SALT_LENGTH = 32;
/** PBKDF2 iteration count */
const PBKDF2_ITERATIONS = 100_000;
/** PBKDF2 digest algorithm */
const PBKDF2_DIGEST = "sha512";

/**
 * Generates a cryptographically secure random salt.
 * @returns A random salt buffer of SALT_LENGTH bytes
 */
export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH);
}

/**
 * Derives a 256-bit encryption key from a user-provided key using PBKDF2.
 * @param userKey - The user's passphrase or key material
 * @param salt - The salt buffer for key derivation
 * @returns A 32-byte derived key buffer
 */
export function deriveKey(userKey: string, salt: Buffer): Buffer {
  return pbkdf2Sync(userKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}

/**
 * Encrypts a string using AES-256-GCM with PBKDF2 key derivation.
 * @param data - The plaintext string to encrypt
 * @param userKey - The user's passphrase used for key derivation
 * @returns An EncryptedPayload containing all values needed for decryption
 */
export function encrypt(data: string, userKey: string): EncryptedPayload {
  const salt = generateSalt();
  const derivedKey = deriveKey(userKey, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv("aes-256-gcm", derivedKey, iv, {
    authTagLength: TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    data: encrypted.toString("hex"),
    tag: tag.toString("hex"),
    salt: salt.toString("hex"),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload using the original user key.
 * @param payload - The EncryptedPayload produced by encrypt()
 * @param userKey - The same passphrase used during encryption
 * @returns The original plaintext string
 * @throws Error if decryption fails (wrong key or tampered data)
 */
export function decrypt(payload: EncryptedPayload, userKey: string): string {
  const salt = Buffer.from(payload.salt, "hex");
  const iv = Buffer.from(payload.iv, "hex");
  const encryptedData = Buffer.from(payload.data, "hex");
  const tag = Buffer.from(payload.tag, "hex");

  const derivedKey = deriveKey(userKey, salt);

  const decipher = createDecipheriv("aes-256-gcm", derivedKey, iv, {
    authTagLength: TAG_LENGTH,
  });

  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Produces a SHA-256 hash of sensitive data for storage or comparison.
 * This is a one-way hash and cannot be reversed.
 * @param data - The sensitive string to hash
 * @returns A hex-encoded SHA-256 hash string
 */
export function hashSensitiveData(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}
