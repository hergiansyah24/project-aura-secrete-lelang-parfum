# Asset Inventory - Sealed Bid (my project)

## 1. Tujuan

Dokumen ini mengidentifikasi aset penting pada aplikasi Sealed Bid, yaitu aplikasi lelang parfum langka dengan mekanisme penawaran tertutup (*sealed bid*). Identifikasi aset digunakan untuk menentukan data yang perlu dilindungi serta membantu proses analisis ancaman menggunakan metode STRIDE.

## 2. Daftar Aset

| ID | Aset | Lokasi atau Komponen | Kepentingan Keamanan |
|---|---|---|---|
| A01 | Akun dan identitas pengguna | `lib/db.ts`, tabel `users` | Mencegah penyalahgunaan akun dan kebocoran informasi pengguna. |
| A02 | Password pengguna | Tabel `users`, kolom `password_hash` | Melindungi kredensial melalui penyimpanan hash password. |
| A03 | Informasi pribadi pengguna | Tabel `users`, kolom terenkripsi untuk nama, nomor telepon, dan alamat | Menjaga kerahasiaan informasi pribadi. |
| A04 | Token sesi dan autentikasi | `lib/auth.ts`, cookie sesi | Mencegah pengambilalihan sesi dan akses tanpa izin. |
| A05 | Data lelang | Tabel `auctions` | Menjaga keutuhan informasi lelang, jadwal, dan statusnya. |
| A06 | Data penawaran | Tabel `bids` | Menjaga kerahasiaan dan keutuhan penawaran. |
| A07 | Commitment hash | Tabel `bids`, kolom `commitment_hash` | Memastikan nilai penawaran yang diungkapkan sesuai dengan commitment awal. |
| A08 | Nilai penawaran dan nonce | Bukti penawaran, penyimpanan browser, serta data reveal | Menjaga kerahasiaan penawaran sebelum pengungkapan resmi. |
| A09 | Kunci dan secret kriptografi | Konfigurasi aplikasi, `lib/crypto.ts`, `lib/auth.ts` | Melindungi data terenkripsi dan integritas token autentikasi. |
| A10 | Log aktivitas | `lib/audit.ts`, tabel `audit_logs` | Membantu pelacakan aktivitas dan investigasi insiden. |
| A11 | Database aplikasi | `data/sealed_bid.sqlite` | Melindungi data pengguna, lelang, penawaran, dan audit. |
| A12 | Kredensial akun demo | Proses seed akun pada aplikasi | Mencegah penggunaan kredensial bawaan untuk mengakses aplikasi produksi. |

**Catatan:** Nama file, tabel, dan kolom di atas perlu dicocokkan kembali dengan versi kode yang digunakan saat penilaian. Keberadaan aset dalam daftar tidak otomatis membuktikan adanya kerentanan.

## 3. Data yang Mendapat Perlindungan Kriptografi

| Data atau Aset | Mekanisme | Tujuan |
|---|---|---|
| Password | Hash password menggunakan bcrypt | Mencegah password tersimpan sebagai teks biasa. |
| Informasi pribadi tertentu | AES-256-GCM | Menjaga kerahasiaan dan integritas data terenkripsi. |
| Commitment penawaran | SHA-256 | Menghasilkan hash yang dapat diperiksa ketika proses reveal. |
| Token sesi | JWT dengan algoritma HS256 | Memverifikasi integritas token menggunakan secret yang sesuai. |
| Nilai penawaran dan nonce | Bukti penawaran pada browser atau file JSON | Memungkinkan pengguna menyimpan informasi yang diperlukan untuk proses reveal; penyimpanan ini bukan enkripsi dengan sendirinya. |

Penggunaan algoritma kriptografi tidak otomatis menjamin keamanan. Perlindungan juga bergantung pada pengelolaan kunci, kualitas nonce, validasi input, serta implementasi autentikasi dan otorisasi.

## 4. Batas Kepercayaan

Aplikasi memiliki beberapa area kepercayaan yang perlu diperhatikan:

1. **Browser pengguna:** menyimpan antarmuka dan dapat menyimpan bukti penawaran. Perangkat yang digunakan bersama atau terkena kompromi dapat membahayakan bukti tersebut.
2. **Server aplikasi:** memproses permintaan API, autentikasi, validasi penawaran, dan operasi kriptografi.
3. **Database server:** menyimpan informasi akun, lelang, penawaran, dan log aktivitas.
4. **Konfigurasi rahasia:** menyimpan secret yang digunakan untuk enkripsi dan autentikasi. Secret harus dilindungi dari akses pengguna yang tidak berwenang.

## 5. Aset dengan Prioritas Perlindungan Tinggi

Aset yang paling penting untuk dilindungi adalah:

- Nilai penawaran dan nonce sebelum proses reveal.
- Secret kriptografi dan token sesi.
- Data pribadi pengguna.
- Data lelang dan status penawaran.
- Catatan aktivitas yang dibutuhkan untuk memeriksa sengketa atau insiden keamanan.

Kebocoran atau perubahan pada aset-aset tersebut dapat mengganggu kerahasiaan, integritas, dan keadilan proses lelang.

## 6. Kesimpulan

Inventaris aset menjadi dasar untuk menyusun diagram arsitektur, mengidentifikasi ancaman STRIDE, menentukan prioritas risiko, dan memilih kontrol keamanan. Setiap aset harus dilindungi sesuai tingkat sensitivitas dan dampak apabila terjadi kebocoran, perubahan tanpa izin, atau kehilangan data.