
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const bids = await prisma.bid.findMany({
      orderBy: { committedAt: "desc" },
      select: {
        id: true,
        auctionId: true,
        userId: true,
        commitmentHash: true,
        status: true,
        revealedAmount: true,
        committedAt: true,
        revealedAt: true,
        auction: {
          select: {
            title: true,
            currentStage: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    const formattedBids = bids.map((bid) => ({
      id: bid.id,
      auctionId: bid.auctionId,
      userId: bid.userId,
      commitmentHash: bid.commitmentHash,
      status: bid.status,
      revealedAmount:
        bid.revealedAmount !== null ? Number(bid.revealedAmount) : null,
      committedAt: bid.committedAt,
      revealedAt: bid.revealedAt,
      auction: {
        title: bid.auction.title,
        currentStage: bid.auction.currentStage,
      },
      user: {
        username: bid.user.username,
      },
    }));

    return NextResponse.json({ bids: formattedBids });
  } catch (error) {
    console.error("GET admin bids error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data penawaran." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const bidId = Number(body.bidId);

    if (!Number.isInteger(bidId) || bidId <= 0) {
      return NextResponse.json(
        { error: "ID penawaran tidak valid." },
        { status: 400 }
      );
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            currentStage: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!bid) {
      return NextResponse.json(
        { error: "Penawaran tidak ditemukan." },
        { status: 404 }
      );
    }

    // Hanya izinkan penghapusan bid pada lelang yang sudah selesai.
    if (bid.auction.currentStage !== "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "Penawaran hanya dapat dihapus setelah lelang selesai.",
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.bid.delete({
        where: { id: bidId },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userEmail: currentUser.email,
          action: "BID_DELETE",
          severity: "WARN",
          details: JSON.stringify({
            bidId,
            auctionId: bid.auctionId,
            auctionTitle: bid.auction.title,
            bidderUsername: bid.user.username,
            deletedStatus: bid.status,
          }),
          ipAddress: "127.0.0.1",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Penawaran berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE admin bid error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus penawaran." },
      { status: 500 }
    );
  }
}
