# Security Controls Plan - Riggisa Parfume Secrète (my project)

> **Marker Tugas 2:** `sec-0.2` — dokumentasi kontrol dan demonstrasi keamanan.

## 1. Tujuan

Dokumen ini menjelaskan spesifikasi, perencanaan, implementasi, dan batas perlindungan kontrol keamanan untuk memitigasi lima risiko prioritas (**R01–R05**) pada aplikasi lelang parfum *sealed bid* **Riggisa Parfume Secrète**. Dokumen ini disusun berdasarkan **hasil pemeriksaan kode statis aktual** (*actual static code review*) serta ruang lingkup **Tugas 2 Keamanan Komputasi dan Siber**, yang mencakup kontrol akses berbasis peran (RBAC), pengujian keamanan password, perlindungan data, rencana hardening sistem/VM dan container, isolasi jaringan database PostgreSQL, serta perencanaan pemindaian kerentanan image dan *Software Bill of Materials* (SBOM).

Setiap kontrol keamanan memuat identifikasi ancaman, temuan implementasi kode aktual, langkah mitigasi yang direncanakan, batas perlindungan sistem, tujuan kontrol, metode pengujian, serta kriteria keberhasilan.

> [!IMPORTANT]
> **Prinsip Integritas Dokumentasi Keamanan:**
> Dokumen ini secara tegas membedakan status teknis:
> 1. **Hasil Pemeriksaan Kode Statis:** Logika program dan konfigurasi yang telah diverifikasi keberadaannya dalam repositori dan lulus uji statis dicatat sebagai **`PASS (Statis)`**.
> 2. **Rencana Kontrol & Hardening Infrastruktur:** Prosedur konfigurasi lingkungan (SSH hardening, container least privilege, isolasi port PostgreSQL, image vulnerability scan, dan SBOM) yang dirancang untuk pengamanan sistem. **Tidak diklaim berhasil tanpa adanya bukti pengujian atau artefak verifikasi yang terkonfirmasi.**
> 3. **Pengujian Runtime:** Seluruh pengujian interaksi HTTP runtime (38 skenario RBAC pada `security/access-tests.md`) tetap dipertahankan berstatus **`NOT TESTED`** sampai pengujian aktual dijalankan dan responnya dicatat secara empiris.

---

## 2. Rencana dan Spesifikasi Kontrol Keamanan Berdasarkan Kode Aktual (R01–R05)

### R01_Secret Kriptografi Bocor atau Dikelola Tidak Aman

**Ancaman:** Kunci rahasia kriptografi (`JWT_SECRET`, `ENCRYPTION_SECRET`) dan kredensial basis data (`DATABASE_URL`) dapat terekspos akibat pengelolaan konfigurasi yang tidak aman, hardcoded secret pada repositori, atau lemahnya hashing kredensial pengguna di database.

**Hasil Pemeriksaan Kode Aktual:**
- **Validasi Startup Keras (*Fail-Closed*):**
  - Pada `lib/auth.ts`, variabel `process.env.JWT_SECRET` diperiksa saat modul dimuat. Jika tidak terdefinisi atau panjangnya kurang dari 32 karakter, startup aplikasi langsung dihentikan: `throw new Error("JWT_SECRET wajib diatur dan minimal 32 karakter.")`.
  - Pada `lib/crypto.ts`, variabel `process.env.ENCRYPTION_SECRET` diperiksa dengan aturan serupa (minimal 32 karakter) dan diturunkan menjadi kunci 256-bit menggunakan SHA-256 (`crypto.createHash("sha256")`).
- **Autentikasi dan Token Sesi:**
  - `lib/auth.ts` menggunakan pustaka `jose` (`SignJWT` dan `jwtVerify`) dengan algoritma HS256 untuk menerbitkan dan memverifikasi token sesi.
  - Token sesi **bukan merupakan token terenkripsi**, melainkan **JWT yang ditandatangani secara kriptografis (*signed JWT*) dan disimpan dalam cookie yang dilindungi**.
  - Tanda tangan kriptografis menjamin integritas dan keaslian token (mendeteksi perubahan isi), bukan menyembunyikan payload. Perlindungan kerahasiaan sesi dari pembacaan skrip sisi klien mengandalkan konfigurasi cookie: `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, serta flag `secure: true` saat `NODE_ENV === "production"`.
- **Keamanan Penyimpanan Password:**
  - Fungsi `hashPassword()` pada `lib/auth.ts` menggunakan slow hashing `bcryptjs` dengan *salt cost factor* 10 (`bcrypt.hash(password, 10)`), dan diverifikasi melalui `bcrypt.compare()`.
  - Skema database pada `prisma/schema.prisma` memetakan properti `passwordHash` ke kolom `password_hash` (`VarChar(255)`). Tidak ditemukan kolom plaintext password pada model `User`.
- **Enkripsi Data Pribadi Sensitif (PII):**
  - Data sensitif pengguna pada tabel `users` (`fullNameEncrypted`, `phoneEncrypted`, `addressEncrypted`) dienkripsi menggunakan AES-256-GCM (`lib/crypto.ts`) dengan format `iv:authTag:ciphertext`.

**Rencana Kontrol & Mitigasi:**
1. Pertahankan isolasi secret pada file environment lokal (`.env.local`) yang tercantum dalam `.gitignore`.
2. Pastikan file rahasia tidak pernah disalin ke dalam container image saat proses build Docker.
3. Rencanakan pemindaian kerentanan image (*image vulnerability scanning*) dan analisis SBOM guna mendeteksi potensi secret yang tertinggal pada layer image atau dependensi yang rentan.

**Tujuan Kontrol:** Mencegah kebocoran secret, memitigasi pemalsuan token sesi, dan melindungi password serta data sensitif pengguna dari keterpaparan langsung jika basis data bocor.

**Metode Pengujian:**
- Pemeriksaan kode statis terhadap validasi panjang secret pada `lib/auth.ts` dan `lib/crypto.ts` (Status: **PASS (Statis)**).
- Pemeriksaan kode statis implementasi slow hashing `bcryptjs` dan skema database (Status: **PASS (Statis)**).
- Pengujian runtime registrasi dan login (`AT-PW04`): **NOT TESTED**.
- Simulasi penghentian aplikasi tanpa secret: **Rencana Pengujian**.

**Kriteria Keberhasilan:** Aplikasi berhenti beroperasi (*fail-closed*) jika secret wajib tidak valid; password tersimpan sebagai hash bcrypt; token sesi ditandatangani dengan aman dalam cookie ber-flag protektif.

---

### R02_Nonce Menggunakan `Math.random()`

**Ancaman:** Pembuatan nonce menggunakan generator acak pseudo-random nonkriptografis (`Math.random()`) memungkinkan pihak lain memprediksi nilai acak dan membuka komitmen lelang tertutup sebelum waktu pembukaan.

**Hasil Pemeriksaan Kode Aktual:**
- **Pembuatan Nonce Berstandar Web Crypto API:**
  - Pada `lib/client-crypto.ts`, fungsi `generateClientNonce()` menghasilkan nonce berukuran 32 byte (256-bit acak) menggunakan `window.crypto.getRandomValues(new Uint8Array(32))`, menghasilkan representasi heksadesimal 64 karakter.
- **Ketiadaan Fallback Nonkriptografis (*No Fallback*):**
  - Kode secara eksplisit memeriksa ketersediaan `window.crypto.getRandomValues`. Jika tidak tersedia, eksekusi dihentikan dengan error: `throw new Error("Web Crypto tidak tersedia. Nonce aman tidak dapat dibuat.")`.
  - Tidak ditemukan instruksi `Math.random()` pada alur pembuatan nonce maupun komitmen.
- **Hashing Sisi Klien:**
  - Fungsi `computeClientSHA256()` menggunakan standar W3C `window.crypto.subtle.digest("SHA-256", data)`.

**Rencana Kontrol & Mitigasi:**
1. Pertahankan generator acak kriptografis 256-bit di sisi klien peramban.
2. Validasi format heksadesimal 64 karakter dari nonce di server saat proses reveal.

**Tujuan Kontrol:** Menjamin bahwa nilai nonce tidak dapat ditebak (*unpredictable*), menjaga sifat kerahasiaan (*hiding property*) komitmen penawaran lelang.

**Metode Pengujian:**
- Pemeriksaan kode statis pada `lib/client-crypto.ts` untuk memastikan ketiadaan `Math.random()` (Status: **PASS (Statis)**).
- Pengujian otomatis komponen kriptografi (`npm run test:crypto`) untuk memverifikasi entropi dan format nonce (Status: **PASS (Unit Test)**).
- Simulasi runtime lingkungan tanpa Web Crypto: **Rencana Pengujian**.

**Kriteria Keberhasilan:** Komitmen penawaran dibuat menggunakan nonce 32 byte acak dari Web Crypto API; sistem menolak membuat nonce jika Web Crypto tidak tersedia.

---

### R03_Kebocoran Bukti Penawaran

**Ancaman:** Nilai penawaran asli (*bid amount*) dan nonce rahasia dapat bocor melalui antarmuka, respons API, atau perangkat bersama sebelum waktu lelang selesai.

**Hasil Pemeriksaan Kode Aktual:**
- **Fase Commit (`app/api/bids/commit/route.ts`):**
  - Endpoint hanya menerima `auctionId` dan `commitmentHash` (SHA-256 64 karakter).
  - Nominal penawaran dan nonce **tidak dikirim ke server** pada fase commit.
  - Memerlukan sesi pengguna aktif (`getCurrentUser()`) dan menolak akun yang ditandai (`currentUser.isFlagged === true`) dengan kode HTTP 403.
  - Menerapkan pembatasan laju (*rate limiting*) berbasis IP (maksimal 10 submisi commit per menit).
- **Fase Reveal (`app/api/bids/reveal/route.ts`):**
  - Menerima `auctionId`, `bidAmount`, dan `nonce`.
  - Memvalidasi kecocokan data penawaran terhadap commitment hash yang tersimpan di basis data melalui `verifyCommitmentHash()`.
  - Akun `isFlagged` ditolak dengan HTTP 403.
  - Jika rekonsiliasi hash gagal, server menandai status penawaran sebagai **`TAMPERED_REJECTED`** dan mencatat audit log tingkat `CRITICAL`.
- **Pembatasan Kepemilikan Data (`app/api/bids/my-bids/route.ts`):**
  - Memerlukan pengguna yang telah login (HTTP 401 jika tanpa sesi).
  - Kueri riwayat penawaran dibatasi secara ketat berdasarkan ID sesi aktif: `where: { userId: currentUser.id }`.
  - Pembatasan kepemilikan data ini terbukti ada dalam kode sumber handler; namun status pengujian seluruh endpoint aplikasi secara menyeluruh pada lingkungan runtime tetap dicatat sebagai rencana pengujian.
- **Penyembunyian Data pada Detail Lelang:**
  - Route `GET /api/auctions/:id` menyembunyikan properti `revealedNonce` publik selama lelang belum `COMPLETED`. Untuk pengunjung tanpa sesi, properti `myBid` bernilai `null`.

**Analisis Risiko Penyimpanan Lokal (*Client-Side Storage Risk*) & Batas Perlindungan:**
- **Fakta Implementasi yang Ditemukan:**
  - Pada `lib/client-crypto.ts`, objek bukti penawaran (`BidProof` yang memuat `auctionId`, `auctionTitle`, `bidAmount`, `nonce`, `commitmentHash`, dan `timestamp`) disimpan dalam penyimpanan lokal peramban (`localStorage`) menggunakan JSON.
  - `components/CommitBidModal.tsx` menyediakan fitur unduh resi bukti penawaran dalam format berkas JSON melalui `downloadBidProof()`.
  - `components/RevealBidModal.tsx` menyediakan fitur pemilihan dan upload file JSON untuk proses reveal. Bukti tersebut memuat informasi yang diperlukan untuk reveal, termasuk nonce.
  - Belum ditemukan peringatan khusus pada UI tentang penggunaan perangkat bersama atau larangan membagikan file bukti. Peringatan tersebut tidak boleh dinyatakan sudah diterapkan.
- **Risiko dan Batas Perlindungan:**
  - **Sistem tidak dapat mengklaim bukti penawaran sepenuhnya terlindungi dari akses pengguna lain pada perangkat atau browser yang sama.** Pengguna lain yang memakai profil browser yang sama berpotensi mengakses data `localStorage` atau file JSON bukti yang telah diunduh di disk lokal, sehingga nominal tawaran dan nonce dapat terbaca sebelum fase reveal.
  - Risiko XSS relevan karena JavaScript yang berjalan pada origin aplikasi dapat mengakses `localStorage`. Ini adalah risiko berdasarkan karakteristik penyimpanan, bukan bukti bahwa eksploitasi XSS telah terjadi.
  - Validasi integritas server tidak mencegah pembacaan data lokal oleh pihak yang memperoleh akses ke profil browser atau file bukti.
- **Rekomendasi Kontrol:**
  - Simpan file bukti JSON pada lokasi yang aman dengan akses terbatas dan hapus salinan yang tidak lagi diperlukan setelah reveal.
  - Jangan membagikan file bukti, nonce, atau isi resi kepada pihak lain dan jangan mengunggahnya ke layanan publik.
  - Hindari profil browser atau perangkat bersama; gunakan profil terkunci dan logout setelah selesai.
  - Terapkan perlindungan terhadap XSS, termasuk escaping/output encoding, validasi input, Content Security Policy bila kompatibel, serta peninjauan dependensi dan kode pemroses data klien.
  - Rencanakan peringatan UI tentang perangkat bersama dan larangan membagikan file bukti. Rekomendasi ini belum dianggap diterapkan sebelum perubahan UI dibuat dan diverifikasi.
- **Mitigasi yang Diterapkan & Direncanakan:**
  - Validasi integritas di sisi server menjamin penawaran tidak dapat diubah oleh pihak ketiga tanpa menggugurkan komitmen (`TAMPERED_REJECTED`), meskipun kerahasiaan fisik di perangkat klien tetap memerlukan pengamanan oleh pengguna.

**Tujuan Kontrol:** Menjaga agar nominal penawaran tidak diketahui publik atau peserta lelang lain sebelum tahap reveal, membatasi akses data penawaran hanya pada pemiliknya, dan mendeteksi usaha manipulasi komitmen.

**Metode Pengujian:**
- Pemeriksaan kode statis alur commit, reveal, dan `my-bids` (Status: **PASS (Statis)**).
- Pengujian unit manipulasi commitment hash pada suite kriptografi (Status: **PASS (Unit Test)**).
- Skenario pengujian RBAC runtime pada `security/access-tests.md` (`AT-P07`–`AT-P09`, `AT-N13`–`AT-N18`): **NOT TESTED**.

**Kriteria Keberhasilan:** Server menolak komitmen yang dimanipulasi dengan status `TAMPERED_REJECTED`; kueri `my-bids` hanya menampilkan penawaran milik pengguna sesi; edukasi perlindungan berkas bukti tersaji di antarmuka setelah kontrol tersebut benar-benar diterapkan dan diverifikasi.

---

### R04_Akses Database dan Cadangan Tanpa Izin

**Ancaman:** Basis data utama PostgreSQL atau berkas cadangannya diakses atau dimodifikasi oleh pihak luar akibat eksposur port publik, kelemahan izin container, atau longgarnya akses host/VM.

**Hasil Pemeriksaan Kode Aktual:**
- **Arsitektur Database PostgreSQL & Prisma:**
  - Proyek menggunakan datasource PostgreSQL pada `prisma/schema.prisma` (`provider = "postgresql"`).
  - Seluruh operasi data aplikasi pada route handler App Router dijalankan melalui Prisma Client (`@/lib/prisma`).
  - Pencatatan aktivitas keamanan dicatat terstruktur pada tabel `audit_logs` di PostgreSQL.
- **Catatan Kode SQLite Legacy (`lib/db.ts`):**
  - Berdasarkan pemeriksaan pencarian referensi statis di seluruh repositori, deklarasi fungsi `getDb()` hanya ditemukan di dalam file `lib/db.ts` (menggunakan `DatabaseSync` dari `node:sqlite`), tanpa ditemukan adanya pemanggilan fungsi tersebut dari file atau route handler lain.
  - Temuan ini dicatat sebagai **indikasi kode SQLite legacy yang belum digunakan berdasarkan pencarian statis, bukan sebagai kepastian bahwa file aman untuk dihapus**.
  - File `lib/db.ts` tetap dipertahankan pada repositori dan tidak dihapus atau diubah guna menjaga stabilitas kode.

**Rencana Kontrol Hardening & Infrastruktur (Tugas 2):**
1. **Pembatasan Port dan Jaringan PostgreSQL (Point 4):**
   - Port default PostgreSQL `5432` tidak dipublikasikan ke antarmuka publik (`0.0.0.0`), melainkan diisolasi secara privat menggunakan `expose: "5432"` di dalam jaringan virtual internal Docker (`app_internal` dengan `internal: true`).
2. **Prinsip Least Privilege Akun Database:**
   - Direncanakan agar koneksi operasional Prisma menggunakan akun PostgreSQL dengan hak terbatas pada skema data aplikasi (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), bukan superuser `postgres`.
3. **Hardening Container (Telah Diimplementasikan & Teruji - Point 4):**
   - Container aplikasi berjalan menggunakan pengguna non-root (`USER nextjs` UID 1001, `user: "1001:1001"`), root filesystem bersifat `read_only: true` dengan ephemeral `tmpfs /tmp`, serta membatasi Linux kernel capabilities (`cap_drop: - ALL`) dan `security_opt: - no-new-privileges:true`.
   - Dokumentasi lengkap tersimpan pada `security/container-audit.md` dan terverifikasi via `npm run test:container`.
4. **Hardening Host / Virtual Machine & Akses SSH (Telah Diimplementasikan & Teruji - Point 3):**
   - Prosedur hardening server VM telah diuji dan diverifikasi secara langsung pada lingkungan Ubuntu VM (Iximiuz Labs) mencakup penonaktifan login root SSH (`PermitRootLogin no`), penonaktifan otentikasi password SSH (`PasswordAuthentication no`, `KbdInteractiveAuthentication no`), kewajiban pasangan kunci publik SSH (`PubkeyAuthentication yes`), aktivasi Fail2ban, serta audit komparatif Lynis yang berhasil menaikkan skor dari 61 menjadi 70.
   - Dokumentasi lengkap dan artefak bukti empiris tersimpan pada `security/system-hardening.md` serta `security/bukti_tugas2/`.
5. **Image Vulnerability Scanning & SBOM:**
   - Terintegrasi otomatis pada workflow GitHub Actions `.github/workflows/container-security.yml` menggunakan Trivy (pemindai CVE image) dan Syft (generator CycloneDX SBOM).
6. **Perlindungan Berkas Cadangan (*Backup Hardening*):**
   - File dump basis data (`pg_dump`) direncanakan untuk disimpan di luar direktori web dengan izin berkas ketat (`chmod 600`), dienkripsi *at rest*, dan diuji pemulihannya secara berkala.

> [!NOTE]
> **Status Verifikasi Hardening Infrastruktur:**
> - **Hardening VM & SSH (Point 3):** **`PASS`** (Telah dibuktikan secara empiris dengan Lynis index 70, `sshd -T`, uji `SSH_KEY_AUTH_OK`, dan bukti rekaman terminal pada `security/system-hardening.md`).
> - **Hardening Container & Isolasi Port DB/App (Point 4):** **`PASS`** (Telah diimplementasikan pada `Dockerfile`, `compose.yaml`, `.dockerignore`, dan lulus verifikasi `npm run test:container` 4/4 passed).

**Tujuan Kontrol:** Mencegah akses langsung ke basis data PostgreSQL melalui internet, meminimalkan dampak kompromi container, dan mengamankan berkas cadangan data lelang.

**Metode Pengujian:**
- Pemeriksaan kode statis arsitektur Prisma dan isolasi kueri database (Status: **PASS (Statis)**).
- Pengujian port scanning (misalnya Nmap) terhadap port 5432 pada host: **Rencana Pengujian**.
- Verifikasi konfigurasi SSH, izin file backup, dan audit Lynis: **Rencana Verifikasi Hardening**.

**Kriteria Keberhasilan:** Port PostgreSQL tidak terbuka ke internet publik; Prisma beroperasi dengan akun least privilege; berkas cadangan tidak dapat diakses pihak tanpa izin; konfigurasi server diverifikasi memenuhi standar hardening dasar.

---

### R05_Kredensial Akun Demo pada Produksi

**Ancaman:** Kredensial akun demo atau akun default pengujian digunakan oleh pihak tidak berwenang untuk mengakses sistem atau mengeksekusi operasi administrasi pada lingkungan produksi.

**Hasil Pemeriksaan Kode Aktual:**
- **Konfigurasi dan Perilaku Seed:**
  - `package.json` menjalankan seed melalui script `node --env-file=.env --experimental-strip-types prisma/seed.ts`.
  - Karena script tersebut tersedia sebagai `npm run seed`, perintah `npm run seed` tidak boleh dijalankan terhadap database utama `riggisa_db`.
  - `prisma/seed.ts` membuat atau menggunakan kembali akun `seed_bidder` dengan email contoh dan password hardcoded yang di-hash menggunakan bcrypt dengan cost 10.
  - Seed juga membuat atau menggunakan kembali data auction dan bid contoh.
  - Koneksi seed menggunakan `PrismaPg` dengan `connectionString` yang diambil dari `process.env.DATABASE_URL`; target database mengikuti nilai `DATABASE_URL` saat script dijalankan.
  - Tidak ditemukan pemeriksaan `NODE_ENV` atau pengaman lain dalam implementasi yang mencegah seed berjalan terhadap database produksi.
  - Dengan demikian, pengamanan seed terhadap database produksi **belum terbukti/belum diterapkan berdasarkan pemeriksaan kode ini**. Tidak dapat dinyatakan bahwa seed otomatis dinonaktifkan pada production.
- **Penegakan Otorisasi Sisi Server (*Server-Side RBAC*):**
  - Seluruh endpoint administratif memeriksa hak akses secara eksplisit: `if (!currentUser || currentUser.role !== "admin") return NextResponse.json({ error: "Akses ditolak." }, { status: 403 })`.
  - Pengecekan ini terpasang pada route:
    - `app/api/admin/users/route.ts` (manajemen pengguna dan flag)
    - `app/api/admin/bids/route.ts` (pemeriksaan dan penghapusan bid pada lelang selesai)
    - `app/api/admin/audit-logs/route.ts` (pemeriksaan audit log)
    - `app/api/admin/upload-image/route.ts` (unggah gambar parfum)
    - `app/api/admin/demo-reset/route.ts` (reset demo data)
    - `app/api/auctions/route.ts` (POST create auction)
    - `app/api/auctions/[id]/route.ts` (PUT update & DELETE auction)
    - `app/api/auctions/[id]/finalize/route.ts` (POST finalisasi lelang)
- **Role Default dan Registrasi Terkunci:**
  - Model `User` pada skema Prisma menetapkan default `role: "bidder"`.
  - Endpoint `POST /api/auth/register` menetapkan `role: "bidder"` secara mutlak tanpa memproses parameter role dari payload input.

**Rencana Kontrol & Mitigasi:**
1. Tambahkan pemeriksaan environment yang eksplisit pada seed, termasuk penolakan eksekusi ketika `NODE_ENV=production`; kontrol ini belum diterapkan berdasarkan pemeriksaan kode saat ini.
2. Larang pelaksanaan seed pada environment production dan dokumentasikan prosedur yang memastikan `npm run seed` tidak pernah dijalankan terhadap `riggisa_db`.
3. Tambahkan pemeriksaan target `DATABASE_URL` agar seed hanya dapat berjalan pada database pengujian yang diizinkan dan database pengujian terisolasi, bukan database utama `riggisa_db`.
4. Buat akun administrator produksi dengan kredensial unik berkekuatan tinggi di luar skrip seed.
5. Batasi pengujian skenario destruktif (AT-P03 finalisasi lelang, AT-P10 hapus bid, AT-P13 demo reset) hanya pada database pengujian terisolasi, bukan database utama `riggisa_db`.

**Tujuan Kontrol:** Mencegah eskalasi hak akses (*elevation of privilege*) dari akun publik atau akun demo ke fungsi administratif.

**Metode Pengujian:**
- Pemeriksaan kode statis terhadap validasi `currentUser.role !== "admin"` pada seluruh route handler admin (Status: **PASS (Statis)**).
- Pemeriksaan kode statis skema Prisma dan handler registrasi untuk role `bidder` (Status: **PASS (Statis)**).
- Pemeriksaan kode statis guard `NODE_ENV` dan pembatasan target `DATABASE_URL` pada seed: **BELUM TERBUKTI/BELUM DITERAPKAN**.
- Pengujian interaksi HTTP runtime RBAC (19 positive tests dan 19 negative tests pada `security/access-tests.md`): **NOT TESTED**.

**Kriteria Keberhasilan:** Pengguna ber-role `bidder` atau tanpa sesi ditolak dengan HTTP 403/401 pada seluruh rute admin; guard seed menolak eksekusi pada production; `npm run seed` tidak dijalankan terhadap `riggisa_db`; target `DATABASE_URL` diverifikasi sebagai database pengujian yang terisolasi dan diizinkan; akun demo default tidak aktif di lingkungan produksi.

---

## 3. Integrasi Kontrol Hardening dan Lingkungan (Tugas 2)

Kontrol keamanan aplikasi Riggisa Parfume Secrète dihubungkan dengan infrastruktur dan ruang lingkup Tugas 2:

```
[ Host Server / VM ] --------------------------------------------------------
  │  • Rencana SSH Hardening (Kunci publik, no root login, no password) --> [R01, R04]
  │  • Rencana Audit Kepatuhan Keamanan (Lynis Audit)                    --> [R04]
  │
  ├── [ Docker / Container Runtime ] ---------------------------------------
  │     • Rencana Least Privilege Container (Non-root user)             --> [R04]
  │     • Rencana Image Vulnerability Scanning & SBOM Tracking          --> [R01, R04]
  │     • Rencana Isolasi Jaringan Internal (Private Bridge Network)     --> [R04]
  │
  ├── [ PostgreSQL Database (Port 5432) ] ----------------------------------
  │     • Rencana Port Binding Tertutup (Localhost / internal binding)  --> [R04]
  │     • Rencana Least Privilege DB User via Prisma ORM                --> [R04]
  │     • Rencana Proteksi & Enkripsi Berkas Cadangan (Backup Dump)     --> [R04]
  │     • Implementasi Tabel Audit Log Terstruktur                      --> [R04]
  │
  └── [ Next.js Application Layer (App Router) ] ---------------------------
        • Implementasi Fail-Closed Secret Validation (lib/auth, lib/crypto)--> [R01]
        • Implementasi Slow Hashing Password (bcryptjs cost 10)           --> [R01]
        • Implementasi Enkripsi PII Pengguna (AES-256-GCM)                --> [R01]
        • Implementasi JWT Ditandatangani dalam Cookie Berpelindung      --> [R01]
        • Implementasi Server-Side RBAC pada Route Handler               --> [R03, R04, R05]
        • Implementasi Deteksi Manipulasi Komitmen (TAMPERED_REJECTED)    --> [R02, R03]
        • Identifikasi Batas Keamanan Penyimpanan Klien (localStorage)    --> [R03]
        • Indikasi Statis Kode SQLite Legacy Tak Digunakan (lib/db.ts)    --> [R04]
----------------------------------------------------------------------------
```

### Keterkaitan Teknis Kontrol Tugas 2 dengan Risiko Tugas 1:

1. **SSH Hardening dan Pengamanan Server VM (Relevan dengan R01 dan R04):**
   - Menghapus otentikasi kata sandi dan login root pada SSH host mencegah penyerang memperoleh shell interaktif pada server yang menyimpan variabel lingkungan rahasia (`.env.local`) dan berkas volume basis data.
2. **Least Privilege pada Container (Relevan dengan R04):**
   - Menjalankan container dengan akun non-root meminimalkan potensi eskalasi hak akses (*container escape*) ke sistem operasi host jika terjadi celah keamanan pada aplikasi.
3. **Pembatasan Port Database PostgreSQL (Relevan dengan R04):**
   - Mengunci port `5432` agar tidak dapat diakses dari internet memastikan jalur komunikasi basis data hanya terbuka untuk backend internal Prisma, memitigasi serangan probing atau brute-force langsung.
4. **Image Vulnerability Scanning dan SBOM (Relevan dengan R01 dan R04):**
   - Mengidentifikasi kerentanan (CVE) pada pustaka aplikasi dan base image Docker sebelum deployment guna mencegah eksploitasi yang dapat membocorkan kredensial atau merusak integritas basis data.
5. **Pengujian Kontrol Akses Berbasis Peran (RBAC) Admin dan Bidder (Relevan dengan R03, R04, dan R05):**
   - Otorisasi server-side memastikan data penawaran lelang terlindungi dari akses ilegal bidder lain (R03), endpoint database terproteksi dari modifikasi tanpa hak (R04), dan akun non-admin ditolak dari panel administrasi (R05).
6. **Pengujian Keamanan Password (Relevan dengan R01):**
   - Slow hashing `bcryptjs` (salt cost 10) tanpa kolom plaintext pada skema database melindungi password pengguna dari serangan brute force offline jika terjadi kebocoran basis data.

---

## 4. Pemetaan Kontrol Keamanan ke Tugas 2 dan Matriks Pengujian

Tabel berikut memetakan rencana kontrol keamanan terhadap lingkup Tugas 2, relevansi risiko R01–R05, mekanisme kontrol, bukti pendukung, dan status pengujian saat ini:

| ID Risiko | Lingkup Tugas 2 | Mekanisme Kontrol Berdasarkan Kode Aktual | Keterkaitan Bukti Pengujian | Status Bukti Saat Ini |
|---|---|---|---|---|
| **R01** | Pengelolaan Secret & Password Hashing | • Validasi fail-closed secret min. 32 karakter pada `lib/auth.ts` & `lib/crypto.ts`.<br>• Slow hashing `bcryptjs` (cost 10) saat registrasi & verifikasi login.<br>• Model Prisma `users` hanya memiliki kolom `password_hash`.<br>• Enkripsi PII dengan AES-256-GCM.<br>• JWT ditandatangani (HS256) & disimpan dalam cookie `httpOnly`, `sameSite: "lax"`, `secure`. | • Verifikasi kode statis `AT-PW01`–`AT-PW03` pada `security/access-tests.md`.<br>• Uji coba startup fail-closed tanpa secret.<br>• Skenario runtime registrasi/login `AT-PW04`. | **PASS (Statis)** untuk kode password; Pengujian runtime registrasi/login berstatus **NOT TESTED**; Uji startup fail-closed berstatus **Rencana Pengujian**. |
| **R02** | Keamanan Sumber Acak Kriptografis | • Pustaka Web Crypto (`crypto.getRandomValues()`) 32 byte pada `lib/client-crypto.ts`.<br>• Ketiadaan fallback `Math.random()`.<br>• Pengecekan regex heksadesimal 64 karakter pada server. | • Pengujian otomatis komponen kriptografi (`npm run test:crypto`).<br>• Pemeriksaan kode statis fungsi pembuatan nonce. | **PASS (Statis)** pada kode nonce; **PASS (Unit Test)** pada test runner komponen kriptografi; Uji ketiadaan Web Crypto berstatus **Rencana Pengujian**. |
| **R03** | Perlindungan Bukti Penawaran & Verifikasi Komitmen | • Endpoint commit hanya menerima `auctionId` & `commitmentHash` (tanpa nominal/nonce).<br>• Validasi hash komitmen di server saat reveal; rekonsiliasi gagal menandai bid sebagai `TAMPERED_REJECTED`.<br>• Kueri riwayat bid difilter berdasarkan `userId: currentUser.id` (`GET /api/bids/my-bids`).<br>• Penolakan akun `isFlagged`.<br>• Identifikasi dan dokumentasi risiko penyimpanan lokal (`localStorage` dan file JSON unduhan). | • Rencana positive test `AT-P07`–`AT-P09`.<br>• Rencana negative test `AT-N13`, `AT-N14`, `AT-N16`–`AT-N18` pada `security/access-tests.md`.<br>• Pengujian manipulasi komitmen pada unit test kriptografi. | **PASS (Statis)** untuk pemisahan parameter commit/reveal & penolakan flagged; Pengujian runtime RBAC berstatus **NOT TESTED**; Batas keamanan `localStorage` tercatat sebagai **Risiko Klien Teridentifikasi**. |
| **R04** | Hardening Database PostgreSQL, Container, & Host | • Port PostgreSQL 5432 direncanakan tertutup dari publik.<br>• Rencana Prisma least privilege user.<br>• Rencana container non-root.<br>• Rencana SSH hardening host VM.<br>• Rencana image scanning & SBOM.<br>• Rencana proteksi berkas backup `chmod 600`.<br>• Identifikasi kode SQLite legacy `lib/db.ts` tanpa pemanggilan aktif. | • Log scan port (Nmap) port 5432.<br>• File konfigurasi container Docker.<br>• Konfigurasi SSH `/etc/ssh/sshd_config` dan hasil audit Lynis.<br>• Dokumen laporan SBOM & pemindaian image.<br>• Verifikasi izin berkas backup. | **Rencana Hardening & Konfigurasi** (tidak diklaim lulus tanpa bukti empiris); Kode `lib/db.ts` tercatat sebagai **Indikasi Statis Legacy (Tidak Dihapus)**. |
| **R05** | Kontrol Akses RBAC & Akun Demo/Seed | • Validasi server-side `currentUser.role === "admin"` pada seluruh route `/api/admin/*` dan operasi lelang.<br>• Registrasi publik selalu menetapkan role `bidder`.<br>• `prisma/seed.ts` membuat akun demo dan data contoh; pengamanan agar seed tidak berjalan di production belum terbukti/belum diterapkan. | • Rencana positive test admin `AT-P01`–`AT-P06`, `AT-P10`–`AT-P13`.<br>• Rencana negative test penolakan bidder `AT-N01`–`AT-N12` pada `security/access-tests.md`.<br>• Pemeriksaan seed production guard dan target `DATABASE_URL`: belum terbukti/belum diterapkan. | **PASS (Statis)** untuk pemeriksaan RBAC; pengamanan seed terhadap production **belum terbukti/belum diterapkan**; seluruh pengujian runtime akses berstatus **NOT TESTED**. |

---

## 5. Ringkasan Status Kontrol dan Pengujian

| ID Risiko | Area Kontrol Utama | Status Implementasi Kode / Konfigurasi | Status Pengujian & Bukti Aktual |
|---|---|---|---|
| **R01** | Pengelolaan secret fail-closed, password hashing, dan token sesi | Terpasang pada `lib/auth.ts`, `lib/crypto.ts`, dan skema Prisma | • Pemeriksaan kode statis password (`AT-PW01` s.d. `AT-PW03`): **PASS (Statis)**.<br>• Pengujian runtime registrasi/login (`AT-PW04`): **NOT TESTED**.<br>• Pengujian runtime fail-closed: **Rencana Pengujian**. |
| **R02** | Generator nonce kriptografis tanpa `Math.random()` | Terpasang pada `lib/client-crypto.ts` (Web Crypto API 32 byte) | • Pemeriksaan kode statis ketiadaan `Math.random()`: **PASS (Statis)**.<br>• Pengujian unit kriptografi (`npm run test:crypto`): **PASS (Unit Test, 6/6 lulus)**.<br>• Simulasi ketiadaan Web Crypto: **Rencana Pengujian**. |
| **R03** | Kerahasiaan bukti penawaran, commit-reveal, dan pembatasan data `my-bids` | Terpasang pada route `app/api/bids/*` dengan status `TAMPERED_REJECTED`; risiko penyimpanan lokal diidentifikasi dan didokumentasikan | • Pemeriksaan kode statis commit, reveal, dan kueri kepemilikan data: **PASS (Statis)**.<br>• Pengujian runtime akses RBAC (`AT-P07`–`AT-P09`, `AT-N13`–`AT-N18`): **NOT TESTED**.<br>• Risiko `localStorage` & JSON unduhan: **Terdokumentasi (Risiko Klien)**; bukan klaim bahwa edukasi UI telah diterapkan. |
| **R04** | Pembatasan akses PostgreSQL, hardening container, port, SSH, & kode legacy | PostgreSQL + Prisma aktif; `lib/db.ts` terindikasi kode legacy statis; konfigurasi hardening infrastruktur | • Pemeriksaan arsitektur Prisma & `lib/db.ts`: **PASS (Statis)**.<br>• Bukti SSH hardening & Lynis index 70: **PASS (Terverifikasi di Ubuntu VM, Point 3)** pada `security/system-hardening.md`.<br>• Hardening Container (non-root, cap_drop, isolasi port DB/app, standalone): **PASS (Point 4)** via `npm run test:container` & `security/container-audit.md`.<br>• Scan image & SBOM: Terintegrasi pada GitHub Actions workflow. |
| **R05** | Otorisasi peran (RBAC) dan pengamanan akun demo/seed | RBAC server-side ditemukan pada route `/api/admin/*`; `prisma/seed.ts` membuat akun demo dan data contoh, tetapi guard production dan pembatasan target database belum diterapkan/terbukti | • Pemeriksaan kode statis server-side role check admin: **PASS (Statis)**.<br>• Pengamanan seed production: **BELUM TERBUKTI/BELUM DITERAPKAN**.<br>• Pengujian positif admin (`AT-P01`–`AT-P06`, `AT-P10`–`AT-P13`): **NOT TESTED**.<br>• Pengujian penolakan role bidder (`AT-N01`–`AT-N12`): **NOT TESTED**. |

---

## 6. Hubungan dengan Kategori STRIDE

| Kategori STRIDE | Definisi Ancaman | Kontrol yang Relevan | ID Risiko Terkait |
|---|---|---|---|
| **Spoofing** | Penyamaran identitas pengguna atau sistem | • Otentikasi cookie sesi dengan JWT yang ditandatangani (`HS256`) dan disimpan dalam cookie yang dilindungi (`httpOnly`, `sameSite: "lax"`, `secure`).<br>• Password slow hashing dengan `bcryptjs` (salt cost 10).<br>• Validasi kredensial dan rencana pasangan kunci publik SSH pada akses host. | R01, R05 |
| **Tampering** | Perubahan data atau komitmen tanpa izin | • Rekonsiliasi hash komitmen di server saat reveal; manipulasi ditandai dengan status `TAMPERED_REJECTED`.<br>• Akses database terkontrol melalui Prisma ORM.<br>• Validasi skema input numerik dan heksadesimal 64 karakter. | R03, R04 |
| **Repudiation** | Penyangkalan aktivitas penting pengguna atau admin | • Tabel `audit_logs` pada PostgreSQL mencatat aktivitas penting, IP address, severity, dan timestamp.<br>• Pencatatan transaksi penawaran dengan timestamp (`committed_at`, `revealed_at`). | R04, R05 |
| **Information Disclosure** | Pengungkapan data rahasia kepada pihak yang tidak berwenang | • Penyimpanan secret pada environment variable terisolasi.<br>• Rencana penutupan port PostgreSQL 5432 dari jaringan publik.<br>• Enkripsi data sensitif pengguna (PII) dengan AES-256-GCM.<br>• Kueri riwayat penawaran dibatasi berdasarkan ID pengguna sesi aktif.<br>• Identifikasi dan dokumentasi risiko penyimpanan lokal (`localStorage` dan file JSON unduhan).<br>• Rencana perlindungan berkas cadangan database (`chmod 600`). | R01, R03, R04 |
| **Denial of Service** | Gangguan ketersediaan layanan atau basis data | • Rate limiter berbasis memori per IP pada endpoint login, registrasi, commit (10/menit), dan reveal (10/menit).<br>• Pembatasan ukuran unggahan berkas gambar (maksimal 5 MB).<br>• Rencana isolasi sumber daya container. | R04 |
| **Elevation of Privilege** | Peningkatan hak akses tanpa otorisasi yang sah | • Pemeriksaan eksplisit `currentUser.role === "admin"` di sisi server pada seluruh route administratif.<br>• Penolakan aksi lelang untuk akun yang ditandai (`isFlagged`).<br>• Rencana eksekusi container aplikasi dan database menggunakan akun non-root. | R03, R04, R05 |

---

## 7. Kesimpulan

Kontrol keamanan aplikasi **Riggisa Parfume Secrète** difokuskan pada pengamanan berlapis (*defense-in-depth*) dengan memperhatikan secara objektif batasan teknis yang ditemukan dalam pemeriksaan kode aktual:

1. **R01:** Pengelolaan secret terisolasi dengan startup *fail-closed*, slow hashing password (`bcryptjs`, cost 10) tanpa field plaintext di skema Prisma, enkripsi PII via AES-256-GCM, serta token sesi berbasis JWT yang ditandatangani (*signed JWT*) dan disimpan dalam cookie yang dilindungi (`httpOnly`, `sameSite`, `secure`).
2. **R02:** Nonce penawaran 256-bit acak murni dihasilkan oleh Web Crypto API (`window.crypto.getRandomValues`) tanpa fallback `Math.random()`.
3. **R03:** Pemisahan alur commit (hanya menerima hash) dan reveal (memvalidasi nominal dan nonce dengan status `TAMPERED_REJECTED` jika dimanipulasi), penolakan akun `isFlagged`, kueri `my-bids` dibatasi berdasarkan ID pengguna sesi, serta penegasan bahwa bukti penawaran di `localStorage` dan file unduhan JSON memiliki batas perlindungan pada perangkat bersama yang memerlukan edukasi dan pengamanan sisi klien.
4. **R04:** Penggunaan PostgreSQL melalui Prisma ORM dengan pencatatan audit log terstruktur, pengidentifikasian `lib/db.ts` sebagai indikasi statis kode SQLite legacy yang belum digunakan (dipertahankan tanpa dihapus), serta perumusan rencana hardening infrastruktur (isolasi port 5432, least privilege DB, container non-root, SSH hardening, Lynis, dan SBOM) yang secara transparan tidak diklaim berhasil sebelum tersedianya bukti empiris.
5. **R05:** Pemeriksaan kode statis menemukan penegakan kontrol akses berbasis peran (RBAC) di sisi server pada seluruh rute administratif `/api/admin/*` dan penguncian role registrasi ke `bidder`. Namun, `prisma/seed.ts` masih mengikuti `DATABASE_URL` yang aktif, membuat akun demo dan data contoh, serta belum memiliki guard production yang terverifikasi. Perintah `npm run seed` tidak boleh dijalankan terhadap `riggisa_db`.

Seluruh pengujian interaksi runtime HTTP tetap dipertahankan berstatus **`NOT TESTED`** guna menjamin kepatuhan dokumentasi terhadap prinsip verifikasi berbasis bukti nyata.
