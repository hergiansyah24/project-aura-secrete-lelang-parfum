import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit";
import { syncAuctionStages } from "@/lib/auction-sync";

export async function POST(req: NextRequest) {
  try {
    syncAuctionStages();
    const ip = getClientIp(req.headers);

    // Rate Limiting: 10 commit submissions per minute (Anti-Spam)
    const rateLimit = checkRateLimit(`bid_commit:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      recordAuditLog({
        action: "SECURITY_RATE_LIMIT",
        severity: "WARN",
        details: { endpoint: "/api/bids/commit", retryAfter: rateLimit.retryAfterSeconds },
        ipAddress: ip,
      });

      return NextResponse.json(
        { error: `Spam bidding dicegah. Harap tunggu ${rateLimit.retryAfterSeconds} detik.` },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Anda harus login untuk mengajukan penawaran." }, { status: 401 });
    }

    // Anti-Cheat: Reject flagged / suspicious accounts
    if (currentUser.isFlagged) {
      recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "USER_FLAGGED",
        severity: "CRITICAL",
        details: {
          attempt: "FLAGGED_USER_TRIED_BIDDING",
          reason: currentUser.flagReason,
        },
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          error: `AKSES DITOLAK: Akun Anda ditandai mencurigakan oleh sistem keamanan. Alasan: ${
            currentUser.flagReason || "Pelanggaran integritas lelang"
          }`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { auctionId, commitmentHash } = body;

    const parsedAuctionId = Number(auctionId);
    if (!parsedAuctionId || isNaN(parsedAuctionId)) {
      return NextResponse.json({ error: "ID lelang tidak valid." }, { status: 400 });
    }

    // Cryptographic validation: Hash must be a valid 64-character SHA-256 hex string
    if (
      !commitmentHash ||
      typeof commitmentHash !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(commitmentHash.trim())
    ) {
      return NextResponse.json(
        { error: "Format commitment hash tidak valid. Harus berupa 64-karakter SHA-256 hex string." },
        { status: 400 }
      );
    }

    const normalizedHash = commitmentHash.trim().toLowerCase();
    const db = getDb();

    // Check auction validity and stage
    const auction = db
      .prepare("SELECT id, title, current_stage FROM auctions WHERE id = ?")
      .get(parsedAuctionId) as { id: number; title: string; current_stage: string } | undefined;

    if (!auction) {
      return NextResponse.json({ error: "Lelang tidak ditemukan." }, { status: 404 });
    }

    if (auction.current_stage !== "COMMIT") {
      return NextResponse.json(
        {
          error: `Fase pengajuan tertutup (COMMIT) sudah berakhir. Status lelang saat ini: ${auction.current_stage}`,
        },
        { status: 400 }
      );
    }

    // Prepared statement upsert
    // Note: The raw bid amount and nonce are NEVER sent to the server in this phase!
    const existingBid = db
      .prepare("SELECT id FROM bids WHERE auction_id = ? AND user_id = ?")
      .get(parsedAuctionId, currentUser.id) as { id: number } | undefined;

    if (existingBid) {
      db.prepare(`
        UPDATE bids
        SET commitment_hash = ?, status = 'COMMITTED', committed_at = datetime('now')
        WHERE id = ?
      `).run(normalizedHash, existingBid.id);
    } else {
      db.prepare(`
        INSERT INTO bids (auction_id, user_id, commitment_hash, status, committed_at)
        VALUES (?, ?, ?, 'COMMITTED', datetime('now'))
      `).run(parsedAuctionId, currentUser.id, normalizedHash);
    }

    // Record in immutable audit log
    recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "BID_COMMIT",
      severity: "INFO",
      details: {
        auctionId: parsedAuctionId,
        auctionTitle: auction.title,
        commitmentHash: normalizedHash,
        cryptographicScheme: "SHA-256 Sealed Hash Commitment",
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: "Komitmen penawaran terenkripsi SHA-256 berhasil dicatat di server.",
      commitmentHash: normalizedHash,
    });
  } catch (error) {
    console.error("Bid commit error:", error);
    return NextResponse.json({ error: "Gagal memproses komitmen penawaran." }, { status: 500 });
  }
}

