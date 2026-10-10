"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  Download,
  AlertCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import {
  generateClientNonce,
  computeClientCommitment,
  saveBidProofToStorage,
  downloadBidProofFile,
  BidProof
} from "@/lib/client-crypto";

interface CommitBidModalProps {
  auction: {
    id: number;
    title: string;
    starting_price: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function CommitBidModal({ auction, onClose, onSuccess }: CommitBidModalProps) {
  const [bidAmount, setBidAmount] = useState<number>(auction.starting_price + 5000000);
  const [nonce, setNonce] = useState<string>("");
  const [computedHash, setComputedHash] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedProof, setSubmittedProof] = useState<BidProof | null>(null);

  // Generate cryptographic nonce on mount
  useEffect(() => {
    setNonce(generateClientNonce());
  }, []);

  // Real-time calculation of SHA-256 Commitment Hash inside user browser
  useEffect(() => {
    if (bidAmount && nonce) {
      computeClientCommitment(auction.id, bidAmount, nonce).then((hash) => {
        setComputedHash(hash);
      });
    } else {
      setComputedHash("");
    }
  }, [auction.id, bidAmount, nonce]);

  const handleRegenerateNonce = () => {
    setNonce(generateClientNonce());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (bidAmount < auction.starting_price) {
      setError(`Nominal penawaran tidak boleh lebih rendah dari Starting Price (Rp ${auction.starting_price.toLocaleString("id-ID")}).`);
      return;
    }

    if (!computedHash || computedHash.length !== 64) {
      setError("Hash komitmen belum siap.");
      return;
    }

    setLoading(true);

    try {
      // CRITICAL CRYPTO STEP:
      // We only send auctionId and computedHash to the server!
      // bidAmount and nonce REMAIN LOCAL in user's device!
      const res = await fetch("/api/bids/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest", // CSRF defense
        },
        body: JSON.stringify({
          auctionId: auction.id,
          commitmentHash: computedHash,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengajukan komitmen penawaran.");
        setLoading(false);
        return;
      }

      // Persist proof to local storage
      const proof: BidProof = {
        auctionId: auction.id,
        auctionTitle: auction.title,
        bidAmount,
        nonce,
        commitmentHash: computedHash,
        timestamp: new Date().toISOString(),
      };

      saveBidProofToStorage(proof);
      setSubmittedProof(proof);
      onSuccess();
    } catch {
      setError("Gagal terhubung ke server lelang.");
    } finally {
      setLoading(false);
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

        {!submittedProof ? (
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 text-indigo-400">
              <Lock className="w-5 h-5" />
              <h3 className="text-lg font-bold font-serif text-zinc-100">
                Ajukan Penawaran Tersegel (Fase Commit)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Lelang untuk <strong className="text-zinc-200">{auction.title}</strong>. Nilai penawaran Anda akan disegel secara kriptografis menggunakan algoritma SHA-256.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input Bid Amount */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nominal Penawaran Anda (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min={auction.starting_price}
                    step={1000000}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Starting Price: Rp {auction.starting_price.toLocaleString("id-ID")}</span>
                  <span className="font-mono text-amber-400">
                    Rp {bidAmount ? bidAmount.toLocaleString("id-ID") : 0}
                  </span>
                </div>
              </div>

              {/* Client Generated Secret Nonce */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Secret Nonce (Kunci Acak 256-Bit)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateNonce}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Acak Ulang
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={nonce}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] font-mono text-zinc-400 select-all focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400 block mt-1">
                  Kunci rahasia ini di-generate oleh peramban Anda untuk mencegah dictionary attack.
                </span>
              </div>

              {/* Cryptographic Hash Preview */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Komitmen SHA-256 (Keluaran Browser)</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    256-bit Digest
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-zinc-950 border border-indigo-500/20 font-mono text-[11px] text-indigo-200 break-all select-all">
                  {computedHash || "Menghitung..."}
                </div>

                <div className="text-[11px] text-zinc-300 space-y-1">
                  <p className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Sparkles className="w-3.5 h-3.5" /> Jaminan Kerahasiaan Kriptografis:
                  </p>
                  <p className="text-zinc-400 text-[11px] leading-tight">
                    Hanya deret 64-karakter hash di atas yang dikirim ke database server. Nominal <strong className="text-zinc-200">Rp {bidAmount.toLocaleString("id-ID")}</strong> tidak pernah meninggalkan perangkat Anda selama fase lelang ini.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Mengirimkan Segel Komitmen...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Kunci & Ajukan Penawaran Tersegel
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Submission Success View */
          <div className="text-center py-3 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-serif text-zinc-100">
                Penawaran Tersegel Berhasil Diterima!
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Komitmen hash Anda telah dicatat di database server. Simpan kunci bukti rahasia ini untuk membuka penawaran pada Fase Reveal.
              </p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-400">Nominal Disimpan di Browser:</span>
                <span className="text-emerald-400 font-bold">
                  Rp {submittedProof.bidAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-400 text-[10px]">Commitment Hash Tersimpan di Server:</span>
                <span className="text-indigo-300 text-[10px] break-all">
                  {submittedProof.commitmentHash}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-400 text-[10px]">Secret Nonce Anda:</span>
                <span className="text-amber-400 text-[10px] break-all">
                  {submittedProof.nonce}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => downloadBidProofFile(submittedProof)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
              >
                <Download className="w-4 h-4 text-amber-400" /> Unduh Resi Bukti Kunci (.json)
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

