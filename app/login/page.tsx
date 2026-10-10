"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import { Lock, User, AlertCircle, KeyRound, ShieldCheck, RefreshCw } from "lucide-react";

/*
  Tema mengikuti landing page: skala zinc/amber sudah di-remap di globals.css
  (zinc-950/900 = krem terang, zinc-100 = teks cokelat tua).
*/

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Login gagal.");
    }
  };

  const handleQuickFill = (userType: "admin" | "bidder1" | "bidder2") => {
    if (userType === "admin") {
      setIdentifier("curator@aurasecrete.luxury");
      setPassword("AdminSecret123!");
    } else if (userType === "bidder1") {
      setIdentifier("alex@perfumecollector.id");
      setPassword("BidderSecret123!");
    } else {
      setIdentifier("clara@nicheparfums.com");
      setPassword("BidderSecret123!");
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-zinc-100">
      <Navbar />

      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-6 py-12 overflow-hidden">
        {/* Cahaya lembut ala studio, sama seperti hero landing page */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-white/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="hero-rise relative z-10 max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_35px_80px_-35px_rgba(60,45,30,0.55)] backdrop-blur-sm">
          <div className="text-center space-y-2 mb-6">
            <div className="hero-rise hero-delay-1 w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="hero-rise hero-delay-2 text-3xl font-serif font-bold text-zinc-100">
              Masuk ke Vault Lelang
            </h1>
            <p className="hero-rise hero-delay-2 text-xs text-zinc-400">
              Akses akun bidder atau panel kurator lelang terenkripsi
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-400/10 border border-rose-400/40 text-rose-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="hero-rise hero-delay-3 space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Username atau Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin / email@example.com"
                  className="w-full bg-zinc-950/60 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/60 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifikasi Kredensial...
                </>
              ) : (
                "Masuk ke Akun"
              )}
            </button>
          </form>

          {/* Quick Demo Autofill Bar */}
          <div className="hero-rise hero-delay-4 mt-6 pt-5 border-t border-zinc-800 text-center">
            <span className="text-[11px] text-zinc-400 block mb-2 font-mono">
              Pintasan demo (1 klik isi form):
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill("admin")}
                className="py-1.5 px-2 rounded-lg bg-zinc-950/50 border border-amber-500/40 text-amber-300 hover:bg-zinc-800/60 transition-colors font-mono cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("bidder1")}
                className="py-1.5 px-2 rounded-lg bg-zinc-950/50 border border-indigo-400/40 text-indigo-400 hover:bg-zinc-800/60 transition-colors font-mono cursor-pointer"
              >
                Bidder 1
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("bidder2")}
                className="py-1.5 px-2 rounded-lg bg-zinc-950/50 border border-emerald-400/40 text-emerald-400 hover:bg-zinc-800/60 transition-colors font-mono cursor-pointer"
              >
                Bidder 2
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-zinc-400">
            Belum memiliki akun bidder?{" "}
            <Link href="/register" className="text-amber-400 hover:underline font-medium">
              Daftar Sekarang
            </Link>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Rate Limiting Aktif
            </span>
            <span>Max 5 percobaan/menit</span>
          </div>
        </div>
      </main>
    </div>
  );
}