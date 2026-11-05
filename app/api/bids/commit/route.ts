import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit";
import { syncAuctionStages } from "@/lib/auction-sync";

export async function POST(req: NextRequest) {
  try {
    await syncAuctionStages();

    const ip = getClientIp(req.headers);

    // Rate Limiting: 10 commit submissions per minute.
    const rateLimit = checkRateLimit(`bid_commit:${ip}`, 10, 60);

    if (!rateLimit.allowed) {
      await recordAuditLog({
        action: "SECURITY_RATE_LIMIT",
        severity: "WARN",
        details: {
          endpoint: "/api/bids/commit",
          retryAfter: rateLimit.retryAfterSeconds,
        },
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          error: `Spam bidding dicegah. Harap tunggu ${rateLimit.retryAfterSeconds} detik.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Anda harus login untuk mengajukan penawaran." },
        { status: 401 }
      );
    }

    // Reject flagged accounts.
    if (currentUser.isFlagged) {
      await recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "USER_FLAGGED",
        severity: "CRITICAL",
        details: {
          attempt: "FLAGGED_USER_TRIED_BIDDING",
          reason: currentUser.flagReason,
        },
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          error: `AKSES DITOLAK: Akun Anda ditandai mencurigakan oleh sistem keamanan. Alasan: ${
            currentUser.flagReason || "Pelanggaran integritas lelang"
          }`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { auctionId, commitmentHash } = body;

    const parsedAuctionId = Number(auctionId);

    if (
      !Number.isSafeInteger(parsedAuctionId) ||
      parsedAuctionId <= 0
    ) {
      return NextResponse.json(
        { error: "ID lelang tidak valid." },
        { status: 400 }
      );
    }

    // Validate SHA-256 commitment hash.
    if (
      !commitmentHash ||
      typeof commitmentHash !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(commitmentHash.trim())
    ) {
      return NextResponse.json(
        {
          error:
            "Format commitment hash tidak valid. Harus berupa 64-karakter SHA-256 hex string.",
        },
        { status: 400 }
      );
    }

    const normalizedHash = commitmentHash.trim().toLowerCase();

    // Check auction validity and stage in PostgreSQL.
    const auction = await prisma.auction.findUnique({
      where: {
        id: parsedAuctionId,
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

    if (auction.currentStage !== "COMMIT") {
      return NextResponse.json(
        {
          error: `Fase pengajuan tertutup (COMMIT) sudah berakhir. Status lelang saat ini: ${auction.currentStage}`,
        },
        { status: 400 }
      );
    }

    // Save or update the user's commitment.
    // Bid amount and nonce are not sent during this phase.
    await prisma.bid.upsert({
      where: {
        auctionId_userId: {
          auctionId: parsedAuctionId,
          userId: currentUser.id,
        },
      },
      update: {
        commitmentHash: normalizedHash,
        status: "COMMITTED",
        committedAt: new Date(),
      },
      create: {
        auctionId: parsedAuctionId,
        userId: currentUser.id,
        commitmentHash: normalizedHash,
        status: "COMMITTED",
        committedAt: new Date(),
      },
    });

    // Record audit log in PostgreSQL.
    await recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "BID_COMMIT",
      severity: "INFO",
      details: {
        auctionId: parsedAuctionId,
        auctionTitle: auction.title,
        commitmentHash: normalizedHash,
        cryptographicScheme: "SHA-256 Sealed Hash Commitment",
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message:
        "Komitmen penawaran terenkripsi SHA-256 berhasil dicatat di server.",
      commitmentHash: normalizedHash,
    });
  } catch (error) {
    console.error("Bid commit error:", error);

    return NextResponse.json(
      { error: "Gagal memproses komitmen penawaran." },
      { status: 500 }
    );
  }
}