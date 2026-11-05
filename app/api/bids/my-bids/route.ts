import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { syncAuctionStages } from "@/lib/auction-sync";
import { unstable_rethrow } from "next/navigation";

export async function GET() {
  try {
    await syncAuctionStages();

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Anda harus login." },
        { status: 401 }
      );
    }

    const bids = await prisma.bid.findMany({
      where: {
        userId: currentUser.id,
      },
      include: {
        auction: true,
      },
      orderBy: {
        committedAt: "desc",
      },
    });

    const processedBids = bids.map((bid) => {
      const auction = bid.auction;

      const isWinner =
        auction.winnerId === currentUser.id &&
        auction.currentStage === "COMPLETED";

      const isLoser =
        auction.currentStage === "COMPLETED" &&
        auction.winnerId !== null &&
        auction.winnerId !== currentUser.id;

      let resultStatus = "WAITING";

      if ((bid.status as string) === "TAMPERED_REJECTED") {
        resultStatus = "REJECTED_FRAUD";
      } else if (isWinner) {
        resultStatus = "WON";
      } else if (isLoser) {
        resultStatus = "LOST";
      } else if (
        auction.currentStage === "REVEAL" &&
        bid.status === "COMMITTED"
      ) {
        resultStatus = "ACTION_REQUIRED_REVEAL";
      } else if (bid.status === "REVEALED") {
        resultStatus = "REVEALED_WAITING_FINAL";
      } else {
        resultStatus = "SEALED_COMMITMENT";
      }

      return {
        bid_id: bid.id,
        commitment_hash: bid.commitmentHash,
        bid_status: bid.status,
        revealed_amount:
          bid.revealedAmount !== null
            ? Number(bid.revealedAmount)
            : null,
        revealed_nonce: bid.revealedNonce,
        committed_at: bid.committedAt,
        revealed_at: bid.revealedAt,

        auction_id: auction.id,
        auction_title: auction.title,
        perfume_house: auction.perfumeHouse,
        image_url: auction.imageUrl,
        starting_price: Number(auction.startingPrice),
        current_stage: auction.currentStage,
        winner_id: auction.winnerId,
        winning_bid_amount:
          auction.winningBidAmount !== null
            ? Number(auction.winningBidAmount)
            : null,
        winning_bid_hash: auction.winningBidHash,
        commit_end_time: auction.commitEndTime,
        reveal_end_time: auction.revealEndTime,

        resultStatus,
        isWinner,
      };
    });

    return NextResponse.json({
      bids: processedBids,
    });
  } catch (error) {
  unstable_rethrow(error);
  console.error("GET my-bids error:", error);

  return NextResponse.json(
    { error: "Gagal mengambil riwayat penawaran." },
    { status: 500 }
  );
}
}