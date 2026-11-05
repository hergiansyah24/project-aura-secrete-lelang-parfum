import test from "node:test";
import assert from "node:assert/strict";

import {
  registerSchema,
  loginSchema,
  commitBidSchema,
  revealBidSchema,
  createAuctionSchema,
  firstErrorMessage,
  fieldErrors,
} from "./index.ts";

const validRegister = {
  username: "Budi_01",
  email: "  Budi@Mail.COM ",
  password: "abcdef12",
  fullName: "Budi Santoso",
  phone: "+62 812-3456-7890",
  address: "Jl. Mawar No. 1",
};

function rejectedMessage(result: { success: boolean; error?: Parameters<typeof firstErrorMessage>[0] }) {
  assert.equal(result.success, false);
  return firstErrorMessage(result.error!);
}

// ---------------------------------------------------------------- register
test("register: input valid dinormalisasi (trim + lowercase)", () => {
  const result = registerSchema.safeParse(validRegister);
  assert.equal(result.success, true);
  assert.equal(result.data?.username, "budi_01");
  assert.equal(result.data?.email, "budi@mail.com");
});

test("register: profil opsional di server, default string kosong", () => {
  const result = registerSchema.safeParse({
    username: "budi",
    email: "b@c.id",
    password: "abcdef12",
  });
  assert.equal(result.success, true);
  assert.deepEqual(
    [result.data?.fullName, result.data?.phone, result.data?.address],
    ["", "", ""]
  );
});

test("register: menolak email '@' yang lolos di validasi lama", () => {
  const result = registerSchema.safeParse({ ...validRegister, email: "@" });
  assert.equal(rejectedMessage(result), "Format email tidak valid.");
});

test("register: menolak username berisi karakter berbahaya", () => {
  const result = registerSchema.safeParse({
    ...validRegister,
    username: "<script>alert(1)</script>",
  });
  assert.match(rejectedMessage(result), /hanya boleh berisi huruf/);
});

test("register: batas panjang username", () => {
  assert.equal(registerSchema.safeParse({ ...validRegister, username: "ab" }).success, false);
  assert.equal(
    registerSchema.safeParse({ ...validRegister, username: "a".repeat(3000) }).success,
    false
  );
});

test("register: aturan password (panjang, huruf, angka, batas 72 byte)", () => {
  const bad = (password: unknown) =>
    registerSchema.safeParse({ ...validRegister, password }).success;

  assert.equal(bad("a1"), false); // terlalu pendek
  assert.equal(bad("11111111"), false); // tanpa huruf
  assert.equal(bad("abcdefgh"), false); // tanpa angka
  assert.equal(bad("a1".repeat(50)), false); // > 72 byte
  assert.equal(bad(12345678), false); // bukan string
  assert.equal(bad("abcdef12"), true);
});

test("register: nomor telepon tidak valid ditolak", () => {
  const result = registerSchema.safeParse({ ...validRegister, phone: "abc" });
  assert.match(rejectedMessage(result), /Nomor telepon tidak valid/);
});

test("register: isi request bukan objek -> pesan ramah", () => {
  assert.equal(rejectedMessage(registerSchema.safeParse(null)), "Data permintaan tidak valid.");
});

test("fieldErrors: pesan dikelompokkan per field", () => {
  const result = registerSchema.safeParse({ ...validRegister, username: "ab", email: "x" });
  assert.equal(result.success, false);
  const errors = fieldErrors(result.error!);
  assert.ok(errors.username);
  assert.ok(errors.email);
  assert.equal(errors.password, undefined);
});

// ------------------------------------------------------------------- login
test("login: identifier dinormalisasi, field kosong ditolak", () => {
  const ok = loginSchema.safeParse({ identifier: " Curator@X.com ", password: "x" });
  assert.equal(ok.success, true);
  assert.equal(ok.data?.identifier, "curator@x.com");

  const empty = loginSchema.safeParse({ identifier: "", password: "" });
  assert.equal(rejectedMessage(empty), "Username/Email dan password harus diisi.");
});

// ---------------------------------------------------------------- commit bid
test("commit: hash SHA-256 valid dinormalisasi ke huruf kecil", () => {
  const result = commitBidSchema.safeParse({
    auctionId: "3",
    commitmentHash: "A".repeat(64),
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.auctionId, 3);
  assert.equal(result.data?.commitmentHash, "a".repeat(64));
});

test("commit: hash tidak valid dan ID lelang tidak valid ditolak", () => {
  assert.match(
    rejectedMessage(commitBidSchema.safeParse({ auctionId: 1, commitmentHash: "zz" })),
    /64-karakter SHA-256/
  );
  assert.equal(
    rejectedMessage(commitBidSchema.safeParse({ auctionId: -1, commitmentHash: "a".repeat(64) })),
    "ID lelang tidak valid."
  );
  assert.equal(
    commitBidSchema.safeParse({ auctionId: 1, commitmentHash: "g".repeat(64) }).success,
    false
  );
});

// ---------------------------------------------------------------- reveal bid
test("reveal: nominal string dikonversi, nonce di-trim", () => {
  const result = revealBidSchema.safeParse({
    auctionId: 1,
    bidAmount: "50000000",
    nonce: " abc ",
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.bidAmount, 50000000);
  assert.equal(result.data?.nonce, "abc");
});

test("reveal: nominal negatif, desimal, bukan angka, dan nonce kosong ditolak", () => {
  const base = { auctionId: 1, bidAmount: 100, nonce: "x" };
  assert.equal(revealBidSchema.safeParse({ ...base, bidAmount: -5 }).success, false);
  assert.equal(revealBidSchema.safeParse({ ...base, bidAmount: 1.5 }).success, false);
  assert.equal(revealBidSchema.safeParse({ ...base, bidAmount: "abc" }).success, false);
  assert.equal(revealBidSchema.safeParse({ ...base, bidAmount: 1e15 }).success, false);
  assert.equal(
    rejectedMessage(revealBidSchema.safeParse({ ...base, nonce: "   " })),
    "Secret Nonce diperlukan untuk membuka penawaran."
  );
});

// ------------------------------------------------------------ create auction
const validAuction = {
  title: "Mykonos No. 1",
  perfumeHouse: "Mykonos",
  description: "Parfum lokal edisi terbatas.",
  startingPrice: "2500000",
};

test("lelang: field opsional memakai nilai bawaan", () => {
  const result = createAuctionSchema.safeParse(validAuction);
  assert.equal(result.success, true);
  assert.equal(result.data?.startingPrice, 2500000);
  assert.equal(result.data?.volumeMl, 50);
  assert.equal(result.data?.commitDurationHours, 2);
  assert.equal(result.data?.revealDurationHours, 2);
  assert.equal(result.data?.bottleYear, "Limited Edition");
  assert.equal(result.data?.imageUrl, undefined);
});

test("lelang: harga negatif / bukan angka / deskripsi kosong ditolak", () => {
  assert.equal(createAuctionSchema.safeParse({ ...validAuction, startingPrice: -1 }).success, false);
  assert.equal(createAuctionSchema.safeParse({ ...validAuction, startingPrice: "abc" }).success, false);
  assert.equal(
    rejectedMessage(createAuctionSchema.safeParse({ ...validAuction, description: undefined })),
    "Deskripsi wajib diisi."
  );
});

test("lelang: durasi dibatasi, durasi kosong memakai default 2 jam", () => {
  assert.equal(
    createAuctionSchema.safeParse({ ...validAuction, commitDurationHours: 9999 }).success,
    false
  );
  const result = createAuctionSchema.safeParse({
    ...validAuction,
    commitDurationHours: "",
    revealDurationHours: 0.05,
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.commitDurationHours, 2);
  assert.equal(result.data?.revealDurationHours, 0.05);
});

test("lelang: gambar hanya path lokal aman atau URL http(s)", () => {
  const withImage = (imageUrl: string) =>
    createAuctionSchema.safeParse({ ...validAuction, imageUrl }).success;

  assert.equal(withImage("/products/mykonos-01.png"), true);
  assert.equal(withImage("https://images.unsplash.com/x.jpg"), true);
  assert.equal(withImage("javascript:alert(1)"), false);
  assert.equal(withImage("//evil.com/x.png"), false);
  assert.equal(withImage("/../etc/passwd"), false);
  assert.equal(withImage("data:text/html,<script>1</script>"), false);
});
