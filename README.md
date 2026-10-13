# Sealed Bid -- Lelang Parfum Langka

## 1. Deskripsi Produk

Sealed Bid merupakan aplikasi lelang parfum langka yang menggunakan
mekanisme penawaran tertutup (commit-reveal). Pengguna dapat memasukkan
harga penawaran tanpa dapat melihat penawaran pengguna lain. Nilai
penawaran disimpan dalam bentuk commitment menggunakan fungsi hash SHA-256.

Setelah waktu lelang berakhir, pengguna melakukan reveal dengan
memasukkan kembali nilai penawaran dan nonce. Sistem kemudian melakukan
hash ulang dan membandingkannya dengan commitment yang telah disimpan
sebelumnya. Jika hasilnya sesuai, penawaran dianggap valid dan dapat
digunakan untuk menentukan pemenang lelang.

## 2. Requirements

| No | Kebutuhan | Keterangan |
|---|---|---|
| 1 | Login/Register | Pengguna harus melakukan autentikasi |
| 2 | Melihat lelang | Pengguna dapat melihat parfum yang sedang dilelang |
| 3 | Membuat penawaran | Pengguna dapat memasukkan nilai bid |
| 4 | Commitment | Sistem membuat hash dari bid dan nonce |
| 5 | Reveal | Pengguna mengungkapkan bid dan nonce setelah lelang berakhir |
| 6 | Verifikasi | Sistem membandingkan hash reveal dengan commitment |
| 7 | Menentukan pemenang | Penawaran valid tertinggi menjadi pemenang |
| 8 | Keamanan | Sistem mencegah manipulasi dan kecurangan |

## 3. Security Goals

- Menjaga kerahasiaan nilai bid sebelum proses reveal.
- Menjaga integritas data penawaran.
- Memastikan hanya pengguna yang terautentikasi yang dapat melakukan bid.
- Mencegah perubahan nilai bid setelah commitment dibuat.
- Mencegah manipulasi hasil lelang.
- Menggunakan nonce yang sulit ditebak untuk meningkatkan keamanan.

## 4. Prioritas Keamanan

1. Kerahasiaan nilai penawaran.
2. Integritas commitment.
3. Validasi proses reveal.
4. Autentikasi pengguna.
5. Pencegahan manipulasi dan kecurangan.
6. Pembatasan percobaan atau rate limiting.

## 5. Component Design

Sistem Sealed Bid menggunakan mekanisme commit-reveal untuk menjaga
kerahasiaan dan integritas nilai penawaran. Proses utama terdiri dari
input, proses kriptografi, penyimpanan commitment, proses reveal,
verifikasi, dan penentuan pemenang.

### Alur Input → Process → Output

| Tahap | Input | Process | Output |
|---|---|---|---|
| 1. Membuat Bid | Nilai bid + nonce | Sistem menggabungkan bid dan nonce | Data untuk proses hash |
| 2. Commitment | Bid + nonce | Data diproses menggunakan SHA-256 | Commitment/hash |
| 3. Penyimpanan | Commitment | Commitment disimpan ke sistem | Commitment tersimpan |
| 4. Reveal | Bid + nonce | Sistem melakukan hash ulang | Hash hasil reveal |
| 5. Verifikasi | Commitment + hash reveal | Sistem membandingkan kedua hash | Valid / Invalid |
| 6. Penentuan Pemenang | Bid yang valid | Sistem membandingkan nilai bid | Pemenang lelang |

### Alur Proses Commit-Reveal

```text
Pengguna
   ↓
Memasukkan Bid + Nonce
   ↓
Membuat Commitment
   ↓
SHA-256(Bid + Nonce)
   ↓
Commitment disimpan
   ↓
Lelang Berakhir
   ↓
Pengguna melakukan Reveal
   ↓
Bid + Nonce di-hash kembali
   ↓
SHA-256(Bid + Nonce)
   ↓
Bandingkan dengan Commitment
   ↓
┌─────────────────┐
│ Apakah sama?    │
└────────┬────────┘
         │
    ┌────┴────┐
   Ya        Tidak
    ↓           ↓
 VALID       INVALID
    ↓
Bid masuk
ke penentuan
pemenang
    ↓
Pemenang Lelang
```


## 6. Implementasi Kriptografi

Sistem menggunakan algoritma SHA-256 untuk menghasilkan commitment dari
nilai bid dan nonce. Nilai bid tidak disimpan secara langsung sebagai
commitment sehingga penawaran dapat dirahasiakan sebelum proses reveal.

### Proses Commitment

Input:
- Nilai bid
- Nonce acak

Proses:
- Bid dan nonce digabungkan.
- Data tersebut diproses menggunakan SHA-256.

Output:
- Commitment berupa nilai hash.

Contoh:

Bid = Rp500.000
Nonce = random123

SHA-256("500000:random123")
→ Commitment

----------
# Pemrograman Web

# Aura Secrète — Lelang Parfum Langka

## 1. Deskripsi Produk



Aura Secrète adalah aplikasi lelang parfum langka yang menggunakan mekanisme sealed bid atau penawaran tertutup. Aplikasi ini membantu pengguna menemukan parfum yang dilelang, mengajukan penawaran, dan memeriksa hasil lelang melalui antarmuka web.

## 2. Masalah dan Target Pengguna

Parfum langka dan edisi terbatas memiliki peminat khusus. Proses lelang perlu menyediakan informasi yang jelas, navigasi yang mudah, dan mekanisme penawaran yang menjaga kerahasiaan nilai bid sebelum proses reveal.

Target pengguna:
- Penggemar dan kolektor parfum langka.
- Pengguna yang ingin mengikuti lelang parfum secara daring.
- Administrator yang mengelola lelang dan memantau aktivitas aplikasi.

## 3. Fitur Utama

- Halaman utama dan katalog parfum lelang.
- Pencarian, filter, dan pengurutan lelang.
- Registrasi dan login pengguna.
- Pengajuan penawaran tertutup (commit).
- Reveal dan verifikasi penawaran.
- Countdown dan informasi status lelang.
- Halaman profil dan riwayat penawaran.
- Fitur administrasi dan pencatatan aktivitas keamanan.
- Penjelasan mekanisme kriptografi dan verifikasi bukti.

## 4. Teknologi

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- API dan database SQLite
- JWT untuk autentikasi
- SHA-256 untuk commitment penawaran
- AES-256-GCM untuk perlindungan data sensitif

## 5. Struktur Proyek

- `app/` — halaman aplikasi dan API.
- `components/` — komponen antarmuka yang dapat digunakan kembali.
- `components/landing/` — komponen landing page.
- `public/landing/` — aset gambar landing page.
- `lib/` — logika autentikasi, kriptografi, database, dan audit.
- `crypto/` — dokumentasi mata kuliah Kriptografi.
- `security/` — dokumentasi analisis dan kontrol keamanan.
- `tests/` — pengujian kriptografi.
- `types/` — definisi tipe TypeScript.

## 6. Instalasi dan Menjalankan Aplikasi

Persyaratan: Node.js dan npm.

1. Clone repository dan masuk ke folder proyek.
2. Instal dependensi:

   ```bash
   npm install