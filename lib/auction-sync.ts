import { getDb } from "./db";
import { recordAuditLog } from "./audit";

/**
 * Automatically synchronize auction stages based on timestamps:
 * 1. COMMIT -> REVEAL (when commit_end_time passed)
 * 2. REVEAL -> COMPLETED (when reveal_end_time passed, auto-select highest valid bid)
 */
export function syncAuctionStages(): void {
  try {
    const db = getDb();
    const nowIso = new Date().toISOString();

    // 1. Advance COMMIT -> REVEAL
    const commitPassedAuctions = db
      .prepare(`
        SELECT id, title, commit_end_time
        FROM auctions
        WHERE current_stage = 'COMMIT' AND ? >= commit_end_time
      `)
      .all(nowIso) as Array<{ id: number; title: string; commit_end_time: string }>;

    for (const auction of commitPassedAuctions) {
      db.prepare(`UPDATE auctions SET current_stage = 'REVEAL' WHERE id = ?`).run(auction.id);
      recordAuditLog({
        action: "AUCTION_STAGE_CHANGE",
        severity: "INFO",
        details: {
          auctionId: auction.id,
          title: auction.title,
          from: "COMMIT",
          to: "REVEAL",
          trigger: "AUTO_TIMER_EXPIRY",
        },
      });
    }

    // 2. Advance REVEAL -> COMPLETED & Determine Winner
    const revealPassedAuctions = db
      .prepare(`
        SELECT id, title, reveal_end_time
        FROM auctions
        WHERE current_stage = 'REVEAL' AND ? >= reveal_end_time
      `)
      .all(nowIso) as Array<{ id: number; title: string; reveal_end_time: string }>;

    for (const auction of revealPassedAuctions) {
      // Find highest verified revealed bid
      const highestBid = db
        .prepare(`
          SELECT user_id, revealed_amount, commitment_hash
          FROM bids
          WHERE auction_id = ? AND status = 'REVEALED'
          ORDER BY revealed_amount DESC
          LIMIT 1
        `)
        .get(auction.id) as
        | { user_id: number; revealed_amount: number; commitment_hash: string }
        | undefined;

      if (highestBid) {
        db.prepare(`
          UPDATE auctions
          SET current_stage = 'COMPLETED',
              winner_id = ?,
              winning_bid_amount = ?,
              winning_bid_hash = ?
          WHERE id = ?
        `).run(highestBid.user_id, highestBid.revealed_amount, highestBid.commitment_hash, auction.id);

        recordAuditLog({
          action: "AUCTION_FINALIZE",
          severity: "INFO",
          details: {
            auctionId: auction.id,
            winnerId: highestBid.user_id,
            winningAmount: highestBid.revealed_amount,
            winningHash: highestBid.commitment_hash,
            trigger: "AUTO_TIMER_EXPIRY",
          },
        });
      } else {
        // No revealed bids
        db.prepare(`UPDATE auctions SET current_stage = 'COMPLETED' WHERE id = ?`).run(auction.id);
        recordAuditLog({
          action: "AUCTION_FINALIZE",
          severity: "WARN",
          details: {
            auctionId: auction.id,
            result: "NO_VALID_REVEALED_BIDS",
            trigger: "AUTO_TIMER_EXPIRY",
          },
        });
      }
    }
  } catch (err) {
    console.error("Auction stage synchronization error:", err);
  }
}

