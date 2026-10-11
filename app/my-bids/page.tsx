"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import { RevealBidModal } from "@/components/RevealBidModal";
import {
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  Trophy,
  AlertOctagon,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Download
} from "lucide-react";
import { downloadBidProofFile, getBidProofFromStorage } from "@/lib/client-crypto";

interface UserBidRecord {
  bid_id: number;
  commitment_hash: string;
  bid_status: "COMMITTED" | "REVEALED" | "TAMPERED_REJECTED";
  revealed_amount: number | null;
  revealed_nonce: string | null;
  committed_at: string;
  revealed_at: string | null;
  auction_id: number;
  auction_title: string;
  perfume_house: string;
  image_url: string;
  starting_price: number;
  current_stage: "COMMIT" | "REVEAL" | "COMPLETED";
  winner_id: number | null;
  winning_bid_amount: number | null;
  resultStatus: string;
  isWinner: boolean;
}

export function MyBidsPage() {
  const { user } = useAuth();
  const [bids, setBids] = useState<UserBidRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRevealAuction, setActiveRevealAuction] = useState<{
    id: number;
    title: string;
    starting_price: number;
    hash: string;
  } | null>(null);

  const fetchMyBids = async () => {
    try {
      const res = await fetch("/api/bids/my-bids");
      if (res.ok) {
        const data = await res.json();
        setBids(data.bids || []);
      }
    } catch (err) {
      console.error("Failed to load user bids:", err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const timer = setTimeout(() => {
    if (user) {
      void fetchMyBids();
    } else {
      setLoading(false);
    }
  }, 0);

  return () => clearTimeout(timer);
}, [user]);

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm">
            <Lock className="w-8 h-8 text-amber-400 mx-auto" />
            <h2 className="text-base font-bold text-zinc-100">Autentikasi Diperlukan</h2>
            <p className="text-xs text-zinc-400">
              Silakan login untuk memantau status segel dan hasil penawaran lelang Anda.
            </p>
            <Link
              href="/login"
              className="inline-block px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition-colors"
            >
              Masuk Sekarang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-indigo-400" />
              Riwayat Penawaran Tersegel Saya
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Catatan komitmen kriptografis, verifikasi status reveal, dan pengumuman pemenang
            </p>
          </div>

          <button
            onClick={() => fetchMyBids()}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Segarkan Status
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Memuat riwayat lelang...
          </div>
        ) : bids.length === 0 ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-zinc-200">Belum Ada Penawaran</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Anda belum menyegel penawaran pada parfum mana pun. Kunjungi katalog untuk mengikuti lelang langka yang sedang berlangsung.
            </p>
            <Link
              href="/"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              Jelajahi Katalog Lelang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((b) => {
              const isWin = b.isWinner;
              const isFraud = b.bid_status === "TAMPERED_REJECTED";
              const needsReveal = b.current_stage === "REVEAL" && b.bid_status === "COMMITTED";

              return (
                <div
                  key={b.bid_id}
                  className={`bg-zinc-900/80 border rounded-2xl p-5 sm:p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg ${
                    isWin
                      ? "border-amber-500/60 bg-gradient-to-r from-amber-950/30 to-zinc-900"
                      : isFraud
                      ? "border-rose-500/60 bg-rose-950/20"
                      : "border-zinc-800"
                  }`}
                >
                  {/* Left: Perfume info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={b.image_url}
                      alt={b.auction_title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-800"
                    />
                    <div className="space-y-1">
                      <div className="text-[11px] text-amber-400/90 font-mono">
                        {b.perfume_house}
                      </div>
                      <Link
                        href={`/auctions/${b.auction_id}`}
                        className="text-base font-serif font-bold text-zinc-100 hover:text-amber-300 transition-colors block"
                      >
                        {b.auction_title}
                      </Link>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                        <span>Fase Lelang: <strong className="text-zinc-200">{b.current_stage}</strong></span>
                        <span>•</span>
                        <span>Diserahkan: {new Date(b.committed_at).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Crypto Data */}
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 font-mono text-xs space-y-1.5 min-w-[280px]">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Komitmen Hash:</span>
                      <span className="text-indigo-300 truncate max-w-[150px]">
                        {b.commitment_hash.substring(0, 16)}...
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Nominal Bid Resmi:</span>
                      <span className="font-bold">
                        {b.revealed_amount
                          ? "Rp " + b.revealed_amount.toLocaleString("id-ID")
                          : "[TERSEGEL SAMPAI REVEAL]"}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Status Segel:</span>
                      <span
                        className={`font-semibold ${
                          b.bid_status === "REVEALED"
                            ? "text-emerald-400"
                            : b.bid_status === "TAMPERED_REJECTED"
                            ? "text-rose-400"
                            : "text-indigo-400"
                        }`}
                      >
                        {b.bid_status}
                      </span>
                    </div>
                  </div>

                  {/* Right: Outcome Status & Actions */}
                  <div className="flex flex-col sm:items-end justify-center gap-2">
                    {/* Outcome Badge */}
                    {isWin && (
                      <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>SELAMAT! ANDA MENANG LE LANG 🏆</span>
                      </div>
                    )}

                    {isFraud && (
                      <div className="px-3 py-1.5 rounded-xl bg-rose-950 border border-rose-500 text-rose-300 font-bold text-xs flex items-center gap-1.5">
                        <AlertOctagon className="w-4 h-4 text-rose-400" />
                        <span>REJECTED (MANIPULASI HASH)</span>
                      </div>
                    )}

                    {needsReveal && (
                      <button
                        onClick={() =>
                          setActiveRevealAuction({
                            id: b.auction_id,
                            title: b.auction_title,
                            starting_price: b.starting_price,
                            hash: b.commitment_hash,
                          })
                        }
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer animate-pulse"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Buka Segel Sekarang (Reveal)
                      </button>
                    )}

                    {!isWin && !isFraud && !needsReveal && (
                      <div className="text-xs text-zinc-400 font-medium">
                        {b.current_stage === "COMMIT" && "Penawaran terkunci aman di server"}
                        {b.current_stage === "REVEAL" && b.bid_status === "REVEALED" && "Berhasil di-reveal. Menunggu pemenang."}
                        {b.current_stage === "COMPLETED" && !b.isWinner && "Lelang selesai. Belum menang."}
                      </div>
                    )}

                    {/* Download local backup proof button */}
                    <button
                      onClick={() => {
                        const localProof = getBidProofFromStorage(b.auction_id);
                        if (localProof) {
                          downloadBidProofFile(localProof);
                        } else {
                          alert("Kunci bukti disimpan di perangkat/browser yang digunakan saat mengajukan bid.");
                        }
                      }}
                      className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Unduh Resi Bukti
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reveal Modal */}
      {activeRevealAuction && (
        <RevealBidModal
          auction={{
            id: activeRevealAuction.id,
            title: activeRevealAuction.title,
            starting_price: activeRevealAuction.starting_price,
          }}
          storedCommitmentHash={activeRevealAuction.hash}
          onClose={() => setActiveRevealAuction(null)}
          onSuccess={() => {
            setActiveRevealAuction(null);
            fetchMyBids();
          }}
        />
      )}
    </div>
  );
}

export default MyBidsPage;

