"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { CountdownTimer } from "@/components/CountdownTimer";
import { CommitBidModal } from "@/components/CommitBidModal";
import { RevealBidModal } from "@/components/RevealBidModal";
import { VerifyProofModal } from "@/components/VerifyProofModal";
import { useAuth } from "@/components/AuthContext";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  AlertOctagon,
  ArrowLeft,
  RefreshCw,
  Droplets,
  Trophy,
  ExternalLink,
  ShieldAlert
} from "lucide-react";

interface AuctionDetail {
  id: number;
  title: string;
  perfume_house: string;
  bottle_year: string;
  concentration: string;
  volume_ml: number;
  description: string;
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  image_url: string;
  starting_price: number;
  current_stage: "COMMIT" | "REVEAL" | "COMPLETED";
  commit_end_time: string;
  reveal_end_time: string;
  winner_id?: number | null;
  winner_username?: string | null;
  winning_bid_amount?: number | null;
  winning_bid_hash?: string | null;
}

interface BidLedgerItem {
  id: number;
  user_id: number;
  username: string;
  commitment_hash: string;
  status: string;
  committed_at: string;
  revealed_at?: string | null;
  public_revealed_amount?: number | null;
  public_revealed_nonce?: string | null;
}

function AuctionDetailContent() {
  const urlParams = useParams();
  const id = urlParams?.id as string;
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [bids, setBids] = useState<BidLedgerItem[]>([]);
  const [myBid, setMyBid] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const fetchAuction = async () => {
    try {
      const res = await fetch(`/api/auctions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAuction(data.auction);
        setBids(data.bids || []);
        setMyBid(data.myBid || null);
      }
    } catch (err) {
      console.error("Failed to load auction detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuction();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-400 font-mono gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Membuka vault lelang...
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm">
            <h2 className="text-base font-bold text-zinc-100">Koleksi Tidak Ditemukan</h2>
            <Link href="/" className="text-xs text-amber-400 hover:underline">
              Kembali ke Katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCommit = auction.current_stage === "COMMIT";
  const isReveal = auction.current_stage === "REVEAL";
  const isCompleted = auction.current_stage === "COMPLETED";

  const hasCommitted = Boolean(myBid);
  const isRevealed = myBid?.status === "REVEALED";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog Lelang
          </Link>
        </div>

        {/* Top Section: Photo + Essential Specs + Bidding Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Perfume Photo Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-[4/3] shadow-2xl">
              <img
                src={auction.image_url}
                alt={auction.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full bg-zinc-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono backdrop-blur-md">
                  {auction.perfume_house}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-zinc-300 font-mono bg-zinc-950/80 backdrop-blur-md p-3 rounded-2xl border border-zinc-800">
                <span>{auction.bottle_year}</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5" />
                  {auction.volume_ml} ml • {auction.concentration}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Auction Info & Bidding Control */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isCommit && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/90 border border-indigo-500/50 text-indigo-300 text-xs font-mono font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> FASE COMMIT TERSEGEL
                  </span>
                )}
                {isReveal && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 animate-pulse">
                    <KeyRound className="w-3 h-3" /> FASE PEMBUKAAN REVEAL
                  </span>
                )}
                {isCompleted && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> LELANG SELESAI
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100 leading-snug">
                {auction.title}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-300 mt-3 leading-relaxed">
                {auction.description}
              </p>
            </div>

            {/* Price & Timing Card */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-xs text-zinc-400 block mb-0.5">Starting Price (Harga Awal):</span>
                  <div className="text-2xl font-mono font-bold text-zinc-100">
                    Rp {auction.starting_price.toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-400 block mb-0.5">Total Partisipan:</span>
                  <div className="text-lg font-mono font-bold text-indigo-400 flex items-center gap-1.5 justify-end">
                    <Users className="w-4 h-4" />
                    <span>{bids.length} Bidder</span>
                  </div>
                </div>
              </div>

              {/* Countdown Component */}
              <div>
                <CountdownTimer
                  targetDate={isCommit ? auction.commit_end_time : auction.reveal_end_time}
                  stage={auction.current_stage}
                  onExpire={fetchAuction}
                />
              </div>

              {/* Completed Winner Announcement Box */}
              {isCompleted && auction.winner_username && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" /> Pemenang Resmi Terverifikasi:
                    </span>
                    <button
                      onClick={() => setShowVerifyModal(true)}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Audit Proof
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-zinc-200 font-bold">{auction.winner_username}</span>
                    <span className="text-emerald-400 font-bold">
                      Rp {(auction.winning_bid_amount || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {isCommit && (
                  <button
                    onClick={() => {
                      if (!user) {
                        window.location.href = "/login";
                      } else {
                        setShowCommitModal(true);
                      }
                    }}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    {hasCommitted
                      ? "Perbarui Komitmen Penawaran Segel (Hash)"
                      : "Ajukan Penawaran Tersegel (Fase Commit)"}
                  </button>
                )}

                {isReveal && (
                  <div>
                    {hasCommitted && !isRevealed ? (
                      <button
                        onClick={() => setShowRevealModal(true)}
                        className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                      >
                        <KeyRound className="w-4 h-4" /> Buka Segel Penawaran Anda Sekarang (Fase Reveal)
                      </button>
                    ) : isRevealed ? (
                      <div className="w-full py-3 rounded-2xl bg-zinc-800 text-emerald-400 font-bold text-xs text-center border border-zinc-700 flex items-center justify-center gap-2 font-mono">
                        <CheckCircle2 className="w-4 h-4" /> Penawaran Anda Telah Berhasil Di-reveal
                      </div>
                    ) : (
                      <div className="w-full py-3 rounded-2xl bg-zinc-900 text-zinc-400 text-xs text-center border border-zinc-800">
                        Fase Commit telah berakhir. Hanya bidder terdaftar yang dapat melakukan reveal.
                      </div>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <button
                    onClick={() => setShowVerifyModal(true)}
                    className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verifikasi Bukti Kriptografis Pemenang (Mathematical Audit)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Olfactory Pyramid (Piramida Aroma Parfum) */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Piramida Wewangian (Olfactory Pyramid)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <span className="text-amber-500 font-mono text-[11px] uppercase font-bold block mb-1">
                Top Notes (Aroma Pembuka)
              </span>
              <p className="text-zinc-300 leading-relaxed">{auction.top_notes}</p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <span className="text-amber-400 font-mono text-[11px] uppercase font-bold block mb-1">
                Heart / Middle Notes (Jantung Aroma)
              </span>
              <p className="text-zinc-300 leading-relaxed">{auction.heart_notes}</p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <span className="text-amber-300 font-mono text-[11px] uppercase font-bold block mb-1">
                Base Notes (Fondasi Aroma)
              </span>
              <p className="text-zinc-300 leading-relaxed">{auction.base_notes}</p>
            </div>
          </div>
        </div>

        {/* Public Cryptographic Ledger of Sealed Bids */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Ledger Komitmen Publik (Transparansi Anti-Kolusi)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Semua partisipan tercatat dengan komitmen hash masing-masing. Nominal hanya terungkap setelah fase reveal selesai.
              </p>
            </div>
            <div className="text-xs font-mono text-zinc-400">
              Total: {bids.length} Komitmen Terdaftar
            </div>
          </div>

          {bids.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              Belum ada komitmen penawaran yang diajukan untuk parfum ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
                    <th className="py-3 px-3">Bidder</th>
                    <th className="py-3 px-3">Commitment Hash (SHA-256)</th>
                    <th className="py-3 px-3">Status Segel</th>
                    <th className="py-3 px-3">Nominal Terbuka</th>
                    <th className="py-3 px-3">Waktu Commit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {bids.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-950/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-zinc-200">
                        {b.username}
                        {user?.id === b.user_id && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
                            Anda
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-indigo-300 font-mono text-[11px]">
                        <span title={b.commitment_hash} className="cursor-help">
                          {b.commitment_hash.substring(0, 20)}...{b.commitment_hash.substring(56)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === "REVEALED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : b.status === "TAMPERED_REJECTED"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-indigo-500/20 text-indigo-300"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-zinc-300">
                        {b.public_revealed_amount
                          ? `Rp ${b.public_revealed_amount.toLocaleString("id-ID")}`
                          : "[TERSEGEL SECARA KRIPTOGRAFIS]"}
                      </td>
                      <td className="py-3 px-3 text-zinc-400 text-[11px]">
                        {new Date(b.committed_at).toLocaleTimeString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCommitModal && (
        <CommitBidModal
          auction={{
            id: auction.id,
            title: auction.title,
            starting_price: auction.starting_price,
          }}
          onClose={() => setShowCommitModal(false)}
          onSuccess={() => {
            setShowCommitModal(false);
            fetchAuction();
          }}
        />
      )}

      {showRevealModal && (
        <RevealBidModal
          auction={{
            id: auction.id,
            title: auction.title,
            starting_price: auction.starting_price,
          }}
          storedCommitmentHash={myBid?.commitment_hash as string}
          onClose={() => setShowRevealModal(false)}
          onSuccess={() => {
            setShowRevealModal(false);
            fetchAuction();
          }}
        />
      )}

      {showVerifyModal && (
        <VerifyProofModal
          auction={{
            id: auction.id,
            title: auction.title,
            winning_bid_amount: auction.winning_bid_amount,
            winning_bid_hash: auction.winning_bid_hash,
            winner_username: auction.winner_username,
          }}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </div>
  );
}

