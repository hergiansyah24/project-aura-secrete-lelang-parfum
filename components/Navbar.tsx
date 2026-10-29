"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import {
  AlertTriangle,
  Crown,
  Ellipsis,
  House,
  HelpCircle,
  KeyRound,
  ListChecks,
  LogOut,
  Shield,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  X,
} from "lucide-react";
import { CryptoExplainerModal } from "./CryptoExplainerModal";

// ---------------------------------------------------------------------------
// Pengaturan brand — ubah di sini jika nama / logo berganti
// ---------------------------------------------------------------------------
const BRAND_NAME = "Riggisa Parfume Secrète";
const LOGO_SRC = "/logo/icon.png"; // file: public/logo/icon.png

// ---------------------------------------------------------------------------
// Gaya bersama (efek kaca ala Apple: tembus pandang + blur + highlight tipis)
// ---------------------------------------------------------------------------
const glass =
  "border border-white/60 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_-14px_rgba(35,27,22,0.28),inset_0_1px_0_rgba(255,255,255,0.8)]";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9E472A]";

// Item menu desktop: kapsul halus yang menyala saat hover / aktif
const desktopItem =
  `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 xl:px-3.5 py-2 text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none cursor-pointer ${focusRing}`;
const desktopIdle = "text-[#231B16]/80 hover:bg-black/5 hover:text-[#231B16]";
const desktopActive = "bg-black/5 text-[#231B16]";

// Baris pada panel "Lainnya" (target sentuh minimal 44px)
const sheetRow =
  `flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[#231B16] transition-colors duration-200 motion-reduce:transition-none hover:bg-black/5 active:bg-black/10 ${focusRing}`;

const DOCK_ITEMS = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/#katalog", label: "Katalog", icon: Store },
  { href: "/#cara-kerja", label: "Cara Kerja", icon: ListChecks },
  { href: "/#keamanan", label: "Keamanan", icon: ShieldCheck },
];

export function Navbar() {
  const { user, logout, login } = useAuth();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tutup panel "Lainnya" dengan tombol Escape
  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  const handleQuickLogin = async (identifier: string) => {
    setDemoLoading(true);
    const pass = identifier.includes("admin") ? "AdminSecret123!" : "BidderSecret123!";
    await login(identifier, pass);
    setDemoLoading(false);
    setShowDemoModal(false);
  };

  const closeMore = () => setMoreOpen(false);
  const isHome = pathname === "/";

  const brand = (
    <>
      <Image
        src={LOGO_SRC}
        alt=""
        width={40}
        height={40}
        className="h-9 w-9 shrink-0 rounded-xl transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105"
      />
      <span className="whitespace-nowrap font-serif text-[13px] font-semibold uppercase tracking-[0.14em] text-[#231B16]">
        {BRAND_NAME}
      </span>
    </>
  );

  return (
    <>
      {/* =====================================================================
          DESKTOP (>= 1024px): bilah kaca mengambang berbentuk pil
          ===================================================================== */}
      <header className="sticky top-3 z-40 mt-3 hidden px-4 lg:block">
        <div
          className={`mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 rounded-full px-3 transition-all duration-300 motion-reduce:transition-none xl:px-4 ${glass} ${
            scrolled ? "bg-white/80" : "bg-white/70"
          }`}
        >
          {/* Kiri: brand (teks nama hanya dari 1280px agar menu tidak sesak) */}
          <Link
            href="/"
            aria-label={`${BRAND_NAME} — beranda`}
            className={`group flex shrink-0 items-center gap-2.5 rounded-full ${focusRing}`}
          >
            <Image
              src={LOGO_SRC}
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 rounded-xl transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105"
            />
            <span className="hidden whitespace-nowrap font-serif text-[13px] font-semibold uppercase tracking-[0.14em] text-[#231B16] xl:block">
              {BRAND_NAME}
            </span>
          </Link>

          {/* Tengah: menu utama */}
          <nav
            aria-label="Navigasi utama"
            className="flex min-w-0 flex-1 items-center justify-center gap-0.5 xl:gap-1"
          >
            <Link
              href="/"
              aria-current={isHome ? "page" : undefined}
              className={`${desktopItem} ${isHome ? desktopActive : desktopIdle}`}
            >
              Beranda
            </Link>
            <Link href="/#katalog" className={`${desktopItem} ${desktopIdle}`}>
              Katalog
            </Link>
            <Link href="/#cara-kerja" className={`${desktopItem} ${desktopIdle}`}>
              Cara Kerja
            </Link>
            <Link href="/#keamanan" className={`${desktopItem} ${desktopIdle}`}>
              Keamanan
            </Link>
            <button
              type="button"
              onClick={() => setShowCryptoModal(true)}
              className={`${desktopItem} ${desktopIdle}`}
            >
              <HelpCircle className="h-4 w-4 text-[#9E472A]" aria-hidden="true" />
              <span>Kripto ✦</span>
            </button>

            {user && (
              <Link
                href="/my-bids"
                aria-current={pathname === "/my-bids" ? "page" : undefined}
                className={`${desktopItem} ${
                  pathname === "/my-bids" ? desktopActive : desktopIdle
                } !text-[#9E472A]`}
              >
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Bid Saya</span>
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                aria-current={pathname === "/admin" ? "page" : undefined}
                className={`ml-1 shrink-0 whitespace-nowrap rounded-full border border-[#9E472A]/30 bg-[#9E472A]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9E472A] transition-colors duration-200 motion-reduce:transition-none hover:bg-[#9E472A]/20 ${focusRing}`}
              >
                Admin Vault
              </Link>
            )}
          </nav>

          {/* Kanan: aksi akun */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowDemoModal(true)}
              aria-label="Akun Demo"
              title="Pilih akun simulasi untuk demo"
              className={`${desktopItem} ${desktopIdle}`}
            >
              <KeyRound className="h-4 w-4 text-[#9E472A]" aria-hidden="true" />
              <span className={user ? "hidden 2xl:inline" : "hidden xl:inline"}>Akun Demo</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {user.isFlagged && (
                  <div className="flex animate-pulse items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-1 font-mono text-xs text-rose-800 motion-reduce:animate-none">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>SUSPENDED</span>
                  </div>
                )}

                <Link
                  href="/profile"
                  aria-label={`Profil ${user.username} (${user.role})`}
                  className={`flex items-center gap-2 rounded-full border border-black/10 bg-white/60 py-1 pl-1 pr-1 transition-colors duration-200 motion-reduce:transition-none hover:border-[#9E472A] 2xl:pr-3 ${focusRing}`}
                >
                  <div
                    className="grid h-8 w-8 place-items-center rounded-full border border-[#9E472A]/30 bg-[#9E472A]/15 text-xs font-bold text-[#9E472A]"
                    aria-hidden="true"
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden flex-col text-left leading-tight 2xl:flex">
                    <span className="text-xs font-semibold text-[#231B16]">{user.username}</span>
                    <span className="font-mono text-[10px] capitalize text-[#6B5D50]">
                      {user.role}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => logout()}
                  aria-label="Keluar"
                  title="Keluar"
                  className={`grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-black/10 bg-white/60 text-[#6B5D50] transition-colors duration-200 motion-reduce:transition-none hover:border-rose-300 hover:text-rose-700 ${focusRing}`}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login" className={`${desktopItem} ${desktopIdle}`}>
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className={`whitespace-nowrap rounded-full bg-[#9E472A] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 motion-reduce:transition-none hover:bg-[#843A21] hover:shadow-md active:scale-95 ${focusRing}`}
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          MOBILE / ANDROID (< 1024px)
          1) strip brand di atas (tanpa navigasi, ikut tergulung)
          2) dock navigasi kaca di bawah layar
          3) panel "Lainnya" yang naik dari dock
          ===================================================================== */}
      <div className="flex items-center px-4 py-3 lg:hidden">
        <Link
          href="/"
          aria-label={`${BRAND_NAME} — beranda`}
          className={`group flex items-center gap-2.5 rounded-xl ${focusRing}`}
        >
          {brand}
        </Link>
      </div>

      {/* Latar redup saat panel terbuka */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[2px] lg:hidden"
          onClick={closeMore}
          aria-hidden="true"
        />
      )}

      {/* Panel "Lainnya" */}
      <div
        id="mobile-more-panel"
        role="dialog"
        aria-label="Menu lainnya"
        aria-hidden={!moreOpen}
        inert={!moreOpen}
        className={`fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 max-h-[70vh] overflow-y-auto rounded-3xl bg-white/85 p-2 transition-all duration-300 motion-reduce:transition-none lg:hidden ${glass} ${
          moreOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        {user && (
          <div className="flex items-center gap-3 px-3 pb-2 pt-2">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#9E472A]/30 bg-[#9E472A]/15 text-sm font-bold text-[#9E472A]"
              aria-hidden="true"
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-[#231B16]">{user.username}</p>
              <p className="truncate font-mono text-[11px] capitalize text-[#6B5D50]">{user.role}</p>
            </div>
            {user.isFlagged && (
              <span className="flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 font-mono text-[11px] text-rose-800">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" /> SUSPENDED
              </span>
            )}
          </div>
        )}

        {user && (
          <Link
            href="/my-bids"
            onClick={closeMore}
            className={`${sheetRow} !text-[#9E472A]`}
          >
            <Shield className="h-[18px] w-[18px]" aria-hidden="true" />
            Bid Saya
          </Link>
        )}
        {user?.role === "admin" && (
          <Link href="/admin" onClick={closeMore} className={`${sheetRow} !text-[#9E472A]`}>
            <Crown className="h-[18px] w-[18px]" aria-hidden="true" />
            Admin Vault
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            closeMore();
            setShowCryptoModal(true);
          }}
          className={sheetRow}
        >
          <HelpCircle className="h-[18px] w-[18px] text-[#9E472A]" aria-hidden="true" />
          Protokol Commit-Reveal
        </button>
        <button
          type="button"
          onClick={() => {
            closeMore();
            setShowDemoModal(true);
          }}
          className={sheetRow}
        >
          <KeyRound className="h-[18px] w-[18px] text-[#9E472A]" aria-hidden="true" />
          Akun Demo
        </button>

        <div className="mt-1 border-t border-black/10 pt-2">
          {user ? (
            <>
              <Link href="/profile" onClick={closeMore} className={sheetRow}>
                <User className="h-[18px] w-[18px] text-[#9E472A]" aria-hidden="true" />
                Profil Saya
              </Link>
              <button
                type="button"
                onClick={() => {
                  closeMore();
                  void logout();
                }}
                className={`${sheetRow} !text-rose-700`}
              >
                <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                Keluar
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-1">
              <Link
                href="/login"
                onClick={closeMore}
                className={`grid min-h-11 place-items-center rounded-full border border-black/10 bg-white text-sm font-semibold text-[#231B16] ${focusRing}`}
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={closeMore}
                className={`grid min-h-11 place-items-center rounded-full bg-[#9E472A] text-sm font-bold text-white ${focusRing}`}
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Dock navigasi bawah */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <nav
          aria-label="Navigasi utama (seluler)"
          className={`mx-auto grid max-w-md grid-cols-5 rounded-3xl bg-white/80 p-1.5 ${glass}`}
        >
          {DOCK_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" && isHome && !moreOpen;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMore}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition-all duration-200 motion-reduce:transition-none active:scale-95 ${focusRing} ${
                  active ? "bg-[#9E472A]/12 text-[#9E472A]" : "text-[#231B16]/75"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-controls="mobile-more-panel"
            className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition-all duration-200 motion-reduce:transition-none active:scale-95 ${focusRing} ${
              moreOpen ? "bg-[#9E472A]/12 text-[#9E472A]" : "text-[#231B16]/75"
            }`}
          >
            {moreOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Ellipsis className="h-5 w-5" aria-hidden="true" />
            )}
            <span>Lainnya</span>
          </button>
        </nav>
      </div>

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