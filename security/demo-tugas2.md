# Demonstrasi Keamanan Tugas 2 (`sec-0.2`)

Dokumen ini merangkum urutan demonstrasi, perintah/halaman yang ditampilkan, bukti yang digunakan, dan batas status verifikasi kontrol keamanan Tugas 2.

## Referensi Risk ID

Risk ID berikut disalin dari `security/risk_register.md` dan tidak menambah ID baru:

- `R01` — Secret bawaan digunakan ketika konfigurasi rahasia tidak tersedia.
- `R02` — Nonce dibuat menggunakan fallback `Math.random()`.
- `R03` — Bukti penawaran pada browser atau file JSON diakses pihak lain.
- `R04` — Data sensitif pada database atau cadangannya diakses tanpa izin.
- `R05` — Kredensial akun demo tetap aktif pada lingkungan produksi.

Pemetaan ini menghubungkan kontrol Tugas 2 dengan risiko Tugas 1. Marker `sec-0.2` adalah penanda tugas, bukan Risk ID baru.

## Status Bukti

- Status di bawah hanya menyatakan bukti yang tercatat dalam dokumen repository.
- `PASS` tidak diperluas di luar skenario atau lingkungan yang benar-benar didokumentasikan.
- Scan image, SBOM, dan runtime Docker Compose belum dinyatakan berhasil karena GitHub Actions belum memberikan hasil eksekusi aktual.

## Urutan Demonstrasi

### 1. Access control / RBAC — R03, R04, R05

**Yang ditampilkan:**

- `security/access-tests.md` bagian matriks akses.
- Halaman atau endpoint yang sesuai dengan skenario pengujian.
- Bukti screenshot skenario yang tercantum dalam dokumen.

**Skenario yang sudah tercatat PASS:**

- Login bidder (`AT-P11`): HTTP 200.
- Logout bidder (`AT-P12`): HTTP 200; `GET /api/auth/me` setelah logout menghasilkan `user === null`.
- Profil tanpa autentikasi (`AT-P16`): HTTP 200 dengan `{"user":null}`.
- Bidder ditolak membuat, mengubah, menghapus, dan memfinalisasi lelang (`AT-N02`–`AT-N05`): HTTP 403.
- Bidder ditolak mengakses users, flag/unflag, seluruh bid, menghapus bid, dan audit log (`AT-N06`–`AT-N10`): HTTP 403.
- Commit, reveal, dan riwayat bid tanpa autentikasi (`AT-N13`–`AT-N15`): HTTP 401.

**Bukti:** screenshot yang dirujuk pada `security/access-tests.md` dan dokumen tersebut.

**Batasan:** skenario yang tidak tercantum tidak dianggap teruji. Pengujian runtime HTTP lainnya tetap `NOT TESTED`.

### 2. Password hashing dengan bcrypt — R01

**Yang ditampilkan:**

- `security/access-tests.md`, bagian “Poin 2 — Password Hashing”.
- `app/api/auth/register/route.ts`, `lib/auth.ts`, `app/api/auth/login/route.ts`, dan `prisma/schema.prisma` untuk pemeriksaan statis.
- Bukti runtime bcrypt dummy pada `security/bukti_tugas2/pengujian_runtime%20bcrypt.png`.

**Hasil yang tercatat:**

- Registrasi memanggil `hashPassword`.
- Implementasi menggunakan `bcrypt.hash(password, 10)`.
- Login menggunakan `bcrypt.compare`.
- Hasil uji dummy di memori: `hashCreated: true`, `costFactor: 10`, `correctPassword: true`, `wrongPassword: false`.

Uji tersebut tidak menggunakan database, API register/login, password produksi, atau hash yang ditampilkan.

### 3. SSH dan VM hardening — R01, R04

**Yang ditampilkan:**

- `security/system-hardening.md` bagian kondisi before/after dan verifikasi.
- `security/bukti_tugas2/ssh-hardening.txt`.
- Artefak screenshot Lynis dan terminal SSH pada `security/bukti_tugas2/`.

**Perintah yang tercatat dalam dokumentasi:**

```bash
sudo sshd -T
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 laborant@127.0.0.1 'echo SSH_KEY_AUTH_OK'
sudo systemctl is-active fail2ban
```

**Hasil yang tercatat:**

- `permitrootlogin no`.
- `passwordauthentication no`.
- `kbdinteractiveauthentication no`.
- `pubkeyauthentication yes`.
- Output key authentication: `SSH_KEY_AUTH_OK`.
- Fail2ban: `active`.
- Lynis hardening index terdokumentasi meningkat dari 61 menjadi 70.

Hasil ini berlaku pada Ubuntu VM yang didokumentasikan, bukan bukti Docker runtime.

### 4. Container hardening — R04

**Yang ditampilkan:**

- `Dockerfile`, `compose.yaml`, `.dockerignore`.
- `tests/container-security.test.ts`.
- `security/container-audit.md`.

**Perintah statis yang sudah tercatat:**

```bash
npm run test:container
```

**Hasil yang benar-benar tercatat:**

- 4 test passed.
- 0 test failed.
- Pemeriksaan mencakup non-root user, capability restriction/port isolation, `.dockerignore`, dan Next.js standalone output sesuai isi test.

**Yang masih menunggu GitHub Actions:**

- Build image aktual pada runner.
- `docker compose up -d --build`.
- Healthcheck app.
- UID app `1001`.
- Database non-root.
- `cap_drop: ALL`.
- `no-new-privileges`.
- Root filesystem app read-only.
- Log runtime `container-hardening-tests.txt`.

### 5. Trivy image scan — R01, R04

**Yang ditampilkan setelah workflow berjalan:**

- Artifact `image-scan-before.txt`.
- Artifact `image-scan-after.txt`.
- Log/pemeriksaan CRITICAL final.

`before` adalah baseline rekonstruksi yang memakai source dan dependency sama dengan image final, bukan image historis. Baseline menghilangkan hardening container untuk membuat perbandingan konfigurasi terkontrol. Commit historis yang diperiksa tidak memiliki Dockerfile, sehingga tidak dapat menjadi sumber image before historis.

**Status saat ini:** belum terverifikasi. Jangan menyatakan scan berhasil, jumlah CVE, atau status CRITICAL sebelum artifact GitHub Actions tersedia.

### 6. SBOM — R01, R04

**Yang ditampilkan setelah workflow berjalan:**

- Artifact `sbom.cdx.json`.
- Format CycloneDX JSON.
- Referensi tag image final yang digunakan Syft.

**Status saat ini:** belum terverifikasi. Tidak ada SBOM aktual yang diklaim sebelum GitHub Actions selesai.

## Ringkasan Pemetaan

| Kontrol demonstrasi | Risk ID asli | Bukti repository saat ini | Status yang boleh dilaporkan |
|---|---|---|---|
| Access control / RBAC | R03, R04, R05 | `security/access-tests.md` dan screenshot yang dirujuk | PASS hanya untuk skenario yang tercatat; lainnya NOT TESTED |
| Bcrypt/password hashing | R01 | `security/access-tests.md`, source yang dirujuk, screenshot runtime dummy | Pemeriksaan statis dan uji dummy sesuai catatan |
| SSH/VM hardening | R01, R04 | `security/system-hardening.md`, log, screenshot | Terverifikasi pada Ubuntu VM yang didokumentasikan |
| Container hardening | R04 | `tests/container-security.test.ts`, `security/container-audit.md` | Tes statis 4/4; runtime menunggu GitHub Actions |
| Trivy scan | R01, R04 | Workflow dan artifact yang akan dihasilkan | Menunggu GitHub Actions |
| SBOM CycloneDX | R01, R04 | Workflow dan artifact yang akan dihasilkan | Menunggu GitHub Actions |

## Batasan Demonstrasi

- Tidak ada Risk ID baru.
- Tidak ada hasil Trivy, SBOM, atau Compose runtime yang dibuat atau diklaim tanpa output GitHub Actions.
- Bukti VM/SSH tidak dapat dipakai sebagai bukti runtime container.
- Tes statis container tidak membuktikan keberhasilan build atau runtime Docker.
- Baseline image `before` adalah rekonstruksi transparan, bukan representasi image historis repository.
- Pengujian yang memerlukan database, seed, atau mutasi data harus menggunakan environment pengujian terisolasi.

## Referensi

- `security/risk_register.md`
- `security/security_controls.md`
- `security/access-tests.md`
- `security/container-audit.md`
- `security/system-hardening.md`
- `.github/workflows/container-security.yml`
