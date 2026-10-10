"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import {
  User,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Database,
  Calendar,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Sparkles
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">
          Memuat data profil terenkripsi...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">
          Silakan masuk terlebih dahulu untuk melihat profil.
        </div>
      </div>
    );
  }

  const profile = user.profile;
  const rawEncrypted = profile?.rawEncrypted;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">
        {/* Profile Header */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/30 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl font-bold font-serif shadow-lg shadow-amber-500/10">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-serif text-zinc-100">
                  {user.username}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase font-bold">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-zinc-400" /> {user.email}
              </p>
            </div>
          </div>

          {/* Account Security Status */}
          <div>
            {user.isFlagged ? (
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs flex items-start gap-2.5 max-w-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <div className="font-bold font-mono">AKUN DITANGGUHKAN / FLAGGED</div>
                  <div className="text-[11px] text-rose-200 mt-0.5 leading-relaxed">
                    {user.flagReason || "Terdeteksi anomali pada verifikasi hash penawaran."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>STATUS: TERVERIFIKASI & AMAN</span>
              </div>
            )}
          </div>
        </div>

        {/* User Information & Decryption Inspector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Decrypted Personal Info */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-base font-bold font-serif text-amber-300 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              Data Pribadi (Hasil Dekripsi Sesi)
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Data ini didekripsi secara aman di memori server hanya saat sesi Anda aktif.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block mb-0.5">Nama Lengkap:</span>
                <span className="text-zinc-100 font-medium">{profile?.fullName || "-"}</span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block mb-0.5">Nomor Telepon:</span>
                <span className="text-zinc-100 font-mono font-medium">{profile?.phone || "-"}</span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block mb-0.5">Alamat Pengiriman:</span>
                <span className="text-zinc-100 font-medium">{profile?.address || "-"}</span>
              </div>
            </div>
          </div>

          {/* Raw Database Ciphertext (Educational Crypto Showcase) */}
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif text-amber-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Inspeksi Database (Ciphertext)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                AES-256-GCM
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bentuk fisik data Anda yang tersimpan di disk database SQLite. Jika database dicuri hacker, mereka hanya melihat string sandi di bawah:
            </p>

            <div className="space-y-3 pt-2 text-xs font-mono">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block mb-1">
                  full_name_encrypted (<code className="text-amber-400">iv:tag:cipher</code>):
                </span>
                <span className="text-[10px] text-emerald-400 break-all select-all">
                  {rawEncrypted?.fullNameCiphertext || "[BELUM_TERSEDIA]"}
                </span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block mb-1">
                  phone_encrypted:
                </span>
                <span className="text-[10px] text-emerald-400 break-all select-all">
                  {rawEncrypted?.phoneCiphertext || "[BELUM_TERSEDIA]"}
                </span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 text-[10px] block mb-1">
                  password_hash (bcrypt Salted Hash):
                </span>
                <span className="text-[10px] text-indigo-300 break-all">
                  $2a$10$wK9gQzV6... (Disimpan 1 arah, tidak bisa didekripsi)
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

