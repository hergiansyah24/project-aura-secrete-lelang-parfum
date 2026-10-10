"use client";

import React, { useState } from "react";
import { X, ShieldCheck, CheckCircle2, Lock, Cpu, Sparkles } from "lucide-react";
import { computeClientCommitment } from "@/lib/client-crypto";

interface VerifyProofModalProps {
  auction: {
    id: number;
    title: string;
    winning_bid_amount?: number | null;
    winning_bid_hash?: string | null;
    winner_username?: string | null;
  };
  revealedNonce?: string | null;
  onClose: () => void;
}

export function VerifyProofModal({ auction, revealedNonce, onClose }: VerifyProofModalProps) {
  const [recomputedHash, setRecomputedHash] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [isMatch, setIsMatch] = useState<boolean | null>(null);

  const fallbackNonce =
    revealedNonce || "4a9f1165bc938b81d77a06f36402ec94c158bd31ffb91a72983da608c0ef95b7";

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const hash = await computeClientCommitment(
        auction.id,
        auction.winning_bid_amount || 0,
        fallbackNonce
      );
      setRecomputedHash(hash);
      const match = hash.toLowerCase() === (auction.winning_bid_hash || "").toLowerCase();
      setIsMatch(match);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1.5 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-lg font-bold font-serif text-zinc-100">
            Audit Bukti Kriptografis Pemenang Lelang
          </h3>
        </div>
        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
          Verifikasi independen anti-kolusi pada lelang <strong className="text-zinc-200">{auction.title}</strong>.
        </p>

        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-xs font-mono">
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400 font-sans">Pemenang Sah:</span>
            <span className="text-amber-400 font-bold font-sans">
              {auction.winner_username || "Bidder #2 (Alexander)"}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-400 font-sans">Nominal Penawaran Menang:</span>
            <span className="text-emerald-400 font-bold">
              Rp {(auction.winning_bid_amount || 0).toLocaleString("id-ID")}
            </span>
          </div>

          <div className="flex flex-col gap-1 border-b border-zinc-800 pb-2">
            <span className="text-zinc-400 font-sans text-[11px]">Winning Nonce (Kunci Pembuka):</span>
            <span className="text-amber-300 text-[10px] break-all">{fallbackNonce}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-zinc-400 font-sans text-[11px]">Hash Komitmen Terkunci di Database:</span>
            <span className="text-indigo-300 text-[10px] break-all">
              {auction.winning_bid_hash || "Belum tercatat"}
            </span>
          </div>
        </div>

        {recomputedHash && (
          <div className="mt-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-sans">Hasil Hash Browser Anda:</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  isMatch ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {isMatch ? "MATHEMATICALLY PROVEN MATCH ✅" : "HASH MISMATCH ❌"}
              </span>
            </div>
            <div className="text-[10px] text-emerald-300 break-all">{recomputedHash}</div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            {verifying ? "Menghitung SHA-256..." : "Hitung Ulang Hash di Browser (W3C Crypto)"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

