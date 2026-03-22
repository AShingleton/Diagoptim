import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  generateSalt,
  hashSensitiveData,
} from "@/lib/utils/encryption";

// ---------------------------------------------------------------------------
// Encrypt / Decrypt round-trip
// ---------------------------------------------------------------------------

describe("Encryption - encrypt then decrypt", () => {
  it("returns original text after encrypt -> decrypt", () => {
    const plaintext = "Donnees confidentielles de l'entreprise";
    const key = "my-secret-passphrase-2024";

    const payload = encrypt(plaintext, key);
    const decrypted = decrypt(payload, key);

    expect(decrypted).toBe(plaintext);
  });

  it("handles empty string", () => {
    const key = "test-key";
    const payload = encrypt("", key);
    const decrypted = decrypt(payload, key);
    expect(decrypted).toBe("");
  });

  it("handles unicode text", () => {
    const plaintext = "Clef de chiffrement avec des accents: e, a, u, c";
    const key = "cle-secrete";
    const payload = encrypt(plaintext, key);
    const decrypted = decrypt(payload, key);
    expect(decrypted).toBe(plaintext);
  });

  it("handles long text", () => {
    const plaintext = "A".repeat(10_000);
    const key = "long-text-key";
    const payload = encrypt(plaintext, key);
    const decrypted = decrypt(payload, key);
    expect(decrypted).toBe(plaintext);
  });
});

// ---------------------------------------------------------------------------
// Different keys produce different ciphertexts
// ---------------------------------------------------------------------------

describe("Encryption - key differentiation", () => {
  it("different keys produce different ciphertexts", () => {
    const plaintext = "Same plaintext for both";
    const payload1 = encrypt(plaintext, "key-alpha");
    const payload2 = encrypt(plaintext, "key-beta");

    // The encrypted data should differ
    expect(payload1.data).not.toBe(payload2.data);
  });

  it("same key with same text still produces different ciphertexts due to random IV/salt", () => {
    const plaintext = "Determinism check";
    const key = "same-key";
    const payload1 = encrypt(plaintext, key);
    const payload2 = encrypt(plaintext, key);

    // Different IV and salt each time
    expect(payload1.iv).not.toBe(payload2.iv);
    expect(payload1.salt).not.toBe(payload2.salt);
  });
});

// ---------------------------------------------------------------------------
// Decrypt with wrong key
// ---------------------------------------------------------------------------

describe("Encryption - wrong key rejection", () => {
  it("throws when decrypting with wrong key", () => {
    const payload = encrypt("secret data", "correct-key");

    expect(() => decrypt(payload, "wrong-key")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Salt generation
// ---------------------------------------------------------------------------

describe("Encryption - generateSalt", () => {
  it("returns a Buffer of 32 bytes", () => {
    const salt = generateSalt();
    expect(Buffer.isBuffer(salt)).toBe(true);
    expect(salt.length).toBe(32);
  });

  it("generates unique salts", () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1.equals(salt2)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Hash
// ---------------------------------------------------------------------------

describe("Encryption - hashSensitiveData", () => {
  it("returns a 64-character hex string (SHA-256)", () => {
    const hash = hashSensitiveData("test-data");
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it("same input produces same hash", () => {
    const hash1 = hashSensitiveData("deterministic");
    const hash2 = hashSensitiveData("deterministic");
    expect(hash1).toBe(hash2);
  });

  it("different inputs produce different hashes", () => {
    const hash1 = hashSensitiveData("input-a");
    const hash2 = hashSensitiveData("input-b");
    expect(hash1).not.toBe(hash2);
  });
});
