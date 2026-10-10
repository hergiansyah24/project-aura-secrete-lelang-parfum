import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak. Hanya Admin yang dapat memfinalisasi lelang." }, { status: 403 });
    }

    const { id } = await params;
    const auctionId = Number(id);
    const db = getDb();

    const auction = db.prepare("SELECT * FROM auctions WHERE id = ?").get(auctionId) as
      | { id: number; title: string; current_stage: string }
      | undefined;

    if (!auction) {
      return NextResponse.json({ error: "Lelang tidak ditemukan." }, { status: 404 });
    }

    // Determine highest valid revealed bid
    const highestBid = db
      .prepare(`
        SELECT b.user_id, b.revealed_amount, b.commitment_hash, u.username
        FROM bids b
        JOIN users u ON b.user_id = u.id
        WHERE b.auction_id = ? AND b.status = 'REVEALED'
        ORDER BY b.revealed_amount DESC
        LIMIT 1
      `)
      .get(auctionId) as
      | { user_id: number; revealed_amount: number; commitment_hash: string; username: string }
      | undefined;

    if (highestBid) {
      db.prepare(`
        UPDATE auctions
        SET current_stage = 'COMPLETED',
            winner_id = ?,
            winning_bid_amount = ?,
            winning_bid_hash = ?
        WHERE id = ?
      `).run(highestBid.user_id, highestBid.revealed_amount, highestBid.commitment_hash, auctionId);

      recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "AUCTION_FINALIZE",
        severity: "INFO",
        details: {
          auctionId,
          winnerId: highestBid.user_id,
          winnerUsername: highestBid.username,
          winningAmount: highestBid.revealed_amount,
          winningHash: highestBid.commitment_hash,
          manualFinalizeByAdmin: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Lelang resmi diselesaikan! Pemenang: ${highestBid.username} dengan tawaran valid Rp ${highestBid.revealed_amount.toLocaleString("id-ID")}`,
        winner: {
          username: highestBid.username,
          amount: highestBid.revealed_amount,
          hash: highestBid.commitment_hash,
        },
      });
    } else {
      db.prepare(`UPDATE auctions SET current_stage = 'COMPLETED' WHERE id = ?`).run(auctionId);

      recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "AUCTION_FINALIZE",
        severity: "WARN",
        details: {
          auctionId,
          message: "Lelang ditutup tanpa pemenang (tidak ada bid yang di-reveal secara valid).",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Lelang selesai. Tidak ada penawaran valid yang di-reveal.",
      });
    }
  } catch (error) {
    console.error("Finalize error:", error);
    return NextResponse.json({ error: "Gagal memfinalisasi lelang." }, { status: 500 });
  }
}

