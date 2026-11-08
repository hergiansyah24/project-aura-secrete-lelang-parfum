# Laporan Audit Kesiapan & Rekomendasi Container Hardening

**Proyek:** Riggisa Parfume Secrète (`lelang-parfume`)  
**Mata Kuliah:** Keamanan Komputasi dan Siber (Tugas 2)  
**Tujuan Dokumen:** Dokumentasi audit statis kesiapan kontainerisasi dan panduan hardening container berbasis least privilege  
**Tanggal Audit:** 7 November 2026  

---

## 1. Versi Node.js, Next.js, Prisma, dan Package Manager

Berdasarkan pemeriksaan langsung pada berkas `package.json` dan `package-lock.json`:

| Komponen | Versi di `package.json` | Versi Terkunci di `package-lock.json` | Analisis Kebutuhan Kontainerisasi |
|---|---|---|---|
| **Next.js** | `^16.4.3` | **`16.4.3`** | Menggunakan Next.js App Router, Turbopack (`@tailwindcss/turbopack`), dan React `19.3.0`. |
| **Prisma (CLI)** | `^7.10.1` (*devDependencies*) | **`7.10.1`** | Prisma versi 7, membutuhkan eksekusi `npx prisma generate` saat fase build. |
| **Prisma Client** | `^7.10.1` (*dependencies*) | **`7.10.1`** | `@prisma/client`. |
| **Prisma Adapter PG** | `^7.10.1` (*dependencies*) | **`7.10.1`** | `@prisma/adapter-pg` (menggunakan driver basis data `pg` versi `8.23.1`). |
| **Node.js Engine** | *Tidak didefinisikan* (`undefined`) | Mensyaratkan **`>=20.9.0`** | Diperoleh dari spesifikasi `engines` paket `next@16.4.3`. Base image container yang direkomendasikan adalah **`node:20-alpine`** (ringan, minimal kerentanan bawaan). |
| **Package Manager** | *Tidak didefinisikan* (`undefined`) | **`npm`** (`lockfileVersion: 3`) | Standar npm v7 ke atas; perintah instalasi pada container wajib menggunakan `npm ci --ignore-scripts`. |

---

## 2. Konfigurasi `next.config.*`

Pemeriksaan pada berkas `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
```

### Temuan & Evaluasi:
- **Status `output: "standalone"`:** **BELUM DIKONFIGURASI**.
- **Dampak pada Container:**
  - Tanpa opsi `output: "standalone"`, hasil kompilasi Next.js mengharuskan seluruh folder `node_modules` dibawa ke image produksi dan dijalankan melalui perintah `next start`.
  - Hal ini menyebabkan ukuran image membengkak hingga >1.2 GB, proses build dan transfer image menjadi lambat, serta meningkatkan permukaan serangan (*attack surface*) karena devDependencies dan file non-esensial ikut terbawa.
- **Rekomendasi:**
  - Tambahkan konfigurasi `output: "standalone"` pada `nextConfig` agar Next.js menghasilkan berkas server mandiri di direktori `.next/standalone`, memangkas dependensi secara otomatis, dan memperkecil ukuran image runner menjadi ~150–200 MB.

---

## 3. Konfigurasi Prisma 7 dan Lokasi Generated Prisma Client

### A. Skema Prisma (`prisma/schema.prisma`)
- **Generator Client:**
  ```prisma
  generator client {
    provider = "prisma-client"
    output   = "../generated/prisma"
  }
  ```
  Menggunakan generator baru Prisma 7 (`provider = "prisma-client"`) dengan direktori output yang dikustomisasi ke `../generated/prisma`.
- **Datasource:**
  ```prisma
  datasource db {
    provider = "postgresql"
  }
  ```
  Pada Prisma 7, blok datasource tidak memuat string URL koneksi secara inline.

### B. Konfigurasi Prisma 7 (`prisma.config.ts`)
- URL database dikonfigurasi secara terpusat pada `prisma.config.ts` di root direktori menggunakan helper `defineConfig` dan `env`:
  ```ts
  import "dotenv/config";
  import { defineConfig, env } from "prisma/config";

  export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
      path: "prisma/migrations",
    },
    datasource: {
      url: env("DATABASE_URL"),
    },
  });
  ```

### C. Lokasi Generated Client dan Adapter PostgreSQL
- **Lokasi Fisik Client:** Berada pada direktori `generated/prisma/` (entry point: `generated/prisma/client.ts`).
- **Adapter PostgreSQL:** Diinisialisasi pada `lib/prisma.ts` menggunakan adapter `@prisma/adapter-pg`:
  ```ts
  import { PrismaPg } from "@prisma/adapter-pg";
  import { PrismaClient } from "@/generated/prisma/client";

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum dikonfigurasi di file .env");
  }

  const adapter = new PrismaPg({ connectionString });
  export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
  ```
- *Catatan Penting Kontainerisasi:* Pada multi-stage build, folder `generated/` wajib disalin dari stage builder ke stage runner agar import `@/generated/prisma/client` pada runtime standalone tidak mengalami kegagalan modul (*module not found*).

---

## 4. Script Build dan Start

Berdasarkan definisi pada `package.json`:
- **Script Build:** `"build": "next build"`
- **Script Start:** `"start": "next start"`

### Analisis Operasional:
1. **Ketiadaan Script `prebuild`:**
   - Proyek tidak mendefinisikan script `"prebuild": "prisma generate"`.
   - Oleh karena itu, pada tahap build Dockerfile, perintah `npx prisma generate` harus dipanggil secara eksplisit sebelum `npm run build`. Jika langkah ini terlewat, proses kompilasi Next.js akan gagal karena tipe dan pustaka client Prisma belum terbentuk.
2. **Perbedaan Mode Start:**
   - Script `"start": "next start"` memerlukan instalasi binary CLI Next.js dan direktori `node_modules` lengkap.
   - Pada image container produksi berbasis standalone, entry point start digantikan menjadi `CMD ["node", "server.js"]` yang langsung mengeksekusi server Node.js ringan dari artefak `.next/standalone`.

---

## 5. Kebutuhan Environment Variable (Build vs Runtime)

Berdasarkan pemindaian kode sumber di seluruh modul aplikasi:

| Nama Variabel | Lokasi File Penggunaan | Karakteristik Validasi | Kebutuhan Build vs Runtime |
|---|---|---|---|
| **`DATABASE_URL`** | `lib/prisma.ts`, `prisma.config.ts`, `prisma/seed.ts` | Wajib string koneksi PostgreSQL. Melempar error jika kosong pada `lib/prisma.ts`. | **Build:** Perlu dummy value jika route dievaluasi.<br>**Runtime:** Wajib string koneksi asli ke database PostgreSQL. |
| **`JWT_SECRET`** | `lib/auth.ts` | Wajib string dengan panjang **minimal 32 karakter**. Pengecekan top-level modul melempar exception jika kosong atau `< 32`. | **Build:** Wajib dummy string $\ge 32$ karakter saat kompilasi.<br>**Runtime:** Kunci rahasia penandatanganan token JWT sesi. |
| **`ENCRYPTION_SECRET`** | `lib/crypto.ts` | Wajib string dengan panjang **minimal 32 karakter**. Pengecekan top-level modul melempar exception jika kosong atau `< 32`. | **Build:** Wajib dummy string $\ge 32$ karakter saat kompilasi.<br>**Runtime:** Kunci rahasia AES-256-GCM data PII pengguna. |
| **`NODE_ENV`** | `lib/auth.ts`, `lib/prisma.ts`, `app/api/auth/*` | Mengatur mode produksi (`production`) vs pengembangan (`development`). | **Build & Runtime:** Diatur ke `production`. |

> [!WARNING]
> **Pencegahan Build Crash:**
> Karena validasi `JWT_SECRET`, `ENCRYPTION_SECRET`, dan `DATABASE_URL` dijalankan di luar fungsi (*top-level module execution*) pada saat file di-import, proses `next build` akan langsung berhenti (*crash*) jika variabel tersebut tidak tersedia saat build. Solusinya adalah menetapkan variabel lingkungan dummy ($\ge 32$ karakter) khusus pada tahap `RUN npm run build` di Dockerfile. Kredensial asli tidak boleh di-hardcode ke dalam layer image dan hanya boleh diinjeksikan saat container dijalankan (*runtime injection*).

---

## 6. Status Keberadaan Berkas Dockerfile, .dockerignore, docker-compose, dan GitHub Actions

Pemeriksaan langsung pada struktur file repositori menunjukkan:
- **`Dockerfile`:** **TIDAK ADA**
- **`.dockerignore`:** **TIDAK ADA**
- **`docker-compose.yml` / `compose.yaml`:** **TIDAK ADA**
- **Direktori `.github/` / Workflow GitHub Actions:** **TIDAK ADA**

---

## 7. Potensi Masalah Containerization

1. **Kegagalan Build Akibat Top-Level Validation (Kritis):**
   - *Masalah:* Validasi panjang secret minimal 32 karakter pada `lib/auth.ts` dan `lib/crypto.ts` akan menggagalkan `next build` jika variabel lingkungan tidak disuplai saat kompilasi image.
   - *Mitigasi:* Mengatur variabel dummy build-time pada stage builder Dockerfile.
2. **Kegagalan Resolusi Client Prisma Kustom:**
   - *Masalah:* Karena output Prisma berada pada `generated/prisma`, build akan gagal jika `npx prisma generate` tidak dipanggil sebelum `next build`, atau jika direktori `generated/` tidak disalin ke image runner.
   - *Mitigasi:* Menjalankan generate secara eksplisit dan menyalin folder `generated/` ke stage runner.
3. **Pembengkakan Ukuran Image Tanpa Mode Standalone:**
   - *Masalah:* Image membengkak hingga >1.2 GB dan memuat dependensi dev jika `output: "standalone"` tidak diaktifkan pada `next.config.ts`.
   - *Mitigasi:* Mengaktifkan opsi `output: "standalone"` pada `next.config.ts`.
4. **Kebocoran File Sensitif Tanpa `.dockerignore` (Risiko R01 & R04):**
   - *Masalah:* File rahasia lokal (`.env`, `.env.local`), riwayat Git (`.git`), dan database pengujian lokal (`data/*.sqlite*`) dapat tersalin ke dalam image publik.
   - *Mitigasi:* Menyusun berkas `.dockerignore` yang ketat sebelum proses build pertama kali dilakukan.
5. **Pelanggaran Prinsip Least Privilege (User Root):**
   - *Masalah:* Menjalankan aplikasi sebagai `root` meningkatkan risiko *container breakout* jika terjadi kerentanan pada dependensi.
   - *Mitigasi:* Mendefinisikan user dan group non-root (`USER nextjs:nodejs`) dengan UID/GID 1001 pada stage runner.
6. **Eksposur Port Database ke Jaringan Publik:**
   - *Masalah:* Port default PostgreSQL `5432` rentan terhadap serangan langsung jika dipublikasikan ke `0.0.0.0` pada host.
   - *Mitigasi:* Mengisolasi komunikasi database hanya di dalam jaringan virtual tertutup (*internal Docker bridge network*).

---

## 8. Rekomendasi Implementasi Dockerfile Multi-Stage

Berikut adalah rancangan rekomendasi `Dockerfile` multi-stage yang telah di-hardening dan kompatibel secara penuh dengan temuan audit proyek ini:

```dockerfile
# ==========================================
# STAGE 1: Dependencies Resolution
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Salin manifes dependensi
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ==========================================
# STAGE 2: Build & Prisma Generation
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client 7 (menghasilkan folder generated/prisma)
RUN npx prisma generate

# Build-time dummy environment variables untuk mencegah build crash saat evaluasi modul
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV JWT_SECRET="build_dummy_jwt_secret_min_32_characters_long_for_compilation"
ENV ENCRYPTION_SECRET="build_dummy_encryption_secret_min_32_chars_for_compilation"
ENV DATABASE_URL="postgresql://build_dummy:build_dummy@localhost:5432/build_dummy"

# Kompilasi Next.js (menghasilkan .next/standalone jika output: "standalone" diaktifkan)
RUN npm run build

# ==========================================
# STAGE 3: Production Runner (Hardened)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Hardening: Buat group dan user non-root (Least Privilege)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Salin aset publik dan standalone build dengan kepemilikan non-root
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Salin custom generated Prisma Client ke lingkungan runtime standalone
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated

# Jalankan sebagai non-root user
USER nextjs

EXPOSE 3000

# Healthcheck untuk memantau status aplikasi
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
```

### Rekomendasi Berkas Pendukung `.dockerignore`:
```dockerignore
# Version control
.git
.gitignore

# Environment & Secret files (Mencegah risiko R01 & R04)
.env*
!.env.example

# Dependensi lokal & artefak build host
node_modules
.next
out
build

# Database lokal lama
data/*.sqlite*

# Testing & dokumentasi internal
tests
coverage
docs
security/bukti_tugas2
*.md
!README.md

# Log & metadata
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
*.tsbuildinfo
next-env.d.ts
.DS_Store
```

### Rekomendasi Runtime Security Flags (Docker Compose):
1. **Drop Capabilities:** `cap_drop: [ "ALL" ]` (menghapus seluruh kapabilitas Linux berlebih).
2. **No New Privileges:** `security_opt: [ "no-new-privileges:true" ]` (mencegah eskalasi hak akses UID).
3. **Isolasi Database:** Pada `docker-compose.yml`, hubungkan container Next.js dan PostgreSQL menggunakan *internal bridge network*, dan gunakan directive `expose: [ "5432" ]` (bukan `ports: [ "5432:5432" ]`) agar database terlindungi dari akses publik luar host.

---

## 9. Hasil Implementasi & Verifikasi Container Hardening (Point 4)

Seluruh rekomendasi di atas telah berhasil diimplementasikan secara penuh pada repositori proyek untuk memenuhi penugasan **Point 4 — Container Hardening**:

### A. Matriks Implementasi Kontrol Keamanan Kontainer

| Persyaratan Tugas Point 4 | Lokasi Berkas Konfigurasi | Nilai Konfigurasi Aktual | Status Verifikasi |
|---|---|---|:---:|
| **Pengguna Non-Root** | `Dockerfile` (baris 30–38)<br>`compose.yaml` (baris 6, 27) | `USER nextjs` (UID/GID 1001)<br>`user: "1001:1001"` (app)<br>`user: postgres` (db) | **PASS** |
| **Pembatasan Capability** | `compose.yaml` (baris 19–20, 39–40) | `cap_drop: - ALL`<br>`security_opt: - no-new-privileges:true` | **PASS** |
| **Filesystem Read-Only** | `compose.yaml` (baris 21–23) | `read_only: true`<br>`tmpfs: - /tmp` | **PASS** |
| **Port Database Tidak Dipublikasikan** | `compose.yaml` (baris 31–32) | `expose: - "5432"` (TIDAK ADA directive `ports:`) | **PASS** |
| **Port Aplikasi Tidak Dipublikasikan** | `compose.yaml` (baris 13–14) | `expose: - "3000"` (TIDAK ADA directive `ports:`) | **PASS** |
| **Isolasi Jaringan Internal** | `compose.yaml` (baris 51–52) | `networks: app_internal` dengan `internal: true` | **PASS** |
| **Proteksi Berkas Sensitif** | `.dockerignore` | Mengabaikan `.git`, `.env*`, `node_modules`, `data/*.sqlite*` | **PASS** |
| **Kompilasi Standalone Ringan** | `next.config.ts` | `output: "standalone"` aktif | **PASS** |

### B. Alternatif Pengujian Tanpa Docker Desktop

Mengingat Docker Desktop for Windows membutuhkan alokasi memori besar (4–6 GB RAM) dan virtualisasi WSL2 yang berat untuk spesifikasi laptop pengguna, berikut adalah tiga metode alternatif standar industri yang telah disiapkan:

1. **Alternatif 1: Otomasi Cloud CI/CD via GitHub Actions (Rekomendasi Utama)**
   - Repositori telah dilengkapi workflow `.github/workflows/container-security.yml`.
   - Proses build image, pemindaian kerentanan CVE dengan **Trivy**, dan inventarisasi dependensi SBOM dengan **Syft** dijalankan sepenuhnya di cloud runner GitHub (Ubuntu VM gratis, 0 MB beban RAM lokal).
   - Pengguna cukup melakukan push kode ke branch GitHub atau menekan tombol *Run workflow* di tab Actions, lalu mengunduh berkas laporan hasil scan (`trivy-report.txt` dan `sbom.cdx.json`).
2. **Alternatif 2: Sandbox Lingkungan Virtual Iximiuz Labs (Online Linux CLI)**
   - Menggunakan lingkungan lab Ubuntu Iximiuz Labs yang sama seperti pada pengerjaan Point 3.
   - Di terminal Iximiuz Labs, engine Docker native Linux sudah terpasang dan sangat ringan. Pengguna dapat menjalankan validasi sintaks dan runtime:
     ```bash
     docker compose config
     docker build -t riggisa-parfume:latest .
     docker run --rm riggisa-parfume:latest whoami  # Memvalidasi output: nextjs (UID 1001)
     ```
3. **Alternatif 3: Skrip Pengujian Validasi Statis Lokal (`npm run test:container`)**
   - Dibuat skrip pengujian berbasis Node.js test runner bawaan pada `tests/container-security.test.ts`.
   - Skrip ini memverifikasi secara deterministik seluruh aturan hardening pada `Dockerfile`, `compose.yaml`, `.dockerignore`, dan `next.config.ts` tanpa perlu menyalakan Docker daemon.
   - Perintah eksekusi:
     ```bash
     npm run test:container
     ```
   - **Hasil Aktual:** 4 pengujian berhasil lulus (*100% PASS*):
     - `✔ Container Hardening: Dockerfile least privilege & non-root user`
     - `✔ Container Hardening: compose.yaml capability restriction & port isolation`
     - `✔ Container Hardening: .dockerignore proteksi berkas sensitif`
     - `✔ Container Hardening: Next.js output standalone aktif`

