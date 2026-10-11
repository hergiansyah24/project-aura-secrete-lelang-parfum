import test from "node:test";
import assert from "node:assert/strict";

import {
  encryptSensitiveData,
  decryptSensitiveData,
  computeCommitmentHash,
  verifyCommitmentHash,
  generateSecureNonce,
} from "../lib/crypto.ts";

test("AES-256-GCM: teks kembali sama setelah enkripsi dan dekripsi", () => {
  const original = "Data uji pengguna sintetis";
  const encrypted = encryptSensitiveData(original);

  assert.notEqual(encrypted, original);
  assert.equal(decryptSensitiveData(encrypted), original);
});

test("AES-256-GCM: ciphertext yang dimodifikasi tidak menghasilkan teks asli", () => {
  const encrypted = encryptSensitiveData("Data uji sintetis");
  const parts = encrypted.split(":");

  assert.equal(parts.length, 3);
  const modifiedCiphertext =
    `${parts[0]}:${parts[1]}:${parts[2]}${parts[2].length ? "00" : "01"}`;

  assert.equal(
  decryptSensitiveData(modifiedCiphertext),
  "[DECRYPTION_ERROR_TAMPERED_DATA]"
);
});

test("Commitment: hash yang benar berhasil diverifikasi", () => {
  const hash = computeCommitmentHash(1, 500000, "nonce-uji-sintetis");

  assert.equal(hash.length, 64);
  assert.equal(
    verifyCommitmentHash(1, 500000, "nonce-uji-sintetis", hash),
    true,
  );
});

test("Commitment: bid yang berbeda gagal diverifikasi", () => {
  const hash = computeCommitmentHash(1, 500000, "nonce-uji-sintetis");

  assert.equal(
    verifyCommitmentHash(1, 600000, "nonce-uji-sintetis", hash),
    false,
  );
});

test("Nonce: panjang dan format sesuai 32 byte acak", () => {
  const nonce = generateSecureNonce();

  assert.match(nonce, /^[0-9a-f]{64}$/);
});

test("Batas input: teks kosong tetap kosong setelah enkripsi dan dekripsi", () => {
  assert.equal(encryptSensitiveData(""), "");
  assert.equal(decryptSensitiveData(""), "");
});