import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        {
          error: "Akses ditolak. Hanya Admin yang dapat memfinalisasi lelang.",
        },
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

    const auction = await prisma.auction.findUnique({
      where: {
        id: auctionId,
      },
      select: {
        id: true,
        title: true,
        currentStage: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Lelang tidak ditemukan." },
        { status: 404 }
      );
    }

    // Find the highest valid revealed bid.
    const result = await prisma.$transaction(async (tx) => {
      const highestBid = await tx.bid.findFirst({
        where: {
          auctionId,
          status: "REVEALED",
          revealedAmount: {
            not: null,
          },
        },
        orderBy: [
          {
            revealedAmount: "desc",
          },
          {
            id: "asc",
          },
        ],
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      await tx.auction.update({
        where: {
          id: auctionId,
        },
        data: {
          currentStage: "COMPLETED",
          winnerId: highestBid?.userId ?? null,
          winningBidAmount: highestBid?.revealedAmount ?? null,
          winningBidHash: highestBid?.commitmentHash ?? null,
        },
      });

      return highestBid;
    });

    if (result) {
      const winningAmount = Number(result.revealedAmount);

      await recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "AUCTION_FINALIZE",
        severity: "INFO",
        details: {
          auctionId,
          winnerId: result.userId,
          winnerUsername: result.user.username,
          winningAmount,
          winningHash: result.commitmentHash,
          manualFinalizeByAdmin: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Lelang resmi diselesaikan! Pemenang: ${result.user.username} dengan tawaran valid Rp ${winningAmount.toLocaleString("id-ID")}`,
        winner: {
          username: result.user.username,
          amount: winningAmount,
          hash: result.commitmentHash,
        },
      });
    }

    await recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "AUCTION_FINALIZE",
      severity: "WARN",
      details: {
        auctionId,
        message:
          "Lelang ditutup tanpa pemenang (tidak ada bid yang di-reveal secara valid).",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lelang selesai. Tidak ada penawaran valid yang di-reveal.",
    });
  } catch (error) {
    console.error("Finalize error:", error);

    return NextResponse.json(
      { error: "Gagal memfinalisasi lelang." },
      { status: 500 }
    );
  }
}