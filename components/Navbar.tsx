"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import {
  Shield,
  Lock,
  User,
  LogOut,
  Sparkles,
  KeyRound,
  AlertTriangle,
  HelpCircle,
  Menu,
  X,
  Crown,
} from "lucide-react";
import { CryptoExplainerModal } from "./CryptoExplainerModal";

// Gaya bersama untuk semua item menu desktop supaya ukuran & weight seragam.
// - whitespace-nowrap + shrink-0 : teks tidak pecah jadi dua baris
// - text-sm (2xl: text-base)     : muat saat login sebagai admin
// - focus-visible                : indikator fokus keyboard (aksesibilitas)
const navItem =
  "flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm 2xl:text-base font-bold text-[#231B16] transition-colors hover:text-[#9E472A] cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9E472A]";

// Gaya fokus untuk tombol bulat (ikon)
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9E472A]";

export function Navbar() {
  const { user, logout, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleQuickLogin = async (identifier: string) => {
    setDemoLoading(true);
    const pass = identifier.includes("admin") ? "AdminSecret123!" : "BidderSecret123!";
    await login(identifier, pass);
    setDemoLoading(false);
    setShowDemoModal(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? "bg-[#F8F4EE]/95 backdrop-blur-md shadow-sm border-b border-[#DED1BF]"
            : "bg-[#F8F4EE]/80 backdrop-blur-sm border-b border-[#DED1BF]/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16 sm:h-20">
            {/* GRUP 1: Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#9E472A]/40 bg-white/60 backdrop-blur-sm flex items-center justify-center text-[#9E472A] font-serif font-bold text-xs sm:text-sm shadow-sm group-hover:scale-105 transition-transform">
                AS
              </div>
              <div className="flex flex-col">
                <span className="whitespace-nowrap font-serif tracking-[0.2em] uppercase text-base sm:text-lg font-semibold text-[#231B16]">
                  Aura Secrète
                </span>
                {/* Tagline disembunyikan di 1280-1535px agar menu tidak sesak */}
                <span className="hidden sm:flex xl:hidden 2xl:flex whitespace-nowrap text-[9px] sm:text-[10px] tracking-wider uppercase text-[#6B5D50] font-mono items-center gap-1 -mt-0.5">
                  <Lock className="w-2.5 h-2.5 text-[#9E472A]" aria-hidden="true" /> Sealed-Bid Luxury Fragrances
                </span>
              </div>
            </Link>

            {/* GRUP 2: Menu tengah (desktop mulai 1280px) */}
            <nav
              aria-label="Navigasi utama"
              className="hidden xl:flex min-w-0 flex-1 items-center justify-center gap-5 2xl:gap-8"
            >
              <Link href="/" className={navItem}>
                Beranda
              </Link>
              <Link href="/#katalog" className={navItem}>
                Katalog
              </Link>
              <Link href="/#cara-kerja" className={navItem}>
                Cara Kerja
              </Link>
              <Link href="/#keamanan" className={navItem}>
                Keamanan
              </Link>
              <button type="button" onClick={() => setShowCryptoModal(true)} className={navItem}>
                <HelpCircle className="h-4 w-4 text-[#9E472A]" aria-hidden="true" />
                <span>Kripto ✦</span>
              </button>

              {user && (
                <Link href="/my-bids" className={`${navItem} !text-[#9E472A]`}>
                  <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Bid Saya</span>
                </Link>
              )}

              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className={`shrink-0 whitespace-nowrap text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-[#9E472A]/10 border border-[#9E472A]/30 text-[#9E472A] hover:bg-[#9E472A]/20 transition-all ${focusRing}`}
                >
                  Admin Vault
                </Link>
              )}
            </nav>

            {/* GRUP 3: Aksi kanan (desktop mulai 1280px) */}
            <div className="hidden xl:flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                className={navItem}
                title="Pilih akun simulasi untuk demo"
                aria-label="Akun Demo"
              >
                <KeyRound className="h-4 w-4 text-[#9E472A]" aria-hidden="true" />
                {/* Saat login, teks hanya tampil di layar sangat lebar */}
                <span className={user ? "hidden 2xl:inline" : ""}>Akun Demo</span>
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  {user.isFlagged && (
                    <div className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-xs flex items-center gap-1 font-mono animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>SUSPENDED</span>
                    </div>
                  )}

                  <Link
                    href="/profile"
                    aria-label={`Profil ${user.username} (${user.role})`}
                    className={`flex items-center gap-2 px-2 2xl:px-3 py-1.5 rounded-full bg-white/70 border border-[#DED1BF] hover:border-[#9E472A] transition-all ${focusRing}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#9E472A]/15 border border-[#9E472A]/30 flex items-center justify-center text-[#9E472A] text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Nama & role hanya di layar sangat lebar */}
                    <div className="hidden 2xl:flex flex-col text-left">
                      <span className="text-xs font-semibold text-[#231B16] leading-tight">
                        {user.username}
                      </span>
                      <span className="text-[9px] text-[#6B5D50] capitalize font-mono leading-tight">
                        {user.role}
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => logout()}
                    aria-label="Keluar"
                    title="Keluar"
                    className={`p-2 rounded-full border border-[#DED1BF] bg-white/70 text-[#6B5D50] hover:text-rose-700 hover:border-rose-300 transition-all cursor-pointer ${focusRing}`}
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className={navItem}>
                    Masuk
                  </Link>

                  <Link
                    href="/register"
                    className={`whitespace-nowrap rounded-full bg-[#9E472A] px-5 py-2 text-sm 2xl:text-base font-bold text-white transition-colors hover:bg-[#843A21] ${focusRing}`}
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions (di bawah 1280px) */}
            <div className="flex xl:hidden items-center gap-2">
              {/* ⬇️ Tombol kunci versi mobile: tombol ikon saja → wajib aria-label */}
              <button
                type="button"
                onClick={() => setShowDemoModal(true)}
                aria-label="Akun Demo"
                title="Akun Demo"
                className={`text-xs p-2 rounded-full bg-white/70 border border-[#DED1BF] text-[#9E472A] ${focusRing}`}
              >
                <KeyRound className="w-4 h-4" aria-hidden="true" />
              </button>
              {/* ⬇️ Tombol hamburger: tombol ikon saja → wajib aria-label */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className={`p-2 rounded-full bg-white/70 border border-[#DED1BF] text-[#231B16] ${focusRing}`}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="xl:hidden border-b border-[#DED1BF] bg-[#F8F4EE]/95 backdrop-blur-md px-6 pt-3 pb-6 space-y-3"
          >
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm py-2 text-[#9E472A] font-semibold"
            >
              Beranda
            </Link>
            <Link
              href="/#katalog"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm py-2 text-[#231B16] hover:text-[#9E472A] font-semibold"
            >
              Katalog Lelang
            </Link>
            <Link
              href="/#cara-kerja"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm py-2 text-[#231B16] hover:text-[#9E472A] font-semibold"
            >
              Cara Kerja
            </Link>
            <Link
              href="/#keamanan"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm py-2 text-[#231B16] hover:text-[#9E472A] font-semibold"
            >
              Keamanan
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowCryptoModal(true);
              }}
              className="w-full text-left text-sm py-2 text-[#231B16] hover:text-[#9E472A] flex items-center gap-2 font-semibold"
            >
              <HelpCircle className="w-4 h-4 text-[#9E472A]" aria-hidden="true" />
              Protokol Commit-Reveal
            </button>
            {user && (
              <Link
                href="/my-bids"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm py-2 text-[#9E472A] font-semibold"
              >
                Penawaran Saya
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-sm py-2 text-[#9E472A] font-semibold"
              >
                <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Admin Vault</span>
              </Link>
            )}

            <div className="pt-3 border-t border-[#DED1BF]">
              {user ? (
                <div className="flex items-center justify-between">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm text-[#231B16] font-semibold"
                  >
                    <User className="w-4 h-4 text-[#9E472A]" aria-hidden="true" />
                    <span>Profil ({user.username})</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-xs text-rose-700 flex items-center gap-1 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Keluar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-xs py-2.5 rounded-full bg-white border border-[#DED1BF] text-[#231B16] font-semibold"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-xs py-2.5 rounded-full bg-[#9E472A] text-white font-semibold"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Quick Demo Accounts Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            className="bg-[#FDFBF7] border border-[#DED1BF] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#231B16]"
          >
            {/* ⬇️ Tombol tutup: tombol ikon saja → wajib aria-label */}
            <button
              type="button"
              onClick={() => setShowDemoModal(false)}
              aria-label="Tutup dialog"
              className={`absolute top-4 right-4 text-[#6B5D50] hover:text-[#231B16] rounded-sm ${focusRing}`}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2.5 text-[#9E472A] mb-2">
              <KeyRound className="w-5 h-5" aria-hidden="true" />
              <h3 id="demo-modal-title" className="text-lg font-bold font-serif">
                Simulasi Akun Demo (1-Click)
              </h3>
            </div>
            <p className="text-xs text-[#6B5D50] mb-5 leading-relaxed">
              Pilih akun pra-konfigurasi di bawah untuk memudahkan presentasi atau evaluasi sistem kriptografi sealed-bid:
            </p>

            <div className="space-y-3">
              {/* Admin Button */}
              <button
                type="button"
                disabled={demoLoading}
                onClick={() => handleQuickLogin("curator@aurasecrete.luxury")}
                className="w-full text-left p-3.5 rounded-xl bg-[#F3ECE1] border border-[#9E472A]/30 hover:border-[#9E472A] hover:bg-[#EAE1D3] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#9E472A]/15 text-[#9E472A] flex items-center justify-center font-bold text-xs">
                    ADM
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#231B16] flex items-center gap-1.5">
                      <span>Administrator Curateur</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#9E472A]/15 text-[#9E472A] font-mono font-bold">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-xs text-[#6B5D50] font-mono">curator@aurasecrete.luxury</div>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-[#9E472A] group-hover:scale-110 transition-transform" aria-hidden="true" />
              </button>

              {/* Bidder 1 */}
              <button
                type="button"
                disabled={demoLoading}
                onClick={() => handleQuickLogin("alex@perfumecollector.id")}
                className="w-full text-left p-3.5 rounded-xl bg-[#F3ECE1] border border-[#DED1BF] hover:border-[#9E472A] hover:bg-[#EAE1D3] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    ALX
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#231B16] flex items-center gap-1.5">
                      <span>Alexander (Bidder #1)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold">
                        BIDDER
                      </span>
                    </div>
                    <div className="text-xs text-[#6B5D50] font-mono">alex@perfumecollector.id</div>
                  </div>
                </div>
                <User className="w-4 h-4 text-[#6B5D50] group-hover:text-indigo-600 transition-colors" aria-hidden="true" />
              </button>

              {/* Bidder 2 */}
              <button
                type="button"
                disabled={demoLoading}
                onClick={() => handleQuickLogin("clara@nicheparfums.com")}
                className="w-full text-left p-3.5 rounded-xl bg-[#F3ECE1] border border-[#DED1BF] hover:border-[#9E472A] hover:bg-[#EAE1D3] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    CLR
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#231B16] flex items-center gap-1.5">
                      <span>Clara (Bidder #2)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold">
                        BIDDER
                      </span>
                    </div>
                    <div className="text-xs text-[#6B5D50] font-mono">clara@nicheparfums.com</div>
                  </div>
                </div>
                <User className="w-4 h-4 text-[#6B5D50] group-hover:text-emerald-600 transition-colors" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 text-[11px] text-[#6B5D50] bg-white/70 p-3 rounded-xl border border-[#DED1BF]">
              💡 <span className="text-[#231B16] font-semibold">Alur Demo Pengujian:</span> Ajukan bid di akun Bidder 1 (fase commit mengirim hash saja), lalu buka akun Admin untuk memverifikasi bahwa server tidak pernah melihat nominal tawaran sebelum fase reveal!
            </div>
          </div>
        </div>
      )}

      {/* Crypto Explainer Modal */}
      {showCryptoModal && <CryptoExplainerModal onClose={() => setShowCryptoModal(false)} />}
    </>
  );
}