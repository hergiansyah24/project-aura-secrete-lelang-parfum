import { prisma } from "./prisma";
import { recordAuditLog } from "./audit";

/**
 * Automatically synchronize auction stages based on timestamps:
 * 1. COMMIT -> REVEAL
 * 2. REVEAL -> COMPLETED and determine the highest revealed bid
 */
export async function syncAuctionStages(): Promise<void> {
  try {
    const now = new Date();

    // 1. Advance COMMIT -> REVEAL
    const commitPassedAuctions = await prisma.auction.findMany({
      where: {
        currentStage: "COMMIT",
        commitEndTime: { lte: now },
      },
      select: {
        id: true,
        title: true,
      },
    });

    for (const auction of commitPassedAuctions) {
      const updated = await prisma.auction.updateMany({
        where: {
          id: auction.id,
          currentStage: "COMMIT",
          commitEndTime: { lte: now },
        },
        data: { currentStage: "REVEAL" },
      });

      if (updated.count > 0) {
        await recordAuditLog({
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
    }

    // 2. Advance REVEAL -> COMPLETED and determine winner
    const revealPassedAuctions = await prisma.auction.findMany({
      where: {
        currentStage: "REVEAL",
        revealEndTime: { lte: now },
      },
      select: {
        id: true,
        title: true,
      },
    });

    for (const auction of revealPassedAuctions) {
      const result = await prisma.$transaction(async (tx) => {
        const highestBid = await tx.bid.findFirst({
          where: {
            auctionId: auction.id,
            status: "REVEALED",
            revealedAmount: { not: null },
          },
          orderBy: [
            { revealedAmount: "desc" },
            { id: "asc" },
          ],
          select: {
            userId: true,
            revealedAmount: true,
            commitmentHash: true,
          },
        });

        const updated = await tx.auction.updateMany({
          where: {
            id: auction.id,
            currentStage: "REVEAL",
            revealEndTime: { lte: now },
          },
          data: {
            currentStage: "COMPLETED",
            winnerId: highestBid?.userId ?? null,
            winningBidAmount: highestBid?.revealedAmount ?? null,
            winningBidHash: highestBid?.commitmentHash ?? null,
          },
        });

        return {
          updated: updated.count > 0,
          highestBid,
        };
      });

      // Another request may have finalized this auction first.
      if (!result.updated) {
        continue;
      }

      if (result.highestBid) {
        await recordAuditLog({
          action: "AUCTION_FINALIZE",
          severity: "INFO",
          details: {
            auctionId: auction.id,
            winnerId: result.highestBid.userId,
            winningAmount: result.highestBid.revealedAmount?.toString(),
            winningHash: result.highestBid.commitmentHash,
            trigger: "AUTO_TIMER_EXPIRY",
          },
        });
      } else {
        await recordAuditLog({
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