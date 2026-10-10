"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Droplets
} from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { CommitBidModal } from "./CommitBidModal";
import { RevealBidModal } from "./RevealBidModal";
import { VerifyProofModal } from "./VerifyProofModal";
import { useAuth } from "./AuthContext";

export interface AuctionItem {
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
  bidder_count?: number;
  revealed_bidder_count?: number;
  winner_id?: number | null;
  winner_username?: string | null;
  winning_bid_amount?: number | null;
  winning_bid_hash?: string | null;
  myBid?: {
    hasCommitted: boolean;
    commitmentHash: string | null;
    status: string | null;
    revealedAmount: number | null;
  };
}

export function AuctionCard({
  auction,
  onRefresh,
}: {
  auction: AuctionItem;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const isCommit = auction.current_stage === "COMMIT";
  const isReveal = auction.current_stage === "REVEAL";
  const isCompleted = auction.current_stage === "COMPLETED";

  const myBid = auction.myBid;
  const hasCommitted = Boolean(myBid?.hasCommitted);
  const isRevealed = myBid?.status === "REVEALED";

  return (
    <>
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300 flex flex-col group shadow-xl hover:shadow-2xl hover:shadow-black/60">
        {/* Perfume Image Banner with Stage Badge */}
        <div className="relative h-64 w-full overflow-hidden bg-zinc-950">
          <img
            src={auction.image_url}
            alt={auction.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-100"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

          {/* Stage Badge on Top Left */}
          <div className="absolute top-3.5 left-3.5">
            {isCommit && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-lg font-mono">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                FASE COMMIT (SEALED)
              </span>
            )}
            {isReveal && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg font-mono animate-pulse">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                FASE REVEAL (BUKA SEGEL)
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-lg font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                FINALIZED (SELESAI)
              </span>
            )}
          </div>

          {/* Perfume House on Top Right */}
          <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-zinc-300 text-[11px] font-medium backdrop-blur-md">
            {auction.perfume_house}
          </div>

          {/* Bottle Year & Concentration at Bottom */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-zinc-300 font-mono">
            <span className="bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
              {auction.bottle_year}
            </span>
            <span className="text-amber-400/90 flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              {auction.volume_ml}ml • {auction.concentration}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <Link
              href={`/auctions/${auction.id}`}
              className="group-hover:text-amber-400 transition-colors"
            >
              <h3 className="text-lg font-serif font-bold text-zinc-100 line-clamp-1 leading-snug">
                {auction.title}
              </h3>
            </Link>

            <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
              {auction.description}
            </p>

            {/* Olfactory Pyramid Accordion / Notes Preview */}
            <div className="mt-3.5 pt-3 border-t border-zinc-800/80 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="text-amber-500 font-mono text-[10px] uppercase font-bold shrink-0">
                  Top:
                </span>
                <span className="text-zinc-400 truncate">{auction.top_notes}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="text-amber-400 font-mono text-[10px] uppercase font-bold shrink-0">
                  Heart:
                </span>
                <span className="text-zinc-400 truncate">{auction.heart_notes}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="text-amber-300 font-mono text-[10px] uppercase font-bold shrink-0">
                  Base:
                </span>
                <span className="text-zinc-400 truncate">{auction.base_notes}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Bidder Stats */}
          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/90 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Starting Price:</span>
              <span className="text-sm font-bold font-mono text-zinc-100">
                Rp {auction.starting_price.toLocaleString("id-ID")}
              </span>
            </div>

            {isCompleted && auction.winning_bid_amount && (
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-800">
                <span className="text-emerald-400 font-medium">Tawaran Menang Terverifikasi:</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  Rp {auction.winning_bid_amount.toLocaleString("id-ID")}
                </span>
              </div>
            )}

            {/* Bidder Participation Stats */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1.5 border-t border-zinc-800/80">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {auction.bidder_count || 0} Bidder Tersegel
                </span>
              </span>
              {isReveal && (
                <span className="text-amber-400 font-mono">
                  {auction.revealed_bidder_count || 0} Di-reveal
                </span>
              )}
            </div>
          </div>

          {/* Countdown Timer */}
          <div>
            <CountdownTimer
              targetDate={isCommit ? auction.commit_end_time : auction.reveal_end_time}
              stage={auction.current_stage}
              onExpire={onRefresh}
            />
          </div>

          {/* Personal Bidder Status Pill */}
          {user && hasCommitted && (
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono">
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Status Penawaran Anda:
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isRevealed
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isReveal
                      ? "bg-amber-500/20 text-amber-300 animate-pulse"
                      : "bg-indigo-500/20 text-indigo-300"
                  }`}
                >
                  {isRevealed
                    ? "REVEALED (Rp " + (myBid?.revealedAmount?.toLocaleString("id-ID") || "") + ")"
                    : isReveal
                    ? "ACTION REQUIRED: REVEAL SEGERA"
                    : "COMMITTED (TERSEGEL)"}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                Hash: {myBid?.commitmentHash}
              </div>
            </div>
          )}

          {/* Actions Button */}
          <div className="pt-1">
            {isCommit && (
              <button
                onClick={() => {
                  if (!user) {
                    window.location.href = "/login";
                  } else {
                    setShowCommitModal(true);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                {hasCommitted ? "Perbarui Penawaran Tersegel (Commit)" : "Ajukan Penawaran Tersegel"}
              </button>
            )}

            {isReveal && (
              <div>
                {hasCommitted && !isRevealed ? (
                  <button
                    onClick={() => setShowRevealModal(true)}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Buka Segel Penawaran (Reveal)
                  </button>
                ) : isRevealed ? (
                  <div className="w-full py-2 rounded-xl bg-zinc-800 text-zinc-300 font-medium text-xs text-center border border-zinc-700 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Penawaran Anda Sudah Di-reveal
                  </div>
                ) : (
                  <div className="w-full py-2 rounded-xl bg-zinc-800/60 text-zinc-400 font-medium text-xs text-center border border-zinc-800">
                    Fase Commit Telah Ditutup
                  </div>
                )}
              </div>
            )}

            {isCompleted && (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verifikasi Bukti Pemenang
              </button>
            )}

            {/* View Details Link */}
            <div className="mt-2 text-center">
              <Link
                href={`/auctions/${auction.id}`}
                className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-400 transition-colors"
              >
                <span>Lihat Informasi & Audit Lengkap</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

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
            onRefresh();
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
          storedCommitmentHash={myBid?.commitmentHash}
          onClose={() => setShowRevealModal(false)}
          onSuccess={() => {
            setShowRevealModal(false);
            onRefresh();
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
    </>
  );
}

