"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { AuctionCard, type AuctionItem } from "@/components/AuctionCard";

type LoadStatus = "loading" | "ready" | "error";

export function FeaturedAuction({
  imageSrc = "/landing/hero-perfume.webp",
}: {
  imageSrc?: string;
}) {
  const [list, setList] = useState<AuctionItem[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadAuctions = async () => {
      try {
        const response = await fetch("/api/auctions?sortBy=ending_soon", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setList(data.auctions || []);
        setStatus("ready");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setStatus("error");
      }
    };

    void loadAuctions();
    return () => controller.abort();
  }, [reloadKey]);

  const items = useMemo(() => {
    const active = list.filter(
      (auction) =>
        auction.current_stage === "COMMIT" ||
        auction.current_stage === "REVEAL",
    );
    return active.length ? active : list;
  }, [list]);
  const safeIndex = items.length ? index % items.length : 0;
  const auction = items[safeIndex] ?? null;

  const refresh = useCallback(async () => {
    setReloadKey((key) => key + 1);
  }, []);
  const prev = () => setIndex((current) => (current - 1 + items.length) % items.length);
  const next = () => setIndex((current) => (current + 1) % items.length);

  return (
    <section
      id="lelang-unggulan"
      aria-label="Lelang unggulan"
      className="relative isolate overflow-hidden rounded-[1.75rem] text-white"
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        sizes="(min-width: 1280px) 1200px, 100vw"
        className="object-cover object-[70%_50%] -z-20"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1B1511]/95 via-[#1B1511]/80 to-[#1B1511]/40" />
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center p-6 sm:p-10 lg:p-12 min-h-[26rem]">
        <div className="space-y-4">
          <div className="text-sm text-white/80">Lelang Unggulan</div>
          <h2 className="font-serif font-bold uppercase text-4xl sm:text-5xl leading-[0.95] tracking-tight">
            Satu botol,
            <br />
            satu penawaran
            <br />
            tersegel.
          </h2>
          <p className="max-w-sm text-sm sm:text-base leading-relaxed text-white/80">
            Lelang parfum langka dengan mekanisme sealed-bid yang aman dan
            transparan.
          </p>
          <Link
            href="#katalog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FDFBF8] text-[#1E1A17] hover:bg-white text-sm font-medium transition-colors"
          >
            Lihat Semua Lelang <ArrowRight className="w-4 h-4" />
          </Link>
          {items.length > 1 && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={prev}
                aria-label="Lelang sebelumnya"
                className="w-11 h-11 rounded-full bg-[#9B512F] hover:bg-[#7F3F22] grid place-items-center transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                aria-label="Lelang berikutnya"
                className="w-11 h-11 rounded-full bg-[#FDFBF8] text-[#1E1A17] hover:bg-white grid place-items-center transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-white/70">
                {safeIndex + 1} / {items.length}
              </span>
            </div>
          )}
        </div>
        <div className="min-h-[14rem]">
          {status === "loading" && (
            <div className="min-h-[14rem] grid place-items-center text-white/80">
              <div className="flex items-center gap-2 text-xs font-mono">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memuat lelang unggulan...
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="rounded-2xl border border-white/20 bg-black/25 backdrop-blur p-8 text-center space-y-3">
              <p className="text-sm text-white/80">
                Lelang unggulan gagal dimuat.
              </p>
              <button
                onClick={refresh}
                className="inline-flex items-center gap-2 text-sm text-white underline"
              >
                <RefreshCw className="w-4 h-4" />
                Coba lagi
              </button>
            </div>
          )}
          {status === "ready" && !auction && (
            <div className="rounded-2xl border border-white/20 bg-black/25 backdrop-blur p-8 text-center space-y-3">
              <h3 className="font-semibold">Belum ada lelang aktif</h3>
              <p className="text-sm text-white/80">
                Lelang baru akan muncul di sini begitu dibuka.
              </p>
            </div>
          )}
          {status === "ready" && auction && (
            <AuctionCard key={auction.id} auction={auction} onRefresh={refresh} />
          )}
        </div>
      </div>
    </section>
  );
}
