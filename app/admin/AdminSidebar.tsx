"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  EyeOff,
  Globe,
  LogOut,
  Search,
  Store,
  Terminal,
  User,
  Users,
  X,
} from "lucide-react";

/**
 * Sidebar dashboard admin.
 *
 * Catatan styling: globals.css membalik skala warna `zinc`/`amber` untuk tema terang,
 * sehingga di sini SEMUA warna memakai nilai hex eksplisit agar sidebar tetap gelap.
 * Palet: coklat tua #231B16 (teks utama website) + terracotta #9E472A (aksen brand).
 */

const BRAND_NAME = "Riggisa Parfume"; // ganti di sini jika nama brand berubah

export type AdminTab = "auctions" | "bids" | "monitoring" | "audit" | "users";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  counts: {
    auctions: number;
    bids: number;
    audit: number;
    users: number;
    flaggedUsers: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  user: { username: string; email: string; role: string };
  onLogout: () => void;
  /** Hanya berlaku di layar < 1024px (sidebar menjadi drawer). */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof Crown }[] = [
  { id: "auctions", label: "Manajemen Lelang", icon: Crown },
  { id: "bids", label: "Manajemen Bid", icon: Terminal },
  { id: "monitoring", label: "Monitor Zero-Knowledge", icon: EyeOff },
  { id: "audit", label: "Audit Log Siber", icon: Terminal },
  { id: "users", label: "Pengguna & Anti-Cheat", icon: Users },
];

const SHORTCUTS = [
  { href: "/", label: "Lihat Website", icon: Globe },
  { href: "/#katalog", label: "Katalog Publik", icon: Store },
  { href: "/profile", label: "Profil Saya", icon: User },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3ECE1]";

export function AdminSidebar({
  activeTab,
  onTabChange,
  counts,
  searchQuery,
  onSearchChange,
  user,
  onLogout,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Tutup drawer mobile dengan tombol Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onMobileClose]);

  const badgeFor = (id: AdminTab) => {
    if (id === "auctions") return { value: counts.auctions, danger: false, hint: "lelang" };
    if (id === "bids") return { value: counts.bids, danger: false, hint: "bid" };
    if (id === "audit") return { value: counts.audit, danger: false, hint: "entri log" };
    if (id === "users") {
      return counts.flaggedUsers > 0
        ? { value: counts.flaggedUsers, danger: true, hint: "pengguna ditandai" }
        : { value: counts.users, danger: false, hint: "pengguna" };
    }
    return { value: 0, danger: false, hint: "" };
  };

  const labelHidden = collapsed ? "lg:sr-only" : "";
  const itemLayout = collapsed ? "lg:justify-center lg:px-0" : "";

  return (
    <>
      {/* Latar gelap untuk drawer mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Sidebar dashboard admin"
        className={`fixed bottom-3 left-3 top-3 z-50 flex w-72 flex-col rounded-2xl bg-[#231B16] text-[#F3ECE1] shadow-2xl transition-all duration-300 lg:sticky lg:bottom-auto lg:left-auto lg:ml-3 lg:mt-3 lg:h-[calc(100vh-1.5rem)] lg:shrink-0 lg:self-start lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-[120%]"
        } ${collapsed ? "lg:w-[76px]" : "lg:w-72"}`}
      >
        {/* Tombol ciutkan / perluas (desktop) */}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          aria-expanded={!collapsed}
          className={`absolute -right-3 top-7 hidden h-6 w-6 place-items-center rounded-full border border-[#4A3B30] bg-[#33281F] text-[#F3ECE1] transition-colors hover:bg-[#9E472A] lg:grid ${focusRing}`}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>

        {/* Brand */}
        <div className={`flex items-center gap-3 px-4 pb-3 pt-5 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#9E472A]">
            <Crown className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className={`min-w-0 flex-1 leading-tight ${collapsed ? "lg:hidden" : ""}`}>
            <p className="truncate font-serif text-base font-semibold">{BRAND_NAME}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#BBAE9F]">
              Admin Vault
            </p>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Tutup menu admin"
            className={`grid h-8 w-8 place-items-center rounded-lg text-[#D8CCBE] hover:bg-[#33281F] lg:hidden ${focusRing}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Pencarian */}
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Buka pencarian"
            title="Cari"
            className={`mx-auto mt-2 hidden h-10 w-10 place-items-center rounded-xl border border-[#4A3B30] bg-[#2C221B] text-[#D8CCBE] hover:bg-[#33281F] lg:grid ${focusRing}`}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        <div className={`relative mx-4 mt-2 ${collapsed ? "lg:hidden" : ""}`}>
          <label htmlFor="admin-search" className="sr-only">
            Cari di dashboard admin
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A89A8A]"
            aria-hidden="true"
          />
          <input
            id="admin-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari lelang, pengguna, log…"
            maxLength={100}
            autoComplete="off"
            className="w-full rounded-xl border border-[#4A3B30] bg-[#2C221B] py-2.5 pl-9 pr-3 text-sm text-[#F3ECE1] placeholder:text-[#A89A8A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3ECE1]"
          />
        </div>

        {/* Navigasi */}
        <nav aria-label="Menu admin" className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          <p className={`px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#A89A8A] ${collapsed ? "lg:hidden" : ""}`}>
            Dashboard
          </p>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const badge = badgeFor(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  onMobileClose();
                }}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${focusRing} ${itemLayout} ${
                  active
                    ? "bg-[#9E472A] text-white"
                    : "text-[#D8CCBE] hover:bg-[#33281F] hover:text-white"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className={`min-w-0 flex-1 truncate ${labelHidden}`}>{item.label}</span>
                {badge.value > 0 && (
                  <span
                    aria-label={`${badge.value} ${badge.hint}`}
                    className={`grid min-w-[22px] place-items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      collapsed ? "lg:hidden" : ""
                    } ${
                      badge.danger
                        ? "bg-[#B42318] text-white"
                        : active
                          ? "bg-white/20 text-white"
                          : "bg-[#3A2E26] text-[#F3ECE1]"
                    }`}
                  >
                    {badge.value}
                  </span>
                )}
              </button>
            );
          })}

          <p className={`px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-widest text-[#A89A8A] ${collapsed ? "lg:hidden" : ""}`}>
            Pintasan
          </p>
          {collapsed && <div className="my-3 hidden border-t border-[#3A2E26] lg:block" />}

          {SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#D8CCBE] transition-colors hover:bg-[#33281F] hover:text-white ${focusRing} ${itemLayout}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className={`truncate ${labelHidden}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Kartu pengguna */}
        <div className="border-t border-[#3A2E26] p-3">
          <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? "lg:flex-col lg:p-1" : ""}`}>
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#9E472A] bg-[#9E472A]/30 text-sm font-bold"
              aria-hidden="true"
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 leading-tight ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-semibold">{user.username}</p>
              <p className="truncate text-xs text-[#BBAE9F]">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Keluar"
              title="Keluar"
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#D8CCBE] transition-colors hover:bg-[#33281F] hover:text-white ${focusRing}`}
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}