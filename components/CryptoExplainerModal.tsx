"use client";

import React from "react";
import { X, Lock, ShieldCheck, Key, EyeOff, RefreshCw, FileText, CheckCircle2, AlertOctagon } from "lucide-react";

export function CryptoExplainerModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-zinc-100">
              Arsitektur Kriptografi & Keamanan Siber
            </h2>
            <p className="text-xs text-amber-400/90 font-mono">
              Sealed-Bid Commit-Reveal Scheme & AES-256-GCM
            </p>
          </div>
        </div>

        <div className="space-y-6 mt-6 text-sm text-zinc-300">
          {/* Section 1: Skema Commit-Reveal */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 sm:p-5">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-amber-400" />
              1. Skema Commit-Reveal (Zero-Knowledge Sealed Bidding)
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Pada lelang konvensional, admin atau hacker yang mengintip database dapat melihat penawaran peserta lain (risiko kolusi dan <em>bid sniping</em>). Di <strong>Aura Secrète</strong>, kami menerapkan protokol kriptografi klasik dua fase:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-900/90 p-3.5 rounded-lg border border-indigo-500/30">
                <div className="font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4" /> Fase 1: Commit (Penyegelan)
                </div>
                <ul className="space-y-1.5 text-zinc-400 text-[11px] list-disc list-inside">
                  <li>Browser membuat angka acak 256-bit (<strong>Secret Nonce</strong>).</li>
                  <li>Browser menghitung: <code className="text-indigo-300 bg-zinc-950 px-1 py-0.5 rounded font-mono">H = SHA-256(auctionId:nominal:nonce)</code>.</li>
                  <li>Hanya nilai <strong>Hash H</strong> yang dikirim ke server.</li>
                  <li><strong className="text-zinc-200">Nominal asli tidak pernah dikirim ke server</strong> pada fase ini. Pre-image resistance SHA-256 menjamin nominal tidak bisa didekripsi.</li>
                </ul>
              </div>

              <div className="bg-zinc-900/90 p-3.5 rounded-lg border border-amber-500/30">
                <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> Fase 2: Reveal (Pembukaan Segel)
                </div>
                <ul className="space-y-1.5 text-zinc-400 text-[11px] list-disc list-inside">
                  <li>Setelah waktu lelang habis, fase penawaran ditutup permanen.</li>
                  <li>User mengirimkan <strong>Nominal Asli + Secret Nonce</strong>.</li>
                  <li>Server menghitung ulang hash dan membandingkannya:</li>
                  <li><span className="text-emerald-400 font-medium">Cocok ✅</span>: Tawaran resmi tercatat & diikutsertakan.</li>
                  <li><span className="text-rose-400 font-medium">Beda ❌</span>: Tawaran ditolak, akun di-flag manipulasi.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Anti-Cheat & Siber Defense */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 sm:p-5">
            <h3 className="text-base font-bold text-rose-300 flex items-center gap-2 mb-3">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              2. Pertahanan Siber & Anti-Cheat Eksplisit
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                <div className="font-semibold text-zinc-200 mb-1">Rate Limiting</div>
                <p className="text-[11px] text-zinc-400">
                  Sliding-window limiter membatasi percobaan login (max 5/menit) dan spamming bid commitment (max 10/menit).
                </p>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                <div className="font-semibold text-zinc-200 mb-1">Prepared Statements</div>
                <p className="text-[11px] text-zinc-400">
                  Semua query SQLite menggunakan parameter binding 100%, menutup celah SQL Injection sepenuhnya.
                </p>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                <div className="font-semibold text-zinc-200 mb-1">Anti-Cheat Flagging</div>
                <p className="text-[11px] text-zinc-400">
                  Jika peserta mencoba mengirim nominal berbeda saat reveal, sistem otomatis mendeteksi ketidaksesuaian hash dan membekukan akun.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Data Privacy (AES-256-GCM) & Audit Log */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 sm:p-5">
            <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              3. Enkripsi Data Pribadi (AES-256-GCM) & Audit Trail
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                <div className="font-semibold text-emerald-300 mb-1">Enkripsi Profil di Database</div>
                <p className="text-[11px] text-zinc-400">
                  Nama lengkap, nomor telepon, dan alamat pengiriman peserta disimpan dalam format ciphertext <code className="font-mono text-emerald-400">iv:authTag:ciphertext</code> menggunakan AES-256-GCM authenticated cipher.
                </p>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                <div className="font-semibold text-emerald-300 mb-1">Audit Log Forensik</div>
                <p className="text-[11px] text-zinc-400">
                  Setiap aksi komitmen, pembukaan reveal, login, dan anomali keamanan dicatat permanen lengkap dengan IP Address dan timestamp.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

