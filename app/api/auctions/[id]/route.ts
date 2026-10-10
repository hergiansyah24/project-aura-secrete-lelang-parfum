import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { syncAuctionStages } from "@/lib/auction-sync";
import { recordAuditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    syncAuctionStages();
    const { id } = await params;
    const auctionId = Number(id);

    if (isNaN(auctionId)) {
      return NextResponse.json({ error: "ID lelang tidak valid." }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    const db = getDb();

    const auction = db
      .prepare(`
        SELECT a.*, u.username as winner_username
        FROM auctions a
        LEFT JOIN users u ON a.winner_id = u.id
        WHERE a.id = ?
      `)
      .get(auctionId) as Record<string, unknown> | undefined;

    if (!auction) {
      return NextResponse.json({ error: "Lelang parfum tidak ditemukan." }, { status: 404 });
    }

    // Bidder list for transparency
    // CRITICAL CRYPTOGRAPHIC GUARANTEE:
    // If stage is COMMIT, DO NOT expose revealed_amount (it's null anyway, but ensure zero knowledge)!
    const bidsQuery = db.prepare(`
      SELECT b.id, b.user_id, u.username, b.commitment_hash, b.status,
             b.committed_at, b.revealed_at,
             CASE 
               WHEN a.current_stage = 'COMPLETED' OR b.status = 'REVEALED' THEN b.revealed_amount
               ELSE NULL 
             END as public_revealed_amount,
             CASE 
               WHEN a.current_stage = 'COMPLETED' THEN b.revealed_nonce
               ELSE NULL 
             END as public_revealed_nonce
      FROM bids b
      JOIN users u ON b.user_id = u.id
      JOIN auctions a ON b.auction_id = a.id
      WHERE b.auction_id = ?
      ORDER BY b.id ASC
    `);

    const allBids = bidsQuery.all(auctionId) as Array<Record<string, unknown>>;

    // Fetch user's own bid
    let myBid = null;
    if (currentUser) {
      myBid = db
        .prepare(`
          SELECT id, commitment_hash, status, revealed_amount, revealed_nonce, committed_at, revealed_at
          FROM bids
          WHERE auction_id = ? AND user_id = ?
        `)
        .get(auctionId, currentUser.id);
    }

    return NextResponse.json({
      auction,
      bids: allBids,
      myBid,
      totalBidders: allBids.length,
      revealedBidders: allBids.filter((b) => b.status === "REVEALED").length,
    });
  } catch (error) {
    console.error("GET auction detail error:", error);
    return NextResponse.json({ error: "Gagal mengambil data lelang." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const auctionId = Number(id);
    const body = await req.json();
    const { action, current_stage } = body;

    const db = getDb();
    const existing = db.prepare("SELECT * FROM auctions WHERE id = ?").get(auctionId) as
      | { id: number; title: string; current_stage: string }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Lelang tidak ditemukan." }, { status: 404 });
    }

    // Manual Stage Transitions by Admin (Useful for presentations/testing!)
    if (action === "force_stage" && current_stage) {
      db.prepare("UPDATE auctions SET current_stage = ? WHERE id = ?").run(current_stage, auctionId);

      recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "AUCTION_STAGE_CHANGE",
        severity: "WARN",
        details: {
          auctionId,
          title: existing.title,
          from: existing.current_stage,
          to: current_stage,
          manualOverrideByAdmin: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Fase lelang berhasil diubah manual ke ${current_stage}.`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    console.error("PUT auction error:", error);
    return NextResponse.json({ error: "Gagal memperbarui lelang." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const auctionId = Number(id);
    const db = getDb();

    db.prepare("DELETE FROM auctions WHERE id = ?").run(auctionId);

    recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "AUCTION_STAGE_CHANGE",
      severity: "WARN",
      details: { auctionId, deleted: true },
    });

    return NextResponse.json({ success: true, message: "Lelang berhasil dihapus." });
  } catch (error) {
    console.error("DELETE auction error:", error);
    return NextResponse.json({ error: "Gagal menghapus lelang." }, { status: 500 });
  }
}

