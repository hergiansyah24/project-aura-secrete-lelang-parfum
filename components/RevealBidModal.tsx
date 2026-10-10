"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  KeyRound,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  FileUp,
  Flame,
  Info
} from "lucide-react";
import { getBidProofFromStorage, BidProof } from "@/lib/client-crypto";

interface RevealBidModalProps {
  auction: {
    id: number;
    title: string;
    starting_price: number;
  };
  storedCommitmentHash?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RevealBidModal({
  auction,
  storedCommitmentHash,
  onClose,
  onSuccess,
}: RevealBidModalProps) {
  const [bidAmount, setBidAmount] = useState<number | "">("");
  const [nonce, setNonce] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<Record<string, unknown> | null>(null);
  const [tamperSimulation, setTamperSimulation] = useState(false);

  // Auto-fill from local storage on mount
  useEffect(() => {
    const proof = getBidProofFromStorage(auction.id);
    if (proof) {
      setBidAmount(proof.bidAmount);
      setNonce(proof.nonce);
    }
  }, [auction.id]);

  // Handle uploaded JSON proof file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const receipt: BidProof = parsed.receipt || parsed;
        if (receipt.bidAmount && receipt.nonce) {
          setBidAmount(Number(receipt.bidAmount));
          setNonce(receipt.nonce);
          setError(null);
        } else {
          setError("File JSON tidak memiliki struktur bukti penawaran yang valid.");
        }
      } catch {
        setError("Format file JSON rusak.");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bidAmount || isNaN(Number(bidAmount))) {
      setError("Nominal penawaran harus diisi.");
      return;
    }

    if (!nonce || nonce.trim().length === 0) {
      setError("Secret Nonce harus diisi untuk membuka segel.");
      return;
    }

    // Tamper Simulation mode: intentionally alter the bid amount slightly to demonstrate Anti-Cheat flagging
    const finalBidAmount = tamperSimulation ? Number(bidAmount) + 500000 : Number(bidAmount);

    setLoading(true);

    try {
      const res = await fetch("/api/bids/reveal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          auctionId: auction.id,
          bidAmount: finalBidAmount,
          nonce: nonce.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal membuka segel penawaran.");
        setLoading(false);
        return;
      }

      setSuccessResult(data);
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

        {!successResult ? (
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 text-amber-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-lg font-bold font-serif text-zinc-100">
                Buka Segel Penawaran (Fase Reveal)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Lelang untuk <strong className="text-zinc-200">{auction.title}</strong> telah memasuki fase pembukaan. Masukkan nominal asli dan secret nonce yang Anda gunakan saat menyegel penawaran.
            </p>

            {/* Stored Hash Banner */}
            {storedCommitmentHash && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                <span className="text-zinc-400 block mb-0.5">Hash Komitmen Tersimpan di Server:</span>
                <span className="text-indigo-300 break-all">{storedCommitmentHash}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <div className="font-semibold">Peringatan Keamanan:</div>
                  <div className="text-[11px] leading-relaxed">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Upload Option */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <FileUp className="w-4 h-4 text-amber-400" />
                  <span>Punya file tanda terima JSON?</span>
                </div>
                <label className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium cursor-pointer transition-colors border border-zinc-700">
                  Upload Resi Bukti
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Input Bid Amount */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nominal Penawaran Asli (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                    placeholder="Contoh: 75000000"
                    required
                  />
                </div>
              </div>

              {/* Input Secret Nonce */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Secret Nonce yang Digunakan Saat Commit
                </label>
                <input
                  type="text"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500 select-all"
                  placeholder="Paste 64-karakter hex nonce Anda"
                  required
                />
              </div>

              {/* Academic / Cybersecurity Simulation Toggle */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tamperSimulation}
                    onChange={(e) => setTamperSimulation(e.target.checked)}
                    className="mt-0.5 accent-amber-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      Simulasi Serangan Manipulasi Nilai (Demo Dosen / Anti-Cheat)
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                      Jika dicentang, sistem klien akan sengaja mengubah nilai bid sebesar Rp 500.000 untuk mendemonstrasikan bahwa server menolak hash yang tidak cocok dan otomatis memblokir akun pelaku!
                    </p>
                  </div>
                </label>
              </div>

              <div className="text-[11px] text-zinc-400 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Server akan menghitung ulang <code className="text-amber-400 font-mono">SHA-256(auctionId:nominal:nonce)</code> dan mencocokkannya dengan komitmen hash awal yang terkunci di server.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl text-zinc-950 font-bold text-xs tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                    tamperSimulation
                      ? "bg-rose-500 hover:bg-rose-400 shadow-rose-500/20 text-white"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20"
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Memvalidasi Kriptografi di Server...
                    </>
                  ) : tamperSimulation ? (
                    <>
                      <Flame className="w-4 h-4" /> Uji Serangan Manipulasi Hash (Trigger Anti-Cheat)
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Buka & Verifikasi Penawaran Resmi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Success Verified View */
          <div className="text-center py-3 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-serif text-zinc-100">
                Verifikasi Kriptografis Sukses! ✅
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Hash pembukaan Anda cocok 100% dengan komitmen awal di server. Penawaran resmi Anda telah dicatat untuk penentuan pemenang.
              </p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-400">Nominal Penawaran Terverifikasi:</span>
                <span className="text-emerald-400 font-bold">
                  Rp {Number(bidAmount).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex flex-col gap-1 border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-400 text-[10px]">Hash Komitmen Terverifikasi:</span>
                <span className="text-indigo-300 text-[10px] break-all">
                  {storedCommitmentHash || String(successResult.commitmentHash)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 text-[10px]">Status Integritas:</span>
                <span className="text-emerald-400 text-[10px] font-bold">VALID_CRYPTOGRAPHIC_MATCH</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup & Kembali ke Katalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

