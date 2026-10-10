"use client";

import React, { useState } from "react";
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
  ExternalLink,
  Crown
} from "lucide-react";
import { CryptoExplainerModal } from "./CryptoExplainerModal";

export function Navbar() {
  const { user, logout, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleQuickLogin = async (identifier: string) => {
    setDemoLoading(true);
    const pass = identifier.includes("admin") ? "AdminSecret123!" : "BidderSecret123!";
    await login(identifier, pass);
    setDemoLoading(false);
    setShowDemoModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-zinc-800 to-amber-900/30 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/5 group-hover:border-amber-400/60 transition-all">
                <Crown className="w-5 h-5 text-amber-400 group-hover:rotate-6 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-serif tracking-widest font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                  AURA SECRÈTE
                </span>
                <span className="text-[10px] tracking-wider uppercase text-zinc-400 font-mono flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-500/80" /> Sealed-Bid Crypto Auction
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-zinc-300 hover:text-amber-400 transition-colors font-medium"
              >
                Katalog Lelang
              </Link>
              
              <button
                onClick={() => setShowCryptoModal(true)}
                className="text-sm text-zinc-300 hover:text-amber-400 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-400/80" />
                <span>Protokol Commit-Reveal</span>
              </button>

              {user && (
                <Link
                  href="/my-bids"
                  className="text-sm text-zinc-300 hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Penawaran Saya</span>
                </Link>
              )}

              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Admin Vault
                </Link>
              )}
            </nav>

            {/* Right Side: Security Pill & User Controls */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Quick Demo Switcher Button */}
              <button
                onClick={() => setShowDemoModal(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Pilih akun simulasi untuk demo/evaluasi"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Akun Demo (1-Click)</span>
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  {user.isFlagged && (
                    <div className="px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs flex items-center gap-1 font-mono animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>SUSPENDED</span>
                    </div>
                  )}

                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-zinc-200 leading-tight">
                        {user.username}
                      </span>
                      <span className="text-[10px] text-zinc-400 capitalize font-mono leading-tight">
                        {user.role}
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={() => logout()}
                    className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 transition-all cursor-pointer"
                    title="Keluar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-xs font-medium px-3.5 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20 transition-all"
                  >
                    Daftar Bidder
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setShowDemoModal(true)}
                className="text-xs p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400"
                title="Akun Demo"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-zinc-800 bg-zinc-950/95 px-4 pt-3 pb-6 space-y-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm py-2 text-zinc-300 hover:text-amber-400"
            >
              Katalog Lelang
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowCryptoModal(true);
              }}
              className="w-full text-left text-sm py-2 text-zinc-300 hover:text-amber-400 flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Protokol Commit-Reveal
            </button>
            {user && (
              <Link
                href="/my-bids"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm py-2 text-zinc-300 hover:text-amber-400"
              >
                Penawaran Saya
              </Link>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm py-2 text-amber-400 font-semibold"
              >
                Dashboard Admin Vault
              </Link>
            )}

            <div className="pt-3 border-t border-zinc-800">
              {user ? (
                <div className="flex items-center justify-between">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm text-zinc-200"
                  >
                    <User className="w-4 h-4 text-amber-400" />
                    <span>Profil ({user.username})</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="text-xs text-rose-400 flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Keluar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-xs py-2 rounded-lg bg-zinc-900 text-zinc-200"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-xs py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-amber-400 mb-2">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-lg font-bold font-serif">Simulasi Akun Demo (1-Click)</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Pilih akun pra-konfigurasi di bawah untuk memudahkan presentasi atau pengujian sistem tanpa perlu mengetik kredensial:
            </p>

            <div className="space-y-3">
              {/* Admin Button */}
              <button
                disabled={demoLoading}
                onClick={() => handleQuickLogin("curator@aurasecrete.luxury")}
                className="w-full text-left p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/30 hover:border-amber-400 hover:bg-zinc-950 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    ADM
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                      <span>Administrator Curateur</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        ROLE: ADMIN
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">curator@aurasecrete.luxury</div>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </button>

              {/* Bidder 1 */}
              <button
                disabled={demoLoading}
                onClick={() => handleQuickLogin("alex@perfumecollector.id")}
                className="w-full text-left p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-indigo-400/60 hover:bg-zinc-950 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    ALX
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                      <span>Alexander (Bidder #1)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        ROLE: BIDDER
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">alex@perfumecollector.id</div>
                  </div>
                </div>
                <User className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
              </button>

              {/* Bidder 2 */}
              <button
                disabled={demoLoading}
                onClick={() => handleQuickLogin("clara@nicheparfums.com")}
                className="w-full text-left p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-400/60 hover:bg-zinc-950 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    CLR
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                      <span>Clara (Bidder #2)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        ROLE: BIDDER
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">clara@nicheparfums.com</div>
                  </div>
                </div>
                <User className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>

            <div className="mt-5 text-[11px] text-zinc-400 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/80">
              💡 <span className="text-zinc-300 font-medium">Tips Presentasi:</span> Login sebagai Bidder 1 untuk mengajukan komitmen segel, lalu login sebagai Admin untuk memverifikasi bahwa nominal bid tersembunyi sepenuhnya dari server!
            </div>
          </div>
        </div>
      )}

      {/* Crypto Explainer Modal */}
      {showCryptoModal && <CryptoExplainerModal onClose={() => setShowCryptoModal(false)} />}
    </>
  );
}

