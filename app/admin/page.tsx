"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createAuctionSchema } from "@/schema";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthContext";
import { AdminSidebar, type AdminTab } from "@/components/AdminSidebar";
import {
  Crown,
  Lock,
  KeyRound,
  ShieldAlert,
  Plus,
  Trash2,
  Trophy,
  EyeOff,
  Terminal,
  Users,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Menu,
  Pencil,
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
interface AdminBid {
  id: number;
  auctionId: number;
  userId: number;
  commitmentHash: string;
  status: "COMMITTED" | "REVEALED" | "TAMPERED_REJECTED";
  revealedAmount: number | null;
  committedAt: string;
  revealedAt: string | null;
  auction: {
    title: string;
    currentStage: string;
  };
  user: {
    username: string;
  };
}
export function AdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("auctions");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data State
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [bids, setBids] = useState<AdminBid[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filter state for logs
  const [logSeverity, setLogSeverity] = useState("ALL");

  // Create Auction Modal State & Field Errors
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
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
    imageUrl:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    startingPrice: 50000000,
    commitDurationHours: 2,
    revealDurationHours: 2,
  });

  // Edit Auction Modal State & Field Errors (Untuk syarat CRUD Update)
  const [editingAuction, setEditingAuction] = useState<{
    id: number;
    title: string;
    perfumeHouse: string;
    startingPrice: number;
  } | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const resAuctions = await fetch("/api/auctions");
      if (resAuctions.ok) {
        const data = await resAuctions.json();
        setAuctions(data.auctions || []);
      }
      const resBids = await fetch("/api/admin/bids");
      if (resBids.ok) {
        const data = await resBids.json();
        setBids(data.bids || []);
      }

      const resLogs = await fetch(
        `/api/admin/audit-logs?severity=${logSeverity}`
      );
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAuditLogs(data.logs || []);
      }

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
  }, [logSeverity]);

  useEffect(() => {
    if (user?.role !== "admin") return;

    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user?.role, fetchData]);

  const handleForceStage = async (auctionId: number, targetStage: string) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "force_stage",
          current_stage: targetStage,
        }),
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
    if (!confirm("Hapus lelang parfum ini beserta seluruh catatan biddings?"))
      return;
    try {
      const res = await fetch(`/api/auctions/${auctionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActionMessage("Lelang berhasil dihapus dari PostgreSQL.");
        fetchData();
      }
    } catch {
      alert("Gagal menghapus lelang.");
    }
  };

  const handleDeleteBid = async (bidId: number) => {
    if (
      !confirm(
        "Hapus penawaran ini? Tindakan ini hanya tersedia untuk lelang yang sudah selesai."
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/admin/bids", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId }),
      });

      const data = await res.json();

      if (res.ok) {
        setActionMessage(data.message || "Penawaran berhasil dihapus.");
        fetchData();
      } else {
        alert(data.error || "Gagal menghapus penawaran.");
      }
    } catch {
      alert("Gagal menghubungi server.");
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
    if (
      !confirm(
        "Reset semua fase demo lelang ke status awal (Auction 1 = Commit, Auction 3 = Reveal)?"
      )
    )
      return;
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
    setCreateErrors({});

    // Validasi skema Zod & petakan error per field untuk bukti rubrik
    const parsed = createAuctionSchema.safeParse(newAuction);
    if (!parsed.success) {
      const fieldErrs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!fieldErrs[key]) {
          fieldErrs[key] = issue.message;
        }
      }
      setCreateErrors(fieldErrs);
      return;
    }

    let imageUrl = newAuction.imageUrl;

    if (selectedImage) {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const uploadRes = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setCreateErrors({
          imageUrl: uploadData.error || "Gagal mengunggah gambar.",
        });
        return;
      }

      imageUrl = uploadData.imageUrl;
    }

    try {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAuction,
          imageUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCreateErrors({});
        setActionMessage(data.message || "Lelang parfum baru berhasil dibuat.");
        fetchData();
      } else if (data.fieldErrors) {
        setCreateErrors(data.fieldErrors);
      } else {
        setCreateErrors({ form: data.error || "Gagal membuat lelang." });
      }
    } catch {
      setCreateErrors({ form: "Gagal terhubung ke server." });
    }
  };

  const handleUpdateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuction) return;
    setEditErrors({});

    const errs: Record<string, string> = {};
    if (editingAuction.title.trim().length < 3) {
      errs.title = "Nama parfum minimal harus 3 karakter.";
    }
    if (editingAuction.perfumeHouse.trim().length < 2) {
      errs.perfumeHouse = "Rumah parfum wajib diisi (minimal 2 karakter).";
    }
    if (
      !Number.isFinite(editingAuction.startingPrice) ||
      editingAuction.startingPrice < 100000
    ) {
      errs.startingPrice = "Starting price minimal Rp 100.000.";
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    try {
      const res = await fetch(`/api/auctions/${editingAuction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_details",
          title: editingAuction.title.trim(),
          perfume_house: editingAuction.perfumeHouse.trim(),
          perfumeHouse: editingAuction.perfumeHouse.trim(),
          starting_price: editingAuction.startingPrice,
          startingPrice: editingAuction.startingPrice,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingAuction(null);
        setActionMessage(
          data.message || "Data lelang berhasil diperbarui di PostgreSQL."
        );
        fetchData();
      } else if (data.fieldErrors) {
        setEditErrors(data.fieldErrors);
      } else {
        setEditErrors({ form: data.error || "Gagal memperbarui lelang." });
      }
    } catch {
      setEditErrors({ form: "Gagal menghubungi server." });
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matches = (values: Array<string | null | undefined>) =>
    values.some((v) => (v ?? "").toLowerCase().includes(normalizedQuery));

  const filteredAuctions = useMemo(
    () =>
      normalizedQuery
        ? auctions.filter((a) =>
            matches([
              a.title,
              a.perfume_house,
              a.winner_username,
              String(a.id),
            ])
          )
        : auctions,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auctions, normalizedQuery]
  );

  const filteredBids = useMemo(
  () =>
    normalizedQuery
      ? bids.filter((bid) =>
          matches([
            String(bid.id),
            String(bid.auctionId),
            bid.commitmentHash,
            bid.status,
            bid.auction.title,
            bid.auction.currentStage,
            bid.user.username,
          ])
        )
      : bids,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [bids, normalizedQuery]
);

  const filteredLogs = useMemo(
    () =>
      normalizedQuery
        ? auditLogs.filter((l) =>
            matches([
              l.action,
              l.details,
              l.username,
              l.user_email,
              l.ip_address,
            ])
          )
        : auditLogs,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auditLogs, normalizedQuery]
  );

  const filteredUsers = useMemo(
    () =>
      normalizedQuery
        ? usersList.filter((u) => matches([u.username, u.email, u.role]))
        : usersList,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usersList, normalizedQuery]
  );

  const flaggedUsersCount = usersList.filter((u) => u.isFlagged).length;

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          auctions: auctions.length,
          bids: bids.length,
          audit: auditLogs.length,
          users: usersList.length,
          flaggedUsers: flaggedUsersCount,
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={{ username: user.username, email: user.email, role: user.role }}
        onLogout={() => {
          void logout();
        }}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu admin"
            aria-expanded={sidebarOpen}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-2"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="font-serif text-base font-semibold">Admin Vault</span>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-8">
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
                  Pusat kendali lelang tertutup, pengawasan zero-knowledge, dan
                  audit forensik
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
                onClick={() => {
                  setCreateErrors({});
                  setShowCreateModal(true);
                }}
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
              onClick={() => setActiveTab("bids")}
              className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === "bids"
                  ? "bg-amber-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/60"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Manajemen Bid ({bids.length})</span>
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

          {loading && (
            <div className="text-xs text-zinc-500 font-mono">
              Memuat sinkronisasi data PostgreSQL...
            </div>
          )}

          {/* TAB 1: AUCTIONS CRUD & PHASE CONTROL */}
          {activeTab === "auctions" && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400">
                Kelola detail produk lelang (Create, Read, Update, Delete) dan
                kontrol fase commit-reveal secara manual:
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredAuctions.map((auc) => (
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
                        <span>
                          Mulai: Rp {auc.starting_price.toLocaleString("id-ID")}
                        </span>
                        <span>•</span>
                        <span className="text-indigo-400">
                          {auc.bidder_count} Bidder Berpartisipasi
                        </span>
                      </div>

                      {auc.winner_username && (
                        <div className="text-xs text-emerald-400 font-mono">
                          🏆 Pemenang: {auc.winner_username} (Rp{" "}
                          {(auc.winning_bid_amount || 0).toLocaleString("id-ID")}
                          )
                        </div>
                      )}
                    </div>

                    {/* Manual Phase & CRUD Controls */}
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

                      <button
                        onClick={() => {
                          setEditErrors({});
                          setEditingAuction({
                            id: auc.id,
                            title: auc.title,
                            perfumeHouse: auc.perfume_house,
                            startingPrice: auc.starting_price,
                          });
                        }}
                        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit Detail Lelang"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>

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

          {/* TAB: BIDS MANAGEMENT */}
          {activeTab === "bids" && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400">
                Daftar seluruh komitmen dan penawaran lelang yang tersimpan di PostgreSQL. Penghapusan bid hanya diizinkan untuk lelang yang sudah selesai (COMPLETED).
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] bg-zinc-950/60">
                        <th className="py-3 px-3.5">ID Bid</th>
                        <th className="py-3 px-3.5">Username Bidder</th>
                        <th className="py-3 px-3.5">Judul Lelang</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5">Commitment Hash</th>
                        <th className="py-3 px-3.5">Nominal Reveal</th>
                        <th className="py-3 px-3.5">Waktu Commit</th>
                        <th className="py-3 px-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {filteredBids.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-8 text-center text-zinc-500 font-sans"
                          >
                            Tidak ada data penawaran yang ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredBids.map((bid) => {
                          const isCompleted =
                            bid.auction?.currentStage === "COMPLETED";

                          return (
                            <tr
                              key={bid.id}
                              className="hover:bg-zinc-950/40 transition-colors"
                            >
                              <td className="py-3 px-3.5 text-zinc-400">
                                #{bid.id}
                              </td>
                              <td className="py-3 px-3.5 font-bold text-zinc-200">
                                {bid.user?.username || `User #${bid.userId}`}
                              </td>
                              <td className="py-3 px-3.5 font-sans text-zinc-300 max-w-[200px] truncate" title={bid.auction?.title}>
                                {bid.auction?.title || `Auction #${bid.auctionId}`}
                              </td>
                              <td className="py-3 px-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    bid.status === "REVEALED"
                                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40"
                                      : bid.status === "TAMPERED_REJECTED"
                                      ? "bg-rose-950/60 text-rose-400 border border-rose-500/40"
                                      : "bg-indigo-950/60 text-indigo-300 border border-indigo-500/30"
                                  }`}
                                >
                                  {bid.status}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-zinc-400">
                                <span
                                  className="underline decoration-dotted cursor-help"
                                  title={bid.commitmentHash}
                                >
                                  {bid.commitmentHash
                                    ? `${bid.commitmentHash.slice(0, 10)}...${bid.commitmentHash.slice(-8)}`
                                    : "-"}
                                </span>
                              </td>
                              <td className="py-3 px-3.5 font-mono text-zinc-200">
                                {bid.revealedAmount !== null &&
                                bid.revealedAmount !== undefined
                                  ? `Rp ${Number(bid.revealedAmount).toLocaleString("id-ID")}`
                                  : <span className="text-zinc-500 italic">Belum di-reveal</span>}
                              </td>
                              <td className="py-3 px-3.5 text-zinc-400 text-[11px] whitespace-nowrap">
                                {bid.committedAt
                                  ? new Date(bid.committedAt).toLocaleString("id-ID")
                                  : "-"}
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <button
                                  type="button"
                                  disabled={!isCompleted}
                                  onClick={() => handleDeleteBid(bid.id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                                    isCompleted
                                      ? "bg-rose-900/40 hover:bg-rose-800 text-rose-200 border border-rose-700/60 cursor-pointer"
                                      : "bg-zinc-800/40 text-zinc-600 border border-zinc-800 cursor-not-allowed opacity-50"
                                  }`}
                                  title={
                                    isCompleted
                                      ? "Hapus penawaran ini"
                                      : "Hanya dapat dihapus jika lelang sudah selesai (COMPLETED)"
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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
                    Prinsip Kriptografi Zero-Knowledge (Anti-Kolusi
                    Administrator):
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Pada dashboard kurator ini, Anda dapat memantau setiap
                    bidder yang menyerahkan komitmen, alamat IP, dan waktu
                    commit. Namun demikian, berkat algoritma{" "}
                    <strong>SHA-256 One-Way Hash</strong>, Anda{" "}
                    <em>sama sekali tidak dapat melihat nominal tawaran</em>{" "}
                    sampai peserta sendiri yang membuka kuncinya di fase reveal.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAuctions.map((auc) => (
                  <div
                    key={auc.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                      <div>
                        <h4 className="text-sm font-serif font-bold text-zinc-100">
                          {auc.title}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Status: {auc.current_stage}
                        </span>
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
                      <span className="text-zinc-500 block mb-1">
                        Status Enkripsi Nilai:
                      </span>
                      {auc.current_stage === "COMMIT" ? (
                        <span className="text-indigo-400 font-bold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> [TERSEGEL - ADMIN
                          TIDAK MEMILIKI AKSES KE NOMINAL]
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5" /> [TERBUKA SECARA
                          RESMI MELALUI REVEAL PROTOCOL]
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
                  Log forensik aktivitas otentikasi, komitmen hash, validasi
                  reveal, dan anomali keamanan:
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Severity:</span>
                  <select
                    value={logSeverity}
                    onChange={(e) => setLogSeverity(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-mono cursor-pointer"
                  >
                    <option value="ALL">
                      Semua Tingkat (INFO + WARN + CRITICAL)
                    </option>
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
                      {filteredLogs.map((log) => (
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
                            #{log.id} •{" "}
                            {new Date(log.created_at).toLocaleTimeString(
                              "id-ID"
                            )}
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
                          <td
                            className="py-3 px-3.5 text-zinc-400 text-[11px] max-w-xs truncate"
                            title={log.details}
                          >
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
                Daftar pengguna terdaftar, status enkripsi AES-256-GCM, dan
                pembekuan akun anti-fraud:
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
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-zinc-950/40 transition-colors"
                        >
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-zinc-200">
                              {u.username}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {u.email}
                            </div>
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
                                <div
                                  className="text-[9px] text-rose-300 max-w-[200px] truncate"
                                  title={u.flagReason || ""}
                                >
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
                              onClick={() =>
                                handleToggleUserFlag(u.id, u.isFlagged)
                              }
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
      </div>

      {/* Modal Tambah Lelang Baru (Create) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 backdrop-blur-md px-4 py-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-zinc-100 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> Tambah Lelang
                Parfum Baru
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {createErrors.form && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {createErrors.form}
              </div>
            )}

            <form
              noValidate
              onSubmit={handleCreateAuction}
              className="space-y-4 text-xs"
            >
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <label className="mb-2 block text-sm font-medium text-zinc-200">
                  Foto Parfum
                </label>
                <p className="mb-3 text-xs text-zinc-400">
                  Pilih gambar JPG, PNG, atau WebP. Maksimal 5 MB.
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        file.type
                      )
                    ) {
                      setCreateErrors({
                        imageUrl: "Format gambar harus JPG, PNG, atau WebP.",
                      });
                      e.target.value = "";
                      return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      setCreateErrors({
                        imageUrl: "Ukuran gambar maksimal 5 MB.",
                      });
                      e.target.value = "";
                      return;
                    }

                    setSelectedImage(file);
                    setImagePreview((previous) => {
                      if (previous.startsWith("blob:")) {
                        URL.revokeObjectURL(previous);
                      }
                      return URL.createObjectURL(file);
                    });
                  }}
                  className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:font-medium file:text-black hover:file:bg-amber-400"
                />
                {createErrors.imageUrl && (
                  <p className="mt-1.5 text-[11px] text-rose-400 font-medium">
                    ⚠️ {createErrors.imageUrl}
                  </p>
                )}

                {(imagePreview || newAuction.imageUrl) && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs text-zinc-400">Preview gambar</p>
                    <img
                      src={imagePreview || newAuction.imageUrl}
                      alt="Preview parfum"
                      className="h-48 w-full rounded-xl border border-zinc-800 object-contain bg-black"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1">
                    Nama Parfum
                  </label>
                  <input
                    type="text"
                    value={newAuction.title}
                    onChange={(e) =>
                      setNewAuction({ ...newAuction, title: e.target.value })
                    }
                    placeholder="Contoh: Creed Vintage Tabarome 1975"
                    className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-zinc-100 focus:outline-none ${
                      createErrors.title
                        ? "border-rose-500"
                        : "border-zinc-800 focus:border-amber-500"
                    }`}
                  />
                  {createErrors.title && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">
                    Rumah Parfum (House)
                  </label>
                  <input
                    type="text"
                    value={newAuction.perfumeHouse}
                    onChange={(e) =>
                      setNewAuction({
                        ...newAuction,
                        perfumeHouse: e.target.value,
                      })
                    }
                    placeholder="Contoh: The House of Creed"
                    className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-zinc-100 focus:outline-none ${
                      createErrors.perfumeHouse
                        ? "border-rose-500"
                        : "border-zinc-800 focus:border-amber-500"
                    }`}
                  />
                  {createErrors.perfumeHouse && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.perfumeHouse}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">
                    Tahun / Batch
                  </label>
                  <input
                    type="text"
                    value={newAuction.bottleYear}
                    onChange={(e) =>
                      setNewAuction({
                        ...newAuction,
                        bottleYear: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                  />
                  {createErrors.bottleYear && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.bottleYear}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">
                    Konsentrasi
                  </label>
                  <input
                    type="text"
                    value={newAuction.concentration}
                    onChange={(e) =>
                      setNewAuction({
                        ...newAuction,
                        concentration: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                  />
                  {createErrors.concentration && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.concentration}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">
                    Volume (ml)
                  </label>
                  <input
                    type="number"
                    value={newAuction.volumeMl}
                    onChange={(e) =>
                      setNewAuction({
                        ...newAuction,
                        volumeMl: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none"
                  />
                  {createErrors.volumeMl && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.volumeMl}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">
                  Deskripsi & Nilai Historis
                </label>
                <textarea
                  rows={2}
                  value={newAuction.description}
                  onChange={(e) =>
                    setNewAuction({
                      ...newAuction,
                      description: e.target.value,
                    })
                  }
                  placeholder="Informasi langka tentang botol dan bahan wewangian..."
                  className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-zinc-100 focus:outline-none ${
                    createErrors.description
                      ? "border-rose-500"
                      : "border-zinc-800"
                  }`}
                />
                {createErrors.description && (
                  <p className="mt-1 text-[11px] text-rose-400 font-medium">
                    ⚠️ {createErrors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Top Notes</label>
                  <input
                    type="text"
                    value={newAuction.topNotes}
                    onChange={(e) =>
                      setNewAuction({ ...newAuction, topNotes: e.target.value })
                    }
                    placeholder="Citrus, Ginger"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                  {createErrors.topNotes && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.topNotes}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">
                    Heart Notes
                  </label>
                  <input
                    type="text"
                    value={newAuction.heartNotes}
                    onChange={(e) =>
                      setNewAuction({
                        ...newAuction,
                        heartNotes: e.target.value,
                      })
                    }
                    placeholder="Tobacco, Jasmine"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                  {createErrors.heartNotes && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.heartNotes}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Base Notes</label>
                  <input
                    type="text"
                    value={newAuction.baseNotes}
                    onChange={(e) =>
                      setNewAuction({
                        ...newAuction,
                        baseNotes: e.target.value,
                      })
                    }
                    placeholder="Leather, Ambergris"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100"
                  />
                  {createErrors.baseNotes && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.baseNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">
                    Starting Price (IDR)
                  </label>
                  <input
                    type="number"
                    step={1000000}
                    value={newAuction.startingPrice}
                    onChange={(e) =>
                      setNewAuction({
                        ...newAuction,
                        startingPrice: Number(e.target.value),
                      })
                    }
                    className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-zinc-100 font-mono ${
                      createErrors.startingPrice
                        ? "border-rose-500"
                        : "border-zinc-800"
                    }`}
                  />
                  {createErrors.startingPrice && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.startingPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">
                    Durasi Commit (Jam)
                  </label>
                  <input
                    type="number"
                    value={newAuction.commitDurationHours}
                    onChange={(e) =>
                      setNewAuction({
                        ...newAuction,
                        commitDurationHours: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono"
                  />
                  {createErrors.commitDurationHours && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.commitDurationHours}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">
                    Durasi Reveal (Jam)
                  </label>
                  <input
                    type="number"
                    value={newAuction.revealDurationHours}
                    onChange={(e) =>
                      setNewAuction({
                        ...newAuction,
                        revealDurationHours: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono"
                  />
                  {createErrors.revealDurationHours && (
                    <p className="mt-1 text-[11px] text-rose-400 font-medium">
                      ⚠️ {createErrors.revealDurationHours}
                    </p>
                  )}
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

      {/* Modal Edit Lelang (Update) */}
      {editingAuction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-serif font-bold text-zinc-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" /> Edit Detail Lelang
                #{editingAuction.id}
              </h3>
              <button
                onClick={() => setEditingAuction(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {editErrors.form && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {editErrors.form}
              </div>
            )}

            <form
              noValidate
              onSubmit={handleUpdateAuction}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-zinc-300 mb-1">Nama Parfum</label>
                <input
                  type="text"
                  value={editingAuction.title}
                  onChange={(e) =>
                    setEditingAuction({
                      ...editingAuction,
                      title: e.target.value,
                    })
                  }
                  className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-zinc-100 focus:outline-none ${
                    editErrors.title
                      ? "border-rose-500"
                      : "border-zinc-800 focus:border-amber-500"
                  }`}
                />
                {editErrors.title && (
                  <p className="mt-1 text-[11px] text-rose-400 font-medium">
                    ⚠️ {editErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">
                  Rumah Parfum (House)
                </label>
                <input
                  type="text"
                  value={editingAuction.perfumeHouse}
                  onChange={(e) =>
                    setEditingAuction({
                      ...editingAuction,
                      perfumeHouse: e.target.value,
                    })
                  }
                  className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-zinc-100 focus:outline-none ${
                    editErrors.perfumeHouse
                      ? "border-rose-500"
                      : "border-zinc-800 focus:border-amber-500"
                  }`}
                />
                {editErrors.perfumeHouse && (
                  <p className="mt-1 text-[11px] text-rose-400 font-medium">
                    ⚠️ {editErrors.perfumeHouse}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">
                  Starting Price (IDR)
                </label>
                <input
                  type="number"
                  step={1000000}
                  value={editingAuction.startingPrice}
                  onChange={(e) =>
                    setEditingAuction({
                      ...editingAuction,
                      startingPrice: Number(e.target.value),
                    })
                  }
                  className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-zinc-100 font-mono focus:outline-none ${
                    editErrors.startingPrice
                      ? "border-rose-500"
                      : "border-zinc-800 focus:border-amber-500"
                  }`}
                />
                {editErrors.startingPrice && (
                  <p className="mt-1 text-[11px] text-rose-400 font-medium">
                    ⚠️ {editErrors.startingPrice}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingAuction(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                >
                  Simpan Perubahan
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