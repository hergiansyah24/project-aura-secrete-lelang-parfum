"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { AuctionCard, AuctionItem } from "@/components/AuctionCard";
import { BrandCards } from "@/components/landing/BrandCards";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { FeaturedAuction } from "@/components/landing/FeaturedAuction";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SecuritySection } from "@/components/landing/SecuritySection";
import "@/components/landing/landing.css";
import {
  Lock,
  Key,
  Search,
  Sparkles,
  RefreshCw,
  Terminal,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  const fetchAuctions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stageFilter && stageFilter !== "ALL") params.set("stage", stageFilter);
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/auctions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAuctions(data.auctions || []);
      }
    } catch (err) {
      console.error("Failed to load auctions:", err);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, sortBy]);

  useEffect(() => {
  const interval = setInterval(() => {
    fetchAuctions();
  }, 10000);

  return () => clearInterval(interval);
}, [fetchAuctions]);

  // Auto poll every 10 seconds to keep countdown & stages fresh
  useEffect(() => {
  const controller = new AbortController();

  const loadAuctions = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stageFilter && stageFilter !== "ALL") {
        params.set("stage", stageFilter);
      }
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/auctions?${params.toString()}`, {
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        setAuctions(data.auctions || []);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Failed to load auctions:", err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  void loadAuctions();

  return () => controller.abort();
}, [search, stageFilter, sortBy]);

  const commitCount = auctions.filter((a) => a.current_stage === "COMMIT").length;
  const revealCount = auctions.filter((a) => a.current_stage === "REVEAL").length;
  const completedCount = auctions.filter((a) => a.current_stage === "COMPLETED").length;

  return (
    <div className="lp min-h-screen flex flex-col font-sans">
      <div className="lp-top">
        <Navbar />
        <Hero />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 -mt-24">
        <div className="lp-panel space-y-3 sm:space-y-4">
          <BrandCards />
          <FeaturedAuction />
        </div>
      </div>

      {/* Main Catalog Section */}
      <main id="katalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 w-full">
        {/* Search, Filter, and Sorting Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Stage Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setStageFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                stageFilter === "ALL"
                  ? "bg-amber-500 text-zinc-950 font-bold shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Semua Koleksi ({auctions.length})
            </button>
            <button
              onClick={() => setStageFilter("COMMIT")}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                stageFilter === "COMMIT"
                  ? "bg-indigo-600 text-white font-bold shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Lock className="w-3 h-3 text-indigo-400" />
              Fase Commit ({commitCount})
            </button>
            <button
              onClick={() => setStageFilter("REVEAL")}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                stageFilter === "REVEAL"
                  ? "bg-amber-500 text-zinc-950 font-bold shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Key className="w-3 h-3" />
              Fase Reveal ({revealCount})
            </button>
            <button
              onClick={() => setStageFilter("COMPLETED")}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                stageFilter === "COMPLETED"
                  ? "bg-emerald-600 text-white font-bold shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Selesai ({completedCount})
            </button>
          </div>

          {/* Search & Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari parfum atau fragrance house..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="newest">Koleksi Terbaru</option>
              <option value="ending_soon">Batas Waktu Terdekat</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
            </select>

            <button
              onClick={() => fetchAuctions()}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-zinc-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auction Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-xs font-mono">Memuat vault lelang terenkripsi...</span>
          </div>
        ) : auctions.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-zinc-200">Tidak Ada Lelang yang Cocok</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Coba sesuaikan kata kunci pencarian atau ganti filter fase di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {auctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onRefresh={fetchAuctions}
              />
            ))}
          </div>
        )}

        {/* Live Academic/Cyber Security Explainer Banner */}
        <section className="mt-16 sm:mt-24 p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Pemeriksaan Integritas Sistem & Kriptografi Aktif</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Prepared Statements: 100% Parameterized (Anti SQLi)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed">
            <div>
              <strong className="text-zinc-200 block mb-1">Pre-Image Resistance (SHA-256):</strong>
              Secara matematis mustahil merekayasa balik nominal bid dari hash yang tersimpan. Admin tidak memiliki celah kolusi karena data nominal tidak tersimpan di server selama fase commit.
            </div>
            <div>
              <strong className="text-zinc-200 block mb-1">Defense in Depth (Cyber Defense):</strong>
              Rate limiting membatasi serangan brute-force dan distributed denial of service. Validasi tipe data dan sanitasi string mencegah injection attack.
            </div>
            <div>
              <strong className="text-zinc-200 block mb-1">Data-at-Rest Privacy (AES-256-GCM):</strong>
              Data pribadi bidder (nomor kontak, alamat pengiriman) dienkripsi secara simetris dengan authenticated tag. Hanya didekripsi ketika pengguna yang sah masuk ke sesi.
            </div>
          </div>
        </section>
      </main>

      <div className="space-y-20 lg:space-y-28 py-20 lg:py-28">
        <HowItWorks />
        <SecuritySection />
        <ClosingCta />
      </div>
      <LandingFooter />
    </div>
  );
}
