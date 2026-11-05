import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    await prisma.$transaction([
      // Reset flag pada akun selain admin.
      prisma.user.updateMany({
        where: {
          username: { not: "admin" },
        },
        data: {
          isFlagged: false,
          flagReason: null,
        },
      }),

      // Reset Auction 1 ke tahap COMMIT.
      prisma.auction.updateMany({
        where: { id: 1 },
        data: {
          currentStage: "COMMIT",
          commitEndTime: new Date(now + 2 * oneHour),
          revealEndTime: new Date(now + 6 * oneHour),
          winnerId: null,
          winningBidAmount: null,
          winningBidHash: null,
        },
      }),

      // Reset Auction 3 ke tahap REVEAL.
      prisma.auction.updateMany({
        where: { id: 3 },
        data: {
          currentStage: "REVEAL",
          commitEndTime: new Date(now - 30 * 60 * 1000),
          revealEndTime: new Date(now + 3 * oneHour),
          winnerId: null,
          winningBidAmount: null,
          winningBidHash: null,
        },
      }),
    ]);

    await recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "AUCTION_UPDATE",
      severity: "WARN",
      details: {
        reset: "DEMO_STAGES_RESET",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data demo lelang berhasil di-reset untuk simulasi presentasi.",
    });
  } catch (error) {
    console.error("Demo reset error:", error);

    return NextResponse.json(
      { error: "Gagal me-reset demo." },
      { status: 500 }
    );
  }
}