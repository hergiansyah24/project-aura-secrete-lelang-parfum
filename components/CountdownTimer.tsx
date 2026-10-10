"use client";

import React, { useEffect, useState } from "react";
import { Clock, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
  stage: "COMMIT" | "REVEAL" | "COMPLETED";
  onExpire?: () => void;
  compact?: boolean;
}

export function CountdownTimer({ targetDate, stage, onExpire, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  useEffect(() => {
    if (stage === "COMPLETED") return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, totalMs: difference });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, stage, onExpire]);

  if (stage === "COMPLETED") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Lelang Selesai & Terverifikasi</span>
      </div>
    );
  }

  const isReveal = stage === "REVEAL";
  const badgeColor = isReveal
    ? "bg-amber-950/60 border-amber-500/50 text-amber-300"
    : "bg-indigo-950/60 border-indigo-500/50 text-indigo-300";

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-medium ${badgeColor}`}>
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        <span>
          {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          {isReveal ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium text-amber-400">Fase Reveal Berjalan:</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-indigo-300">Batas Waktu Penawaran Segel:</span>
            </>
          )}
        </span>
        <span className="text-[11px] font-mono text-zinc-500">Auto-Sync</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 text-center shadow-inner">
          <div className="text-xl font-bold font-mono text-white">
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">Jam</div>
        </div>
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 text-center shadow-inner">
          <div className="text-xl font-bold font-mono text-white">
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">Menit</div>
        </div>
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 text-center shadow-inner">
          <div className={`text-xl font-bold font-mono ${timeLeft.totalMs < 60000 ? "text-rose-400 animate-pulse" : "text-amber-400"}`}>
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">Detik</div>
        </div>
      </div>
    </div>
  );
}

