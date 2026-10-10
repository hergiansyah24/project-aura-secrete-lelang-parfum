import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { syncAuctionStages } from "@/lib/auction-sync";

export async function GET() {
  try {
    syncAuctionStages();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Anda harus login." }, { status: 401 });
    }

    const db = getDb();
    const bids = db
      .prepare(`
        SELECT b.id as bid_id, b.commitment_hash, b.status as bid_status,
               b.revealed_amount, b.revealed_nonce, b.committed_at, b.revealed_at,
               a.id as auction_id, a.title as auction_title, a.perfume_house,
               a.image_url, a.starting_price, a.current_stage,
               a.winner_id, a.winning_bid_amount, a.winning_bid_hash,
               a.commit_end_time, a.reveal_end_time
        FROM bids b
        JOIN auctions a ON b.auction_id = a.id
        WHERE b.user_id = ?
        ORDER BY b.committed_at DESC
      `)
      .all(currentUser.id) as Array<Record<string, unknown>>;

    const processedBids = bids.map((b) => {
      const isWinner = b.winner_id === currentUser.id && b.current_stage === "COMPLETED";
      const isLoser =
        b.current_stage === "COMPLETED" && b.winner_id !== null && b.winner_id !== currentUser.id;

      let resultStatus = "WAITING";
      if (b.bid_status === "TAMPERED_REJECTED") {
        resultStatus = "REJECTED_FRAUD";
      } else if (isWinner) {
        resultStatus = "WON";
      } else if (isLoser) {
        resultStatus = "LOST";
      } else if (b.current_stage === "REVEAL" && b.bid_status === "COMMITTED") {
        resultStatus = "ACTION_REQUIRED_REVEAL";
      } else if (b.bid_status === "REVEALED") {
        resultStatus = "REVEALED_WAITING_FINAL";
      } else {
        resultStatus = "SEALED_COMMITMENT";
      }

      return {
        ...b,
        resultStatus,
        isWinner,
      };
    });

    return NextResponse.json({ bids: processedBids });
  } catch (error) {
    console.error("GET my-bids error:", error);
    return NextResponse.json({ error: "Gagal mengambil riwayat penawaran." }, { status: 500 });
  }
}

