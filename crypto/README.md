# Dokumentasi Kriptografi - Aura Secrète (my project)

## Biodata

| id | keterangan |
|---|---|
| Nama | Rizqy hergiansyah |
| Nim | 105224010 |
| Mata kuliah | Kriptografi |

## 1. Deskripsi

Aura Secrète merupakan aplikasi lelang parfum langka dengan mekanisme *sealed bid* menggunakan pendekatan **commit-reveal**. Pengguna membuat commitment dari identitas lelang, nilai penawaran, dan nonce. Setelah periode lelang berakhir, sistem menghitung ulang hash dari data yang diungkapkan untuk memeriksa kesesuaiannya dengan commitment awal.

Dokumentasi ini menjelaskan komponen kriptografi yang digunakan, tujuan keamanan data, desain input–proses–output, dan pengujian otomatis.

## 2. Pemetaan Data dan Tujuan Keamanan

| Data | Tujuan keamanan | Prioritas |
|---|---|---|
| Nilai penawaran (*bid*) | Menjaga kerahasiaan sebelum reveal dan mencegah perubahan nilai setelah commitment dibuat | Tinggi |
| Nonce | Menjaga ketidakmudahan prediksi commitment dan mendukung proses verifikasi | Tinggi |
| Commitment hash | Memeriksa integritas dan kesesuaian data saat reveal | Tinggi |
| Data pribadi pengguna | Menjaga kerahasiaan data yang dipilih untuk dienkripsi | Tinggi |
| Kunci enkripsi | Menjaga kerahasiaan data terenkripsi agar tidak dapat dibuka tanpa kunci yang benar | Kritis |

## 3. Komponen dan Algoritma

### 3.1 AES-256-GCM

AES-256-GCM digunakan oleh `lib/crypto.ts` untuk mengenkripsi dan mendekripsi data sensitif melalui fungsi `encryptSensitiveData()` dan `decryptSensitiveData()`.

- **Input:** teks yang akan dilindungi.
- **Proses:** secret dari environment digunakan untuk membentuk kunci 256-bit melalui SHA-256. Fungsi enkripsi membuat IV acak sepanjang 12 byte, kemudian mengenkripsi teks menggunakan AES-256-GCM.
- **Output:** string yang terdiri dari IV, authentication tag, dan ciphertext dalam representasi heksadesimal, dipisahkan dengan tanda titik dua.
- **Integritas:** authentication tag diperiksa saat dekripsi sehingga perubahan pada ciphertext dapat dideteksi.

Kunci diturunkan dari `ENCRYPTION_SECRET` menggunakan SHA-256. Secret wajib tersedia melalui environment dan memiliki panjang minimal 32 karakter. Secret harus dijaga kerahasiaannya dan tidak disimpan di repository.

### 3.2 SHA-256 Commitment

Fungsi `computeCommitmentHash()` membuat commitment dengan rumus:

`SHA-256(auctionId:bidAmount:nonce)`

- **Input:** ID lelang, nilai penawaran, dan nonce.
- **Proses:** ketiga nilai digabungkan sebagai string UTF-8 dengan pemisah titik dua, kemudian diproses menggunakan SHA-256.
- **Output:** hash heksadesimal sepanjang 64 karakter.

SHA-256 merupakan fungsi hash satu arah, bukan enkripsi. Hash tidak dapat didekripsi untuk memperoleh data awal. Keamanan commitment juga bergantung pada kerahasiaan nonce dan desain protokol.

### 3.3 Verifikasi Commitment

Fungsi `verifyCommitmentHash()` menghitung ulang commitment dari data reveal dan membandingkannya dengan hash yang diharapkan. Perbandingan hash menggunakan `crypto.timingSafeEqual()` setelah panjang buffer diperiksa.

Hasilnya berupa `true` apabila hash cocok dan `false` apabila tidak cocok atau terjadi kesalahan pada proses verifikasi.

### 3.4 Nonce Kriptografis

Fungsi `generateSecureNonce()` menggunakan `crypto.randomBytes(32)` dari modul bawaan `node:crypto`.

- Ukuran: 32 byte acak.
- Representasi: 64 karakter heksadesimal.
- Sumber randomness: generator bilangan acak kriptografis dari Node.js.

Nonce bukan password atau kunci enkripsi, tetapi nilai acak yang digunakan dalam commitment. Nonce harus dibuat dengan sumber acak yang aman dan tidak mudah ditebak.

### 3.5 Pustaka Kriptografi dan Alasan Pemilihan

Proyek ini menggunakan modul bawaan `node:crypto` dari Node.js untuk operasi kriptografi di sisi server. Pustaka ini dipilih karena menyediakan implementasi algoritma kriptografi yang terintegrasi dengan Node.js, tanpa memerlukan dependensi tambahan untuk AES-256-GCM, SHA-256, pembangkitan nilai acak yang aman, dan perbandingan hash dengan waktu yang relatif konstan.

Untuk operasi di browser, `lib/client-crypto.ts` menggunakan Web Crypto API. Fungsi `crypto.getRandomValues()` digunakan untuk menghasilkan nonce, sedangkan `crypto.subtle.digest()` digunakan untuk menghitung SHA-256.

Kedua API tersebut dipilih sesuai lingkungan eksekusinya, yaitu Node.js untuk server dan Web Crypto API untuk browser. Penggunaan API kriptografi yang tersedia tidak otomatis menjamin keamanan seluruh aplikasi. Pengelolaan secret, implementasi, validasi input, dan pengujian tetap diperlukan.

## 4. Encoding, Hashing, dan Enkripsi

| Konsep | Fungsi | Contoh dalam proyek |
|---|---|---|
| Encoding | Mengubah representasi data tanpa menyembunyikan isi | Teks UTF-8 menjadi heksadesimal |
| Hashing | Menghasilkan sidik digital satu arah untuk pemeriksaan kesesuaian | SHA-256 commitment |
| Enkripsi | Melindungi isi data dan memungkinkan pemulihan dengan kunci yang benar | AES-256-GCM |

Encoding bukan mekanisme kerahasiaan. Hashing tidak sama dengan enkripsi karena hash tidak menyediakan proses dekripsi. AES-256-GCM digunakan untuk kerahasiaan sekaligus autentikasi ciphertext.

## 5. Pengujian Otomatis

Pengujian berada pada `tests/crypto.test.ts` dan dijalankan menggunakan Node.js Test Runner.

Perintah pengujian:

```powershell
$env:ENCRYPTION_SECRET = "test-only-secret-for-crypto-tests-123456"
npm run test:crypto
```

Secret di atas hanya untuk pengujian lokal. Jangan gunakan nilai contoh ini sebagai secret produksi.

Skenario yang diuji:

1. Enkripsi dan dekripsi AES-256-GCM: teks hasil dekripsi sama dengan teks asli.
2. Ciphertext dimodifikasi: data yang autentikasinya tidak valid ditolak dan menghasilkan penanda kesalahan  dekripsi.
3. Commitment yang benar berhasil diverifikasi.
4. Nilai bid yang berbeda gagal diverifikasi.
5. Nonce memiliki panjang dan format yang sesuai.
6. Batas input kosong: teks kosong tetap kosong setelah enkripsi maupun dekripsi.

**Hasil pengujian terakhir:** 6 tes lolos dan 0 tes gagal. Hasil ini menunjukkan bahwa seluruh skenario yang tercantum berhasil pada saat pengujian, tetapi bukan bukti bahwa seluruh keamanan aplikasi telah terjamin.

## 6. Cara Menjalankan

1. Instal dependensi dengan `npm install`.
2. Atur `ENCRYPTION_SECRET` melalui environment lokal yang aman.
3. Jalankan aplikasi dengan `npm run dev`.
4. Jalankan pengujian kriptografi dengan `npm run test:crypto`.

Pastikan file environment yang berisi secret tidak di-commit ke repository.

## 7. Referensi Implementasi

- `lib/crypto.ts` — enkripsi AES-256-GCM, commitment SHA-256, verifikasi, dan nonce.
- `lib/client-crypto.ts` — komponen kriptografi sisi browser.
- `tests/crypto.test.ts` — pengujian otomatis komponen server.
- `package.json` — script untuk menjalankan pengujian.

## 8. Batasan

Dokumentasi ini menjelaskan komponen yang tersedia dalam implementasi saat ini. Enkripsi pada fungsi tertentu tidak berarti seluruh database otomatis terenkripsi. Kerahasiaan penawaran juga bergantung pada penyimpanan bukti bid, pengelolaan nonce, kontrol akses, dan alur aplikasi secara keseluruhan. Setiap klaim keamanan harus disesuaikan dengan kode dan hasil pengujian yang benar-benar telah diperiksa.