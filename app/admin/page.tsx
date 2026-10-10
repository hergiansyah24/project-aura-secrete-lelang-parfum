"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import {
  Crown,
  Lock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Trash2,
  Trophy,
  RefreshCw,
  EyeOff,
  Terminal,
  Users,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Search,
  Filter
} from "lucide-react";

interface AdminAuction {
  id: number;
  title: string;
  perfume_house: string;
  starting_price: number;
  current_stage: "COMMIT" | "REVEAL" | "COMPLETED";
  commit_end_time: string;
  reveal_end_time: string;
  bidder_count: number;
  revealed_bidder_count: number;
  winner_username?: string | null;
  winning_bid_amount?: number | null;
}

interface AuditLog {
  id: number;
  user_id: number | null;
  user_email: string | null;
  username?: string | null;
  action: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  details: string;
  ip_address: string;
  created_at: string;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isFlagged: boolean;
  flagReason: string | null;
  fullName: string;
  phone: string;
  totalBids: number;
  createdAt: string;
  rawEncrypted: {
    fullName: string | null;
    phone: string | null;
  };
}

export function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"auctions" | "monitoring" | "audit" | "users">("auctions");

  // State
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filter state for logs
  const [logSeverity, setLogSeverity] = useState("ALL");

  // Create Auction Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAuction, setNewAuction] = useState({
    title: "",
    perfumeHouse: "",
    bottleYear: "Vintage Batch 2012",
    concentration: "Extrait de Parfum",
    volumeMl: 50,
    description: "",
    topNotes: "",
    heartNotes: "",
    baseNotes: "",
    imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    startingPrice: 50000000,
    commitDurationHours: 2,
    revealDurationHours: 2,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch auctions
      const resAuctions = await fetch("/api/auctions");
      if (resAuctions.ok) {
        const data = await resAuctions.json();
        setAuctions(data.auctions || []);
      }

      // Fetch audit logs
      const resLogs = await fetch(`/api/admin/audit-logs?severity=${logSeverity}`);
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAuditLogs(data.logs || []);
      }

      // Fetch users
      const resUsers = await fetch("/api/admin/users");
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user, logSeverity]);

  const handleForceStage = async (auctionId: number, targetStage: string) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "force_stage", current_stage: targetStage }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchData();
      } else {
        alert(data.error || "Gagal mengubah fase lelang.");
      }
    } catch {
      alert("Gagal menghubungi server.");
    }
  };

  const handleFinalize = async (auctionId: number) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}/finalize`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchData();
      } else {
        alert(data.error || "Gagal memfinalisasi lelang.");
      }
    } catch {
      alert("Gagal menghubungi server.");
    }
  };

  const handleDeleteAuction = async (auctionId: number) => {
    if (!confirm("Hapus lelang parfum ini beserta seluruh catatan biddings?")) return;
    try {
      const res = await fetch(`/api/auctions/${auctionId}`, { method: "DELETE" });
      if (res.ok) {
        setActionMessage("Lelang berhasil dihapus.");
        fetchData();
      }
    } catch {
      alert("Gagal menghapus lelang.");
    }
  };

  const handleToggleUserFlag = async (userId: number, currentFlag: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "toggle_flag",
          reason: currentFlag ? null : "Ditandai manual oleh Administrator",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchData();
      }
    } catch {
      alert("Gagal mengubah status pengguna.");
    }
  };

  const handleResetDemo = async () => {
    if (!confirm("Reset semua fase demo lelang ke status awal (Auction 1 = Commit, Auction 3 = Reveal)?")) return;
    try {
      const res = await fetch("/api/admin/demo-reset", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchData();
      }
    } catch {
      alert("Gagal me-reset demo.");
    }
  };

  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAuction),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setActionMessage(data.message);
        fetchData();
      } else {
        alert(data.error || "Gagal membuat lelang.");
      }
    } catch {
      alert("Gagal terhubung ke server.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">
          Memeriksa hak akses admin...
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm">
            <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-zinc-100">Akses Ditolak</h2>
            <p className="text-xs text-zinc-400">
              Halaman ini hanya dapat diakses oleh kurator administrator.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 w-full space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
                Dashboard Kurator & Keamanan Siber
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pusat kendali lelang tertutup, pengawasan zero-knowledge, dan audit forensik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDemo}
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Kembalikan status demo lelang ke kondisi presentasi awal"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Reset State Demo (Presentasi)
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Parfum Baru
            </button>
          </div>
        </div>

        {/* Action notification banner */}
        {actionMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-emerald-400 hover:text-white text-xs font-mono"
            >
              [Tutup]
            </button>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab("auctions")}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "auctions"
                ? "bg-amber-500 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/60"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Manajemen Lelang & Fase ({auctions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("monitoring")}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "monitoring"
                ? "bg-amber-500 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/60"
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Monitor Zero-Knowledge (Anti-Collusion)</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-amber-500 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/60"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Audit Log Siber ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-amber-500 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/60"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pengguna & Anti-Cheat ({usersList.length})</span>
          </button>
        </div>

        {/* TAB 1: AUCTIONS CRUD & PHASE CONTROL */}
        {activeTab === "auctions" && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-400">
              Kelola status dan kontrol fase commit-reveal lelang secara manual:
            </div>

            <div className="grid grid-cols-1 gap-4">
              {auctions.map((auc) => (
                <div
                  key={auc.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400">
                        {auc.perfume_house}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          auc.current_stage === "COMMIT"
                            ? "bg-indigo-500/20 text-indigo-300"
                            : auc.current_stage === "REVEAL"
                            ? "bg-amber-500/20 text-amber-300 animate-pulse"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        STAGE: {auc.current_stage}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-100 font-serif">
                      {auc.title}
                    </h3>

                    <div className="text-xs text-zinc-400 flex items-center gap-4">
                      <span>Mulai: Rp {auc.starting_price.toLocaleString("id-ID")}</span>
                      <span>•</span>
                      <span className="text-indigo-400">{auc.bidder_count} Bidder Berpartisipasi</span>
                    </div>

                    {auc.winner_username && (
                      <div className="text-xs text-emerald-400 font-mono">
                        🏆 Pemenang: {auc.winner_username} (Rp {(auc.winning_bid_amount || 0).toLocaleString("id-ID")})
                      </div>
                    )}
                  </div>

                  {/* Manual Phase Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {auc.current_stage === "COMMIT" && (
                      <button
                        onClick={() => handleForceStage(auc.id, "REVEAL")}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Buka fase reveal sekarang agar bidder bisa membuka penawaran"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Buka Fase Reveal
                      </button>
                    )}

                    {auc.current_stage === "REVEAL" && (
                      <button
                        onClick={() => handleFinalize(auc.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                        title="Kalkulasi tawaran valid tertinggi dan umumkan pemenang"
                      >
                        <Trophy className="w-3.5 h-3.5" /> Finalisasi Pemenang
                      </button>
                    )}

                    {auc.current_stage === "COMPLETED" && (
                      <button
                        onClick={() => handleForceStage(auc.id, "COMMIT")}
                        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Kembalikan ke Commit
                      </button>
                    )}

                    <Link
                      href={`/auctions/${auc.id}`}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Lihat Detail
                    </Link>

                    <button
                      onClick={() => handleDeleteAuction(auc.id)}
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-zinc-700 transition-colors cursor-pointer"
                      title="Hapus Lelang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ZERO-KNOWLEDGE MONITORING (SEALED BID VERIFICATION) */}
        {activeTab === "monitoring" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-indigo-300">
                  Prinsip Kriptografi Zero-Knowledge (Anti-Kolusi Administrator):
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Pada dashboard kurator ini, Anda dapat memantau setiap bidder yang menyerahkan komitmen, alamat IP, dan waktu commit. 
                  Namun demikian, berkat algoritma <strong>SHA-256 One-Way Hash</strong>, Anda <em>sama sekali tidak dapat melihat nominal tawaran</em> sampai peserta sendiri yang membuka kuncinya di fase reveal. Ini menjamin sistem bebas manipulasi dan anti-kongkalikong.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {auctions.map((auc) => (
                <div key={auc.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-zinc-100">{auc.title}</h4>
                      <span className="text-[10px] text-zinc-400 font-mono">Status: {auc.current_stage}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {auc.bidder_count} Partisipan
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span>Starting Price:</span>
                      <span className="font-mono text-zinc-200">
                        Rp {auc.starting_price.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Penawaran Di-reveal:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {auc.revealed_bidder_count} / {auc.bidder_count}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500 block mb-1">Status Enkripsi Nilai:</span>
                    {auc.current_stage === "COMMIT" ? (
                      <span className="text-indigo-400 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> [TERSEGEL - ADMIN TIDAK MEMILIKI AKSES KE NOMINAL]
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" /> [TERBUKA SECARA RESMI MELALUI REVEAL PROTOCOL]
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CYBER AUDIT LOG TRAIL */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                Log forensik aktivitas otentikasi, komitmen hash, validasi reveal, dan anomali keamanan:
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Severity:</span>
                <select
                  value={logSeverity}
                  onChange={(e) => setLogSeverity(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-mono cursor-pointer"
                >
                  <option value="ALL">Semua Tingkat (INFO + WARN + CRITICAL)</option>
                  <option value="INFO">INFO Saja</option>
                  <option value="WARN">WARN Saja</option>
                  <option value="CRITICAL">CRITICAL (Anomali/Fraud)</option>
                </select>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] bg-zinc-950/60">
                      <th className="py-3 px-3.5">ID & Waktu</th>
                      <th className="py-3 px-3.5">Aksi / Event</th>
                      <th className="py-3 px-3.5">Severity</th>
                      <th className="py-3 px-3.5">Pengguna / Email</th>
                      <th className="py-3 px-3.5">Rincian Forensik</th>
                      <th className="py-3 px-3.5">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className={`hover:bg-zinc-950/40 transition-colors ${
                          log.severity === "CRITICAL"
                            ? "bg-rose-950/20"
                            : log.severity === "WARN"
                            ? "bg-amber-950/10"
                            : ""
                        }`}
                      >
                        <td className="py-3 px-3.5 text-zinc-400 whitespace-nowrap text-[11px]">
                          #{log.id} • {new Date(log.created_at).toLocaleTimeString("id-ID")}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-zinc-200">
                          {log.action}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.severity === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                                : log.severity === "WARN"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-zinc-300">
                          {log.username || log.user_email || "System / Guest"}
                        </td>
                        <td className="py-3 px-3.5 text-zinc-400 text-[11px] max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="py-3 px-3.5 text-zinc-400 text-[11px]">
                          {log.ip_address}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USERS & ANTI-CHEAT SUSPENSIONS */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-400">
              Daftar pengguna terdaftar, status enkripsi AES-256-GCM, dan pembekuan akun anti-fraud:
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] bg-zinc-950/60">
                      <th className="py-3 px-3.5">User</th>
                      <th className="py-3 px-3.5">Role</th>
                      <th className="py-3 px-3.5">Nama (AES Decrypted)</th>
                      <th className="py-3 px-3.5">Kontak</th>
                      <th className="py-3 px-3.5">Status Keamanan</th>
                      <th className="py-3 px-3.5">Total Bids</th>
                      <th className="py-3 px-3.5 text-right">Aksi Kontrol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-950/40 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-zinc-200">{u.username}</div>
                          <div className="text-[10px] text-zinc-400">{u.email}</div>
                        </td>
                        <td className="py-3 px-3.5 uppercase text-[10px] text-amber-400 font-bold">
                          {u.role}
                        </td>
                        <td className="py-3 px-3.5 text-zinc-300 font-sans">
                          {u.fullName}
                        </td>
                        <td className="py-3 px-3.5 text-zinc-400">
                          {u.phone}
                        </td>
                        <td className="py-3 px-3.5">
                          {u.isFlagged ? (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-rose-300 text-[10px] font-bold">
                                ⚠️ FLAGGED (DIBLOKIR)
                              </span>
                              <div className="text-[9px] text-rose-300 max-w-[200px] truncate" title={u.flagReason || ""}>
                                {u.flagReason}
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                              AKTIF
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-indigo-400">
                          {u.totalBids} Bids
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => handleToggleUserFlag(u.id, u.isFlagged)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              u.isFlagged
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : "bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-300"
                            }`}
                          >
                            {u.isFlagged ? "Cabut Blokir" : "Flag Akun"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Tambah Lelang Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-zinc-100 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> Tambah Lelang Parfum Baru
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAuction} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1">Nama Parfum</label>
                  <input
                    type="text"
                    required
                    value={newAuction.title}
                    onChange={(e) => setNewAuction({ ...newAuction, title: e.target.value })}
                    placeholder="Contoh: Creed Vintage Tabarome 1975"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Rumah Parfum (House)</label>
                  <input
                    type="text"
                    required
                    value={newAuction.perfumeHouse}
                    onChange={(e) => setNewAuction({ ...newAuction, perfumeHouse: e.target.value })}
                    placeholder="Contoh: The House of Creed"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Tahun / Batch</label>
                  <input
                    type="text"
                    value={newAuction.bottleYear}
                    onChange={(e) => setNewAuction({ ...newAuction, bottleYear: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Konsentrasi</label>
                  <input
                    type="text"
                    value={newAuction.concentration}
                    onChange={(e) => setNewAuction({ ...newAuction, concentration: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Volume (ml)</label>
                  <input
                    type="number"
                    value={newAuction.volumeMl}
                    onChange={(e) => setNewAuction({ ...newAuction, volumeMl: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Deskripsi & Nilai Historis</label>
                <textarea
                  rows={2}
                  required
                  value={newAuction.description}
                  onChange={(e) => setNewAuction({ ...newAuction, description: e.target.value })}
                  placeholder="Informasi langka tentang botol dan bahan wewangian..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Top Notes</label>
                  <input
                    type="text"
                    value={newAuction.topNotes}
                    onChange={(e) => setNewAuction({ ...newAuction, topNotes: e.target.value })}
                    placeholder="Citrus, Ginger"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Heart Notes</label>
                  <input
                    type="text"
                    value={newAuction.heartNotes}
                    onChange={(e) => setNewAuction({ ...newAuction, heartNotes: e.target.value })}
                    placeholder="Tobacco, Jasmine"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Base Notes</label>
                  <input
                    type="text"
                    value={newAuction.baseNotes}
                    onChange={(e) => setNewAuction({ ...newAuction, baseNotes: e.target.value })}
                    placeholder="Leather, Ambergris"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Starting Price (IDR)</label>
                  <input
                    type="number"
                    step={1000000}
                    value={newAuction.startingPrice}
                    onChange={(e) => setNewAuction({ ...newAuction, startingPrice: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Durasi Commit (Jam)</label>
                  <input
                    type="number"
                    value={newAuction.commitDurationHours}
                    onChange={(e) => setNewAuction({ ...newAuction, commitDurationHours: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Durasi Reveal (Jam)</label>
                  <input
                    type="number"
                    value={newAuction.revealDurationHours}
                    onChange={(e) => setNewAuction({ ...newAuction, revealDurationHours: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                >
                  Publikasikan ke Vault Lelang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;

