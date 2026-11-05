import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  verifyCommitmentHash,
  computeCommitmentHash,
} from "@/lib/crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit";
import { syncAuctionStages } from "@/lib/auction-sync";

export async function POST(req: NextRequest) {
  try {
    await syncAuctionStages();

    const ip = getClientIp(req.headers);

    // Rate limiting: 10 reveals per minute
    const rateLimit = checkRateLimit(`bid_reveal:${ip}`, 10, 60);

    if (!rateLimit.allowed) {
      await recordAuditLog({
        action: "SECURITY_RATE_LIMIT",
        severity: "WARN",
        details: {
          endpoint: "/api/bids/reveal",
          retryAfter: rateLimit.retryAfterSeconds,
        },
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan reveal. Harap tunggu ${rateLimit.retryAfterSeconds} detik.`,
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
        { error: "Anda harus login untuk membuka penawaran." },
        { status: 401 }
      );
    }

    if (currentUser.isFlagged) {
      return NextResponse.json(
        {
          error:
            "Akun Anda telah ditangguhkan karena pelanggaran integritas keamanan.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { auctionId, bidAmount, nonce } = body;

    const parsedAuctionId = Number(auctionId);
    const parsedBidAmount = Number(bidAmount);

    if (
      !Number.isSafeInteger(parsedAuctionId) ||
      parsedAuctionId <= 0
    ) {
      return NextResponse.json(
        { error: "ID lelang tidak valid." },
        { status: 400 }
      );
    }

    if (
      !Number.isSafeInteger(parsedBidAmount) ||
      parsedBidAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Nominal penawaran tidak valid." },
        { status: 400 }
      );
    }

    if (
      !nonce ||
      typeof nonce !== "string" ||
      nonce.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Secret Nonce diperlukan untuk membuka penawaran.",
        },
        { status: 400 }
      );
    }

    const cleanNonce = nonce.trim();

    // Verify auction exists and is in REVEAL stage
    const auction = await prisma.auction.findUnique({
      where: { id: parsedAuctionId },
      select: {
        id: true,
        title: true,
        startingPrice: true,
        currentStage: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Lelang tidak ditemukan." },
        { status: 404 }
      );
    }

    if (auction.currentStage !== "REVEAL") {
      return NextResponse.json(
        {
          error: `Fase pembukaan (REVEAL) belum dibuka atau sudah selesai. Status saat ini: ${auction.currentStage}`,
        },
        { status: 400 }
      );
    }

    const startingPrice = Number(auction.startingPrice);

    if (parsedBidAmount < startingPrice) {
      return NextResponse.json(
        {
          error: `Nominal bid (Rp ${parsedBidAmount.toLocaleString("id-ID")}) tidak boleh lebih rendah dari starting price (Rp ${startingPrice.toLocaleString("id-ID")}).`,
        },
        { status: 400 }
      );
    }

    // Retrieve user's stored commitment
    const bidRecord = await prisma.bid.findUnique({
      where: {
        auctionId_userId: {
          auctionId: parsedAuctionId,
          userId: currentUser.id,
        },
      },
      select: {
        id: true,
        commitmentHash: true,
        status: true,
      },
    });

    if (!bidRecord) {
      return NextResponse.json(
        {
          error:
            "Anda belum mengajukan komitmen penawaran pada lelang ini.",
        },
        { status: 404 }
      );
    }

    if (bidRecord.status === "REVEALED") {
      return NextResponse.json(
        {
          error:
            "Penawaran Anda sudah berhasil dibuka sebelumnya.",
        },
        { status: 400 }
      );
    }

    if (bidRecord.status === "TAMPERED_REJECTED") {
  return NextResponse.json(
    {
      error:
        "Penawaran Anda telah ditolak karena terdeteksi manipulasi.",
    },
    { status: 400 }
  );
}

    // Cryptographic verification
    const isHashValid = verifyCommitmentHash(
      parsedAuctionId,
      parsedBidAmount,
      cleanNonce,
      bidRecord.commitmentHash
    );

    const recomputedHash = computeCommitmentHash(
      parsedAuctionId,
      parsedBidAmount,
      cleanNonce
    );

    if (isHashValid) {
      // Save verified reveal
      const updated = await prisma.bid.updateMany({
        where: {
          id: bidRecord.id,
          status: "COMMITTED",
        },
        data: {
          status: "REVEALED",
          revealedAmount: BigInt(parsedBidAmount),
          revealedNonce: cleanNonce,
          revealedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        return NextResponse.json(
          {
            error:
              "Status penawaran telah berubah. Silakan muat ulang halaman.",
          },
          { status: 409 }
        );
      }

      await recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "BID_REVEAL_SUCCESS",
        severity: "INFO",
        details: {
          auctionId: parsedAuctionId,
          auctionTitle: auction.title,
          revealedAmount: parsedBidAmount,
          matchedCommitmentHash: bidRecord.commitmentHash,
          verificationResult:
            "CRYPTOGRAPHICALLY_VERIFIED_MATCH",
        },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        verified: true,
        message:
          "Penawaran berhasil dibuka dan diverifikasi secara kriptografis!",
        details: {
          bidAmount: parsedBidAmount,
          commitmentHash: bidRecord.commitmentHash,
          revealedAt: new Date().toISOString(),
        },
      });
    }

    // Fraud detected: reject bid and flag account atomically
    const flagReason = `Percobaan manipulasi hash pada lelang "${auction.title}" (ID #${parsedAuctionId}). Hash asli dan hash pembukaan tidak identik.`;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.bid.updateMany({
        where: {
          id: bidRecord.id,
          status: "COMMITTED",
        },
        data: {
          status: "TAMPERED_REJECTED",
          revealedAmount: BigInt(Math.trunc(parsedBidAmount)),
          revealedNonce: cleanNonce,
          revealedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new Error("BID_STATUS_CHANGED");
      }

      await tx.user.update({
        where: { id: currentUser.id },
        data: {
          isFlagged: true,
          flagReason,
        },
      });
    });

    await recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "BID_REVEAL_FRAUD",
      severity: "CRITICAL",
      details: {
        auctionId: parsedAuctionId,
        auctionTitle: auction.title,
        submittedBidAmount: parsedBidAmount,
        storedCommitmentHash: bidRecord.commitmentHash,
        attemptedHash: recomputedHash,
        securityAlert:
          "HASH_MISMATCH_SUSPECTED_BID_TAMPERING",
        accountActionTaken: "ACCOUNT_SUSPENDED_FLAGGED",
      },
      ipAddress: ip,
    });

    return NextResponse.json(
      {
        success: false,
        verified: false,
        fraudDetected: true,
        error:
          "PERINGATAN KEAMANAN SIBER: Hash tidak cocok! Sistem mendeteksi adanya modifikasi pada nominal tawaran atau secret nonce. Akun Anda telah ditandai (flagged) untuk audit anti-fraud.",
        debugComparison: {
          storedCommitmentHash: bidRecord.commitmentHash,
          recomputedHash,
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Bid reveal error:", error);

    return NextResponse.json(
      { error: "Gagal memproses pembukaan penawaran." },
      { status: 500 }
    );
  }
}