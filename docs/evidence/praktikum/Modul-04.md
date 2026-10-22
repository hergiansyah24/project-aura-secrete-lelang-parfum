# Dokumen Teknis Modul 4: Next.js App Router

**Nama/NIM:** Rizqy Hergiansyah / 105224010

**Repositori:** [Riggisa Parfume Secrète — branch `pemrograman-web`](https://github.com/hergiansyah24/project-aura-secrete-lelang-parfum/tree/pemrograman-web)

**Versi Next.js:** 16.4.0

**Cache Components:** Aktif

**Partial Prefetching:** Aktif

## 1. Peta Rute

Aplikasi Riggisa Parfume Secrète menggunakan Next.js App Router. Rute aplikasi ditentukan berdasarkan struktur berkas di dalam folder `app/`. Berdasarkan pemeriksaan proyek, terdapat halaman utama, halaman autentikasi, halaman profil, halaman administrasi, halaman detail lelang dinamis, serta sejumlah endpoint API.

### 1.1 Informasi Proyek

- **Nama aplikasi:** Riggisa Parfume Secrète
- **Versi Next.js:** 16.4.0
- **Cache Components:** Aktif
- **Partial Prefetching:** Aktif

### 1.2 Tabel Peta Rute

| URL | Berkas di `app/` | Jenis Rute | Isi Halaman atau Fungsi |
|---|---|---|---|
| `/` | `app/page.tsx` | Halaman | Halaman utama dan informasi lelang parfum. |
| `/admin` | `app/admin/page.tsx` | Halaman | Halaman administrasi aplikasi. |
| `/login` | `app/login/page.tsx` | Halaman | Halaman masuk pengguna. |
| `/register` | `app/register/page.tsx` | Halaman | Halaman pendaftaran pengguna. |
| `/my-bids` | `app/my-bids/page.tsx` | Halaman | Halaman penawaran milik pengguna. |
| `/profile` | `app/profile/page.tsx` | Halaman | Halaman profil pengguna. |
| `/auctions/[id]` | `app/auctions/[id]/page.tsx` | Halaman dinamis | Menampilkan detail lelang berdasarkan ID. |
| `/api/auctions` | `app/api/auctions/route.ts` | Route Handler | Endpoint data lelang. |
| `/api/auctions/[id]` | `app/api/auctions/[id]/route.ts` | Route Handler dinamis | Endpoint data lelang berdasarkan ID. |
| `/api/auctions/[id]/finalize` | `app/api/auctions/[id]/finalize/route.ts` | Route Handler dinamis | Endpoint finalisasi lelang berdasarkan ID. |
| `/api/auth/login` | `app/api/auth/login/route.ts` | Route Handler | Endpoint autentikasi pengguna. |
| `/api/auth/logout` | `app/api/auth/logout/route.ts` | Route Handler | Endpoint logout pengguna. |
| `/api/auth/me` | `app/api/auth/me/route.ts` | Route Handler | Endpoint informasi pengguna yang sedang login. |
| `/api/auth/register` | `app/api/auth/register/route.ts` | Route Handler | Endpoint pendaftaran pengguna. |
| `/api/bids/commit` | `app/api/bids/commit/route.ts` | Route Handler | Endpoint pengiriman komitmen penawaran. |
| `/api/bids/my-bids` | `app/api/bids/my-bids/route.ts` | Route Handler | Endpoint data penawaran milik pengguna. |
| `/api/bids/reveal` | `app/api/bids/reveal/route.ts` | Route Handler | Endpoint pengungkapan penawaran. |
| `/api/admin/audit-logs` | `app/api/admin/audit-logs/route.ts` | Route Handler | Endpoint catatan audit. |
| `/api/admin/demo-reset` | `app/api/admin/demo-reset/route.ts` | Route Handler | Endpoint reset data demo. |
| `/api/admin/upload-image` | `app/api/admin/upload-image/route.ts` | Route Handler | Endpoint unggah gambar. |
| `/api/admin/users` | `app/api/admin/users/route.ts` | Route Handler | Endpoint pengelolaan data pengguna. |

### 1.3 Ringkasan Keluaran `npm run build`

Keluaran build yang dicantumkan dalam draf awal menunjukkan bahwa Next.js mengenali halaman utama, halaman administrasi, halaman autentikasi, halaman profil, halaman penawaran, rute detail lelang dinamis, serta endpoint API. Pada keluaran tersebut, simbol `○`, `◐`, dan `ƒ` digunakan untuk menunjukkan kategori rute menurut format keluaran build Next.js.

**Catatan verifikasi:** hasil terminal lengkap tidak disertakan dalam teks yang diberikan. Karena itu, status keberhasilan build dan arti setiap simbol pada keluaran proyek perlu dipastikan kembali dengan menjalankan `npm run build` dan memeriksa hasil aktualnya sebelum dokumen dikumpulkan.

### 1.4 Kesimpulan

Peta rute menunjukkan bagaimana aplikasi Riggisa Parfume Secrète menggunakan App Router untuk menangani halaman pengguna dan endpoint API. Rute dinamis `/auctions/[id]` digunakan untuk menampilkan detail lelang berdasarkan parameter ID. Struktur folder dapat dibandingkan dengan keluaran `npm run build` untuk memastikan rute dikenali oleh Next.js.

## 2. Layout, Template, dan Berkas Khusus

### 2.1 Pohon Folder `app/`

Struktur folder `app/` pada aplikasi Riggisa Parfume Secrète menggunakan Next.js App Router. Berkas `page.tsx` digunakan untuk membuat halaman, sedangkan `route.ts` digunakan untuk menangani endpoint API.

```text
app/
├── layout.tsx
├── template.tsx
├── loading.tsx
├── error.tsx
├── not-found.tsx
├── page.tsx
├── admin/
│   └── page.tsx
├── auctions/
│   └── [id]/
│       └── page.tsx
├── login/
│   └── page.tsx
├── my-bids/
│   └── page.tsx
├── profile/
│   └── page.tsx
├── register/
│   └── page.tsx
└── api/
    ├── admin/
    ├── auctions/
    ├── auth/
    └── bids/
```

### 2.2 Perbedaan Layout dan Template

Berkas `layout.tsx` digunakan sebagai kerangka halaman yang dapat digunakan bersama oleh beberapa halaman. Pada aplikasi ini, `app/layout.tsx` berfungsi sebagai root layout dan membungkus konten dengan `AuthProvider`.

Sementara itu, `template.tsx` memiliki perilaku berbeda karena instance komponennya dapat dibuat ulang ketika navigasi yang sesuai terjadi. Hal ini memungkinkan state lokal dan efek pada subtree template diinisialisasi kembali.

**Bukti sebelum navigasi**

![Bukti sebelum navigasi](<bukti sebelum navigasi.png>)

**Bukti setelah navigasi dari beranda ke halaman login, kemudian kembali ke beranda**

![Bukti setelah navigasi](<setelah navigasi ketika di beranda lalu ke halaman login lalu balik lagi ke beranda.png>)

**Catatan pengamatan:** pada screenshot, pesan `Template mounted` muncul pada saat navigasi menuju halaman login dan ketika kembali ke beranda. Pesan tersebut digunakan sebagai bukti bahwa efek pada komponen template berjalan selama pengujian. Jumlah pesan tidak selalu menunjukkan jumlah navigasi secara pasti, terutama dalam lingkungan development.

### 2.3 Hasil Uji Layout dan Template

Pengujian dilakukan melalui browser dengan membuka halaman login, kemudian kembali ke halaman utama Riggisa Parfume Secrète. Developer Tools digunakan untuk mengamati pesan pada Console.

Hasil pengamatan yang didokumentasikan menunjukkan bahwa pesan `Template mounted` muncul ketika navigasi menuju halaman login dan ketika kembali ke halaman utama. Pesan tersebut menunjukkan bahwa efek pada komponen template berjalan selama pengujian.

Dalam lingkungan development, pesan dapat muncul lebih dari satu kali. Oleh karena itu, jumlah pesan tidak langsung dianggap sebagai jumlah navigasi atau pemasangan komponen secara pasti.

### 2.4 Berkas Khusus Next.js

Aplikasi menambahkan tiga berkas khusus, yaitu `loading.tsx`, `error.tsx`, dan `not-found.tsx`.

- `loading.tsx` menyediakan tampilan sementara ketika konten pada segmen rute sedang menunggu.
- `error.tsx` menyediakan tampilan penanganan error dan tombol untuk mencoba merender ulang segmen yang mengalami kesalahan.
- `not-found.tsx` menyediakan tampilan khusus ketika halaman tidak ditemukan.
- `template.tsx` digunakan untuk mengamati perilaku pemasangan ulang komponen saat navigasi yang sesuai.

**Bukti pengujian loading**
![Bukti pengujian loading](<modul 4 bukti pegujian loading.png>)
**Bukti pengujian error**

![Bukti pengujian error](<uji eror.png>)
**Bukti pengujian not-found**

![Bukti pengujian not-found](<pengujian not found.png>)
**Status pengujian:** screenshot yang dicantumkan menjadi bukti visual untuk tampilan loading, error, dan not-found. Bukti tersebut tidak dengan sendirinya membuktikan bahwa semua skenario telah diuji dalam mode produksi. Pengujian produksi perlu dicatat terpisah jika memang dilakukan.

### 2.5 Kesimpulan

Layout dan template memiliki peran berbeda dalam pengelolaan halaman Next.js App Router. Root layout digunakan sebagai kerangka bersama, sedangkan template memungkinkan inisialisasi ulang komponen pada navigasi yang sesuai. Berkas khusus seperti `loading.tsx`, `error.tsx`, dan `not-found.tsx` disiapkan untuk mendukung kondisi loading, kesalahan, dan halaman yang tidak ditemukan.

## 3. Rute Dinamis dan Validasi Parameter

Aplikasi Riggisa Parfume Secrète menggunakan rute dinamis pada `app/auctions/[id]/page.tsx` untuk menampilkan detail lelang berdasarkan ID. Parameter rute diambil menggunakan hook `useParams()` dari `next/navigation`.

Nilai parameter `id` digunakan untuk mengambil data dari endpoint `/api/auctions/${id}`. Ketika data berhasil diterima, aplikasi menampilkan detail parfum, tahapan lelang, informasi penawaran, dan data terkait lainnya. Ketika data lelang tidak tersedia, aplikasi menampilkan pesan “Koleksi Tidak Ditemukan”.

**Status pengujian:** validasi parameter dan kode status HTTP belum dijelaskan dengan hasil pengujian langsung dalam teks yang diberikan. Untuk melengkapi bagian ini, uji ID yang valid, ID yang tidak tersedia, dan format parameter yang tidak sesuai. Catat respons yang benar-benar diterima, termasuk kode status HTTP jika diperiksa.

## 4. Pemisahan Server dan Client Components

Berkas `app/auctions/[id]/page.tsx` menggunakan deklarasi `"use client"` sehingga dikategorikan sebagai Client Component. Komponen ini memerlukan fitur React seperti `useState` dan `useEffect`, serta `useParams()` untuk membaca parameter rute dinamis.

Client Component tersebut bertanggung jawab mengelola tampilan detail lelang, status pemuatan data, dan interaksi pengguna seperti membuka modal commit, reveal, serta verifikasi bukti kriptografis.

Sementara itu, `app/layout.tsx` tidak menggunakan deklarasi `"use client"`, sehingga root layout dapat tetap menjadi Server Component. Root layout mengatur metadata, bahasa dokumen, font, dan struktur HTML utama aplikasi.

Pemisahan ini memungkinkan bagian aplikasi yang memerlukan interaksi browser menggunakan Client Component, sedangkan struktur utama halaman tetap menggunakan Server Component.

## 5. Hasil Pemeriksaan TypeScript dan ESLint

Pemeriksaan TypeScript dilakukan menggunakan perintah `npx tsc --noEmit`. Berdasarkan hasil terminal yang dicatat, perintah selesai tanpa menampilkan pesan error.

Pemeriksaan ESLint dilakukan menggunakan perintah `npm run lint`. Hasil yang dicatat menunjukkan **0 error dan 42 warning**. Warning meliputi variabel atau ikon yang tidak digunakan, penggunaan elemen `<img>`, dependency React Hook, serta penggunaan `window.location.href` untuk navigasi internal.

Dengan demikian, pemeriksaan TypeScript tidak menunjukkan error pada hasil yang diperoleh, sedangkan pemeriksaan ESLint masih menemukan beberapa warning yang perlu dievaluasi. Hasil ini menggambarkan kondisi kode saat pengujian dilakukan.

## 6. Kendala dan Penyelesaian

Selama pengerjaan Modul 4, terdapat beberapa kendala yang ditemukan.

1. **Pengujian halaman loading**
   Tampilan loading tidak selalu muncul ketika halaman dibuka karena proses pemuatan dapat berlangsung dengan cepat. Untuk mendokumentasikannya, dibuat halaman pengujian dengan jeda waktu selama 5 detik agar tampilan `loading.tsx` dapat terlihat dan diambil screenshot-nya.

2. **Pengujian halaman error**
   Saat membuka URL `/error`, halaman yang muncul adalah halaman 404 karena `app/error.tsx` bukan halaman yang dapat diakses langsung melalui URL tersebut. Penyelesaiannya adalah memahami fungsi `error.tsx` sebagai Error Boundary dan menggunakan halaman pengujian khusus untuk memicu error.

3. **Dokumentasi hasil pengujian**
   Bukti pengujian disimpan dalam bentuk screenshot pada folder `docs/evidence/praktikum/` agar dapat dicantumkan dalam dokumentasi Modul 4.

## 7. Catatan Pemanfaatan AI

Dalam pengerjaan Modul 4, AI digunakan sebagai alat bantu untuk memahami konsep Next.js App Router, menyusun kode pengujian, serta menganalisis kendala yang ditemukan.

- **Alat:** ChatGPT.
- **Perintah yang digunakan:** `npm run dev` untuk menjalankan aplikasi dalam mode development.
- **Bagian yang dibantu:** pemahaman fungsi `loading.tsx`, `error.tsx`, dan `not-found.tsx`; pembuatan halaman pengujian loading dan pemicu error; serta penyusunan dokumentasi.
- **Cara verifikasi:** memeriksa kode melalui VS Code, membuka halaman pengujian melalui browser, mengamati tampilan loading dan error, serta memeriksa log terminal untuk mengetahui respons rute yang diakses.

AI digunakan sebagai pendamping pengerjaan. Kode dan hasil pengujian tetap diperiksa secara langsung oleh mahasiswa melalui VS Code, browser, dan terminal.