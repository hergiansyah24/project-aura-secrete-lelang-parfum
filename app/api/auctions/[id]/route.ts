import { NextRequest, NextResponse } from "next/server";
import { updateAuctionSchema } from "@/schema";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { syncAuctionStages } from "@/lib/auction-sync";
import { recordAuditLog } from "@/lib/audit";

type RouteContext = {
  params: Promise<{ id: string }>;
};
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    await syncAuctionStages();

    const { id } = await params;
    const auctionId = Number(id);

    if (!Number.isSafeInteger(auctionId) || auctionId <= 0) {
      return NextResponse.json(
        { error: "ID lelang tidak valid." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        winner: {
          select: { username: true },
        },
        bids: {
          include: {
            user: {
              select: { username: true },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Lelang parfum tidak ditemukan." },
        { status: 404 }
      );
    }

    const auctionData = {
      id: auction.id,
      title: auction.title,
      perfume_house: auction.perfumeHouse,
      bottle_year: auction.bottleYear,
      concentration: auction.concentration,
      volume_ml: auction.volumeMl,
      description: auction.description,
      top_notes: auction.topNotes,
      heart_notes: auction.heartNotes,
      base_notes: auction.baseNotes,
      image_url: auction.imageUrl,
      starting_price: Number(auction.startingPrice),
      current_stage: auction.currentStage,
      commit_end_time: auction.commitEndTime,
      reveal_end_time: auction.revealEndTime,
      winner_id: auction.winnerId,
      winning_bid_amount:
        auction.winningBidAmount !== null
          ? Number(auction.winningBidAmount)
          : null,
      winning_bid_hash: auction.winningBidHash,
      created_at: auction.createdAt,
      winner_username: auction.winner?.username ?? null,
    };

    const allBids = auction.bids.map((bid) => ({
      id: bid.id,
      user_id: bid.userId,
      username: bid.user.username,
      commitment_hash: bid.commitmentHash,
      status: bid.status,
      committed_at: bid.committedAt,
      revealed_at: bid.revealedAt,
      public_revealed_amount:
        auction.currentStage === "COMPLETED" ||
        bid.status === "REVEALED"
          ? bid.revealedAmount !== null
            ? Number(bid.revealedAmount)
            : null
          : null,
      public_revealed_nonce:
        auction.currentStage === "COMPLETED"
          ? bid.revealedNonce
          : null,
    }));

    const ownBid = currentUser
      ? auction.bids.find((bid) => bid.userId === currentUser.id)
      : undefined;

    const myBid = ownBid
      ? {
          id: ownBid.id,
          commitment_hash: ownBid.commitmentHash,
          status: ownBid.status,
          revealed_amount:
            ownBid.revealedAmount !== null
              ? Number(ownBid.revealedAmount)
              : null,
          revealed_nonce: ownBid.revealedNonce,
          committed_at: ownBid.committedAt,
          revealed_at: ownBid.revealedAt,
        }
      : null;

    return NextResponse.json({
      auction: auctionData,
      bids: allBids,
      myBid,
      totalBidders: allBids.length,
      revealedBidders: allBids.filter(
        (bid) => bid.status === "REVEALED"
      ).length,
    });
  } catch (error) {
    console.error("GET auction detail error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil data lelang." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const auctionId = Number(id);

    if (!Number.isSafeInteger(auctionId) || auctionId <= 0) {
      return NextResponse.json(
        { error: "ID lelang tidak valid." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action, current_stage } = body;

    const existing = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        title: true,
        perfumeHouse: true,
        startingPrice: true,
        currentStage: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Lelang tidak ditemukan." },
        { status: 404 }
      );
    }

    if (action === "update_details") {
      const parsed = updateAuctionSchema.safeParse({
        title: body.title,
        perfumeHouse: body.perfumeHouse ?? body.perfume_house,
        startingPrice: body.startingPrice ?? body.starting_price,
      });

      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] || "form");
          if (!fieldErrors[key]) {
            fieldErrors[key] = issue.message;
          }
        }
        return NextResponse.json(
          {
            error: "Validasi pembaruan lelang gagal.",
            fieldErrors,
          },
          { status: 400 }
        );
      }

      const { title, perfumeHouse, startingPrice } = parsed.data;

      const updated = await prisma.auction.update({
        where: { id: auctionId },
        data: {
          title,
          perfumeHouse,
          startingPrice,
        },
      });

      await recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "AUCTION_STAGE_CHANGE",
        severity: "INFO",
        details: {
          auctionId,
          updatedDetails: true,
          from: {
            title: existing.title,
            perfumeHouse: existing.perfumeHouse,
            startingPrice: Number(existing.startingPrice),
          },
          to: {
            title: updated.title,
            perfumeHouse: updated.perfumeHouse,
            startingPrice: Number(updated.startingPrice),
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Detail lelang "${updated.title}" berhasil diperbarui di PostgreSQL.`,
      });
    }

    if (action === "force_stage" && current_stage) {
      const validStages = ["COMMIT", "REVEAL", "COMPLETED"];

      if (!validStages.includes(current_stage)) {
        return NextResponse.json(
          { error: "Status fase lelang tidak valid." },
          { status: 400 }
        );
      }

      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          currentStage: current_stage,
        },
      });

      await recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "AUCTION_STAGE_CHANGE",
        severity: "WARN",
        details: {
          auctionId,
          title: existing.title,
          from: existing.currentStage,
          to: current_stage,
          manualOverrideByAdmin: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Fase lelang berhasil diubah manual ke ${current_stage}.`,
      });
    }

    return NextResponse.json(
      { error: "Aksi tidak dikenal." },
      { status: 400 }
    );
  } catch (error) {
    console.error("PUT auction error:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui lelang." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const auctionId = Number(id);

    if (!Number.isSafeInteger(auctionId) || auctionId <= 0) {
      return NextResponse.json(
        { error: "ID lelang tidak valid." },
        { status: 400 }
      );
    }

    const existing = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Lelang tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.auction.delete({
      where: { id: auctionId },
    });

    await recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "AUCTION_STAGE_CHANGE",
      severity: "WARN",
      details: {
        auctionId,
        deleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lelang berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE auction error:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui atau menghapus lelang." },
      { status: 500 }
    );
  }
}