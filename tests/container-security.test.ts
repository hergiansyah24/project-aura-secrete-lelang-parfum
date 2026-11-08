import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

test("Container Hardening: Dockerfile least privilege & non-root user", () => {
  const dockerfilePath = path.join(rootDir, "Dockerfile");
  assert.ok(fs.existsSync(dockerfilePath), "Dockerfile harus tersedia");

  const dockerfile = fs.readFileSync(dockerfilePath, "utf-8");

  // 1. Verifikasi multi-stage build
  assert.match(dockerfile, /FROM node:20-alpine AS deps/i, "Wajib menggunakan multi-stage (stage deps)");
  assert.match(dockerfile, /FROM node:20-alpine AS builder/i, "Wajib menggunakan multi-stage (stage builder)");
  assert.match(dockerfile, /FROM node:20-alpine AS runner/i, "Wajib menggunakan multi-stage (stage runner)");

  // 2. Verifikasi pembuatan user dan grup non-root (UID/GID 1001)
  assert.match(dockerfile, /addgroup\s+--system\s+--gid\s+1001\s+nodejs/, "Grup non-root nodejs (GID 1001) wajib dibuat");
  assert.match(dockerfile, /adduser\s+--system\s+--uid\s+1001\s+nextjs/, "User non-root nextjs (UID 1001) wajib dibuat");

  // 3. Verifikasi instruksi USER non-root
  assert.match(dockerfile, /USER\s+nextjs/, "Tahap runner wajib beralih ke USER non-root (nextjs)");

  // 4. Verifikasi kepemilikan berkas (chown non-root)
  assert.match(dockerfile, /--chown=nextjs:nodejs/, "Berkas aplikasi wajib disalin dengan kepemilikan nextjs:nodejs");

  // 5. Verifikasi generasi Prisma Client sebelum build
  assert.match(dockerfile, /npx prisma generate/, "Prisma generate wajib dieksekusi sebelum kompilasi");
});

test("Container Hardening: compose.yaml capability restriction & port isolation", () => {
  const composePath = path.join(rootDir, "compose.yaml");
  assert.ok(fs.existsSync(composePath), "compose.yaml harus tersedia");

  const compose = fs.readFileSync(composePath, "utf-8");

  // 1. Verifikasi penegakan pengguna non-root
  assert.match(compose, /user:\s*["']?1001:1001["']?/, "Service app wajib menegakkan user non-root 1001:1001");
  assert.match(compose, /user:\s*postgres/, "Service db wajib menegakkan user non-root postgres");

  // 2. Verifikasi pembatasan capabilities (cap_drop: ALL)
  const capDropMatches = compose.match(/cap_drop:\s*\n\s*-\s*ALL/g);
  assert.ok(capDropMatches && capDropMatches.length >= 2, "Seluruh service (app dan db) wajib menerapkan cap_drop: - ALL");

  // 3. Verifikasi no-new-privileges
  const noNewPrivMatches = compose.match(/security_opt:\s*\n\s*-\s*no-new-privileges:true/g);
  assert.ok(noNewPrivMatches && noNewPrivMatches.length >= 2, "Seluruh service wajib menerapkan no-new-privileges:true");

  // 4. Verifikasi proteksi filesystem read-only pada app
  assert.match(compose, /read_only:\s*true/, "Service app wajib menggunakan root filesystem read-only");
  assert.match(compose, /tmpfs:\s*\n\s*-\s*\/tmp/, "Service app wajib mendefinisikan tmpfs /tmp untuk data sementara");

  // 5. Verifikasi port app dan db TIDAK dipublikasikan ke publik (0.0.0.0)
  assert.doesNotMatch(compose, /ports:\s*\n\s*-\s*["']?0\.0\.0\.0/i, "Port tidak boleh dipublikasikan ke antarmuka publik 0.0.0.0");
  assert.doesNotMatch(compose, /ports:\s*\n\s*-\s*["']?5432:5432["']?/i, "Port database 5432 tidak boleh dipublikasikan ke host");

  // 6. Verifikasi port hanya menggunakan internal expose
  assert.match(compose, /expose:\s*\n\s*-\s*["']?3000["']?/, "Port app wajib menggunakan expose internal");
  assert.match(compose, /expose:\s*\n\s*-\s*["']?5432["']?/, "Port db wajib menggunakan expose internal");

  // 7. Verifikasi isolated internal network
  assert.match(compose, /networks:\s*\n\s*app_internal:\s*\n\s*internal:\s*true/, "Jaringan app_internal wajib diset internal: true");
});

test("Container Hardening: .dockerignore proteksi berkas sensitif", () => {
  const ignorePath = path.join(rootDir, ".dockerignore");
  assert.ok(fs.existsSync(ignorePath), ".dockerignore harus tersedia");

  const dockerignore = fs.readFileSync(ignorePath, "utf-8");

  // Verifikasi file sensitif diabaikan agar tidak bocor ke container image
  assert.match(dockerignore, /\.git/, ".git wajib diabaikan");
  assert.match(dockerignore, /\.env\*/, "File environment rahasia (.env*) wajib diabaikan");
  assert.match(dockerignore, /node_modules/, "node_modules lokal wajib diabaikan");
  assert.match(dockerignore, /data\/\*\.sqlite\*/, "File database lokal wajib diabaikan");
});

test("Container Hardening: Next.js output standalone aktif", () => {
  const nextConfigPath = path.join(rootDir, "next.config.ts");
  assert.ok(fs.existsSync(nextConfigPath), "next.config.ts harus tersedia");

  const nextConfig = fs.readFileSync(nextConfigPath, "utf-8");
  assert.match(nextConfig, /output:\s*["']standalone["']/, "next.config.ts wajib mengonfigurasi output: standalone");
});
