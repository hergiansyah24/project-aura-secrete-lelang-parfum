# Aura Secrète — Lelang Parfum Langka

## Deskripsi
Aura Secrète adalah aplikasi web lelang parfum langka menggunakan mekanisme sealed bid. Pengguna dapat melihat lelang dan mengirim penawaran tertutup.

## Fitur
- Landing page responsif untuk desktop, tablet, dan ponsel.
- Navigasi dan informasi parfum lelang.
- Login dan registrasi dengan validasi input.
- Komponen UI yang dapat digunakan kembali.
- Countdown dan alur penawaran tertutup.
- Commitment penawaran menggunakan SHA-256.
- Verifikasi penawaran.

## Teknologi
- Next.js, React, TypeScript
- Tailwind CSS
- SQLite
- JWT untuk autentikasi
- SHA-256 untuk commitment
- AES-256-GCM untuk perlindungan data sensitif

## Struktur Proyek
- `app/`: halaman aplikasi.
- `components/`: komponen antarmuka.
- `components/landing/`: komponen landing page.
- `public/landing/`: aset visual.
- `lib/`: utilitas, autentikasi, dan database.
- `crypto/`: komponen dan dokumentasi kriptografi.
- `security/`: dokumentasi keamanan.
- `tests/`: pengujian.

## Cara Menjalankan
1. Jalankan `npm install`.
2. Siapkan `.env.local` dengan `JWT_SECRET` dan `ENCRYPTION_SECRET` yang masing-masing minimal 32 karakter.
3. Jalankan `npm run dev`.
4. Buka `http://localhost:3000`.

## Pengujian
Jalankan `npm run lint` dan `npm run build`. Uji tampilan pada lebar 390 px, 768 px, dan 1280 px. Dokumentasikan skor Lighthouse Accessibility, kondisi pengujian, serta bukti validasi form.

## Catatan
Repository ini digunakan untuk mata kuliah Pemrograman Web, Kriptografi, dan Keamanan Komputasi dan Siber. Branch untuk tugas Pemrograman Web ini adalah `pemrograman-web`.