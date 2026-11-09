import crypto from "node:crypto";
import assert from "node:assert/strict";

// Inisialisasi secret sintetis CSPRNG jika environment belum menyediakan
if (!process.env.ENCRYPTION_SECRET || process.env.ENCRYPTION_SECRET.length < 32) {
  process.env.ENCRYPTION_SECRET = crypto.randomBytes(32).toString("hex");
}

interface TestResult {
  scenario: string;
  category: "POSITIF" | "NEGATIF";
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
}

async function runTests(): Promise<void> {
  const isDetail = process.argv.includes("--detail");
  const { encryptAEAD, decryptAEAD } = await import("../lib/crypto.ts");

  console.log("================================================================================");
  console.log(" PENGUJIAN INTEGRITAS & ENKRIPSI TERAUTENTIKASI (AEAD AES-256-GCM)");
  console.log(" Domain: Riggisa Parfume Secrète (Sealed-Bid Luxury Auction)");
  if (isDetail) {
    console.log(" Mode  : DETAIL AKTIF (--detail)");
  }
  console.log("================================================================================\n");

  const results: TestResult[] = [];

  // Data sintetis lelang Riggisa Parfume Secrète
  const syntheticPlaintext = JSON.stringify({
    bidAmount: 2750000,
    currency: "IDR",
    perfumeNote: "Extrait de Parfum Sealed Bid",
  });
  const syntheticAAD = "auctionId:AUC-2026-09|bidderId:USR-SYNTH-88|phase:COMMIT";

  console.log("[INFO] Plaintext Sintetis :", syntheticPlaintext);
  console.log("[INFO] AAD Sintetis        :", syntheticAAD);
  console.log("");

  // Skenario 1 [POSITIF - BERHASIL]
  try {
    const payload = encryptAEAD(syntheticPlaintext, syntheticAAD);
    assert.equal(payload.iv.length, 24, "IV harus 24 hex char (12 byte / 96-bit)");
    assert.equal(payload.tag.length, 32, "Tag harus 32 hex char (16 byte / 128-bit)");
    assert.ok(payload.ciphertext.length > 0, "Ciphertext tidak boleh kosong");

    const decrypted = decryptAEAD(payload, syntheticAAD);
    assert.equal(decrypted, syntheticPlaintext, "Hasil dekripsi harus identik 100%");

    results.push({
      scenario: "1. Valid Key, IV, Tag, & AAD",
      category: "POSITIF",
      expected: "Dekripsi berhasil identik 100%",
      actual: "Dekripsi sukses & data terverifikasi",
      status: "PASS",
    });
    console.log("✔ Skenario 1 [POSITIF - BERHASIL]: Enkripsi & dekripsi valid menghasilkan plaintext identik.");
    if (isDetail) {
      console.log("    ├── IV (24 hex / 96-bit)  :", payload.iv);
      console.log("    ├── Tag (32 hex / 128-bit):", payload.tag);
      console.log("    ├── Ciphertext (hex)      :", `${payload.ciphertext.slice(0, 32)}... (${payload.ciphertext.length} chars)`);
      console.log("    └── Hasil Dekripsi        :", decrypted);
    }
  } catch (err) {
    results.push({
      scenario: "1. Valid Key, IV, Tag, & AAD",
      category: "POSITIF",
      expected: "Dekripsi berhasil identik 100%",
      actual: err instanceof Error ? err.message : String(err),
      status: "FAIL",
    });
    console.error("✖ Skenario 1 GAGAL:", err);
  }

  // Skenario 2 [NEGATIF - DITOLAK]: Ciphertext dimodifikasi (bit-flipping)
  try {
    const payload = encryptAEAD(syntheticPlaintext, syntheticAAD);
    const flippedChar = payload.ciphertext[0] === "a" ? "b" : "a";
    const tamperedCiphertext = flippedChar + payload.ciphertext.slice(1);
    const tamperedPayload = { ...payload, ciphertext: tamperedCiphertext };

    let caughtError: string | null = null;
    try {
      decryptAEAD(tamperedPayload, syntheticAAD);
    } catch (e) {
      if (e instanceof Error) caughtError = e.message;
    }

    assert.ok(caughtError !== null, "Harus melempar error saat ciphertext dimodifikasi");
    assert.match(caughtError, /Fail-Closed/, "Error harus menerapkan prinsip fail-closed");

    results.push({
      scenario: "2. Tampered Ciphertext (Bit-flip)",
      category: "NEGATIF",
      expected: "Ditolak fail-closed (Integrity check failed)",
      actual: "Ditolak: Fail-Closed exception tertangkap",
      status: "PASS",
    });
    console.log("✔ Skenario 2 [NEGATIF - DITOLAK]: Ciphertext termodifikasi berhasil ditolak (fail-closed).");
    if (isDetail) {
      console.log("    ├── Asli Ciphertext :", `${payload.ciphertext.slice(0, 24)}...`);
      console.log("    ├── Cacat Bit-flip  :", `${tamperedCiphertext.slice(0, 24)}...`);
      console.log("    └── Respon Eksepsi  :", caughtError);
    }
  } catch (err) {
    results.push({
      scenario: "2. Tampered Ciphertext (Bit-flip)",
      category: "NEGATIF",
      expected: "Ditolak fail-closed",
      actual: err instanceof Error ? err.message : String(err),
      status: "FAIL",
    });
    console.error("✖ Skenario 2 GAGAL:", err);
  }

  // Skenario 3 [NEGATIF - DITOLAK]: Auth Tag (MAC) dimodifikasi
  try {
    const payload = encryptAEAD(syntheticPlaintext, syntheticAAD);
    const flippedTagChar = payload.tag[0] === "f" ? "0" : "f";
    const tamperedTag = flippedTagChar + payload.tag.slice(1);
    const tamperedPayload = { ...payload, tag: tamperedTag };

    let caughtError: string | null = null;
    try {
      decryptAEAD(tamperedPayload, syntheticAAD);
    } catch (e) {
      if (e instanceof Error) caughtError = e.message;
    }

    assert.ok(caughtError !== null, "Harus melempar error saat auth tag dimodifikasi");
    assert.match(caughtError, /Fail-Closed/, "Error harus menerapkan prinsip fail-closed");

    results.push({
      scenario: "3. Tampered Auth Tag (MAC)",
      category: "NEGATIF",
      expected: "Ditolak fail-closed (Tag verification failed)",
      actual: "Ditolak: Fail-Closed exception tertangkap",
      status: "PASS",
    });
    console.log("✔ Skenario 3 [NEGATIF - DITOLAK]: Tag autentikasi termodifikasi berhasil ditolak (fail-closed).");
    if (isDetail) {
      console.log("    ├── Asli Tag       :", payload.tag);
      console.log("    ├── Cacat Tag      :", tamperedTag);
      console.log("    └── Respon Eksepsi :", caughtError);
    }
  } catch (err) {
    results.push({
      scenario: "3. Tampered Auth Tag (MAC)",
      category: "NEGATIF",
      expected: "Ditolak fail-closed",
      actual: err instanceof Error ? err.message : String(err),
      status: "FAIL",
    });
    console.error("✖ Skenario 3 GAGAL:", err);
  }

  // Skenario 4 [NEGATIF - DITOLAK]: AAD dimodifikasi / konteks tidak cocok (Auction Swapping)
  try {
    const payload = encryptAEAD(syntheticPlaintext, syntheticAAD);
    const mismatchedAAD = "auctionId:AUC-2026-99|bidderId:USR-SYNTH-88|phase:COMMIT";

    let caughtError: string | null = null;
    try {
      decryptAEAD(payload, mismatchedAAD);
    } catch (e) {
      if (e instanceof Error) caughtError = e.message;
    }

    assert.ok(caughtError !== null, "Harus melempar error saat AAD tidak cocok");
    assert.match(caughtError, /Fail-Closed/, "Error harus menerapkan prinsip fail-closed");

    results.push({
      scenario: "4. Mismatched AAD / Context Swapping",
      category: "NEGATIF",
      expected: "Ditolak fail-closed (Context mismatch)",
      actual: "Ditolak: Fail-Closed exception tertangkap",
      status: "PASS",
    });
    console.log("✔ Skenario 4 [NEGATIF - DITOLAK]: Konteks AAD tidak cocok berhasil ditolak (fail-closed).");
    if (isDetail) {
      console.log("    ├── AAD Terenkripsi :", syntheticAAD);
      console.log("    ├── AAD Diminta     :", mismatchedAAD);
      console.log("    └── Respon Eksepsi  :", caughtError);
    }
  } catch (err) {
    results.push({
      scenario: "4. Mismatched AAD / Context Swapping",
      category: "NEGATIF",
      expected: "Ditolak fail-closed",
      actual: err instanceof Error ? err.message : String(err),
      status: "FAIL",
    });
    console.error("✖ Skenario 4 GAGAL:", err);
  }

  // Skenario 5 [NEGATIF - DITOLAK]: Kunci salah (kunci sintetis kedua dari CSPRNG)
  try {
    const payload = encryptAEAD(syntheticPlaintext, syntheticAAD);
    const wrongKeySecret = crypto.randomBytes(32).toString("hex");

    let caughtError: string | null = null;
    try {
      decryptAEAD(payload, syntheticAAD, wrongKeySecret);
    } catch (e) {
      if (e instanceof Error) caughtError = e.message;
    }

    assert.ok(caughtError !== null, "Harus melempar error saat kunci salah");
    assert.match(caughtError, /Fail-Closed/, "Error harus menerapkan prinsip fail-closed");

    results.push({
      scenario: "5. Wrong Key Decryption Attempt",
      category: "NEGATIF",
      expected: "Ditolak fail-closed (Unauthorized key)",
      actual: "Ditolak: Fail-Closed exception tertangkap",
      status: "PASS",
    });
    console.log("✔ Skenario 5 [NEGATIF - DITOLAK]: Dekripsi dengan kunci yang salah berhasil ditolak (fail-closed).");
    if (isDetail) {
      console.log("    ├── Kunci Asli (SHA-256 digest) : [VALID-KEY]");
      console.log("    ├── Kunci Salah (CSPRNG kedua)  :", `${wrongKeySecret.slice(0, 16)}...`);
      console.log("    └── Respon Eksepsi              :", caughtError);
    }
  } catch (err) {
    results.push({
      scenario: "5. Wrong Key Decryption Attempt",
      category: "NEGATIF",
      expected: "Ditolak fail-closed",
      actual: err instanceof Error ? err.message : String(err),
      status: "FAIL",
    });
    console.error("✖ Skenario 5 GAGAL:", err);
  }

  // Skenario 6 [NEGATIF - DITOLAK]: Validasi input tidak sah (plaintext kosong atau format payload cacat)
  try {
    const validPayload = encryptAEAD(syntheticPlaintext, syntheticAAD);
    const subErrors: string[] = [];

    // 6a: Plaintext kosong
    try {
      encryptAEAD("", syntheticAAD);
    } catch (e) {
      if (e instanceof Error) subErrors.push(`[Plaintext Kosong] ${e.message}`);
    }

    // 6b: AAD kosong
    try {
      encryptAEAD(syntheticPlaintext, "");
    } catch (e) {
      if (e instanceof Error) subErrors.push(`[AAD Kosong] ${e.message}`);
    }

    // 6c: IV panjang tidak sesuai
    try {
      decryptAEAD({ ...validPayload, iv: "abcd" }, syntheticAAD);
    } catch (e) {
      if (e instanceof Error) subErrors.push(`[IV Cacat] ${e.message}`);
    }

    // 6d: Tag panjang tidak sesuai
    try {
      decryptAEAD({ ...validPayload, tag: "1234" }, syntheticAAD);
    } catch (e) {
      if (e instanceof Error) subErrors.push(`[Tag Cacat] ${e.message}`);
    }

    assert.equal(subErrors.length, 4, "Seluruh 4 kondisi masukan tidak sah wajib ditolak");

    results.push({
      scenario: "6. Invalid Input & Malformed Params",
      category: "NEGATIF",
      expected: "Ditolak pada tahap validasi awal",
      actual: "Ditolak: Validasi masukan gagal tertutup",
      status: "PASS",
    });
    console.log("✔ Skenario 6 [NEGATIF - DITOLAK]: Input tidak valid dan parameter cacat berhasil ditolak.");
    if (isDetail) {
      subErrors.forEach((msg) => console.log("    ├──", msg));
    }
  } catch (err) {
    results.push({
      scenario: "6. Invalid Input & Malformed Params",
      category: "NEGATIF",
      expected: "Ditolak pada tahap validasi awal",
      actual: err instanceof Error ? err.message : String(err),
      status: "FAIL",
    });
    console.error("✖ Skenario 6 GAGAL:", err);
  }

  // Ringkasan tabel
  console.log("\n================================================================================");
  console.log(" RINGKASAN HASIL PENGUJIAN AEAD INTEGRITAS (6 SKENARIO)");
  console.log("================================================================================");
  console.table(
    results.map((r) => ({
      Skenario: r.scenario,
      Kategori: r.category,
      Ekspektasi: r.expected,
      Hasil: r.actual,
      Status: r.status,
    }))
  );

  const allPassed = results.every((r) => r.status === "PASS");
  if (allPassed && results.length === 6) {
    console.log("HASIL AKHIR: SEMUA 6 SKENARIO UJI LULUS VERIFIKASI (PASS) DENGAN EXIT CODE 0.");
    process.exit(0);
  } else {
    console.error("HASIL AKHIR: TERDAPAT SKENARIO UJI YANG GAGAL.");
    process.exit(1);
  }
}

void runTests();
