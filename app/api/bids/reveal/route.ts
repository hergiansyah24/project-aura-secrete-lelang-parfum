import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { verifyCommitmentHash, computeCommitmentHash } from "@/lib/crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit";
import { syncAuctionStages } from "@/lib/auction-sync";

export async function POST(req: NextRequest) {
  try {
    syncAuctionStages();
    const ip = getClientIp(req.headers);

    // Rate Limiting: 10 reveals per minute
    const rateLimit = checkRateLimit(`bid_reveal:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      recordAuditLog({
        action: "SECURITY_RATE_LIMIT",
        severity: "WARN",
        details: { endpoint: "/api/bids/reveal", retryAfter: rateLimit.retryAfterSeconds },
        ipAddress: ip,
      });

      return NextResponse.json(
        { error: `Terlalu banyak permintaan reveal. Harap tunggu ${rateLimit.retryAfterSeconds} detik.` },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Anda harus login untuk membuka penawaran." }, { status: 401 });
    }

    if (currentUser.isFlagged) {
      return NextResponse.json(
        { error: "Akun Anda telah ditangguhkan karena pelanggaran integritas keamanan." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { auctionId, bidAmount, nonce } = body;

    const parsedAuctionId = Number(auctionId);
    const parsedBidAmount = Number(bidAmount);

    if (!parsedAuctionId || isNaN(parsedAuctionId)) {
      return NextResponse.json({ error: "ID lelang tidak valid." }, { status: 400 });
    }

    if (!parsedBidAmount || isNaN(parsedBidAmount) || parsedBidAmount <= 0) {
      return NextResponse.json({ error: "Nominal penawaran tidak valid." }, { status: 400 });
    }

    if (!nonce || typeof nonce !== "string" || nonce.trim().length === 0) {
      return NextResponse.json({ error: "Secret Nonce diperlukan untuk membuka penawaran." }, { status: 400 });
    }

    const cleanNonce = nonce.trim();
    const db = getDb();

    // Verify auction exists and is in REVEAL stage
    const auction = db
      .prepare("SELECT id, title, starting_price, current_stage FROM auctions WHERE id = ?")
      .get(parsedAuctionId) as
      | { id: number; title: string; starting_price: number; current_stage: string }
      | undefined;

    if (!auction) {
      return NextResponse.json({ error: "Lelang tidak ditemukan." }, { status: 404 });
    }

    if (auction.current_stage !== "REVEAL") {
      return NextResponse.json(
        {
          error: `Fase pembukaan (REVEAL) belum dibuka atau sudah selesai. Status saat ini: ${auction.current_stage}`,
        },
        { status: 400 }
      );
    }

    // Check minimum starting price
    if (parsedBidAmount < auction.starting_price) {
      return NextResponse.json(
        {
          error: `Nominal bid (Rp ${parsedBidAmount.toLocaleString("id-ID")}) tidak boleh lebih rendah dari starting price (Rp ${auction.starting_price.toLocaleString("id-ID")}).`,
        },
        { status: 400 }
      );
    }

    // Retrieve user's stored commitment
    const bidRecord = db
      .prepare(`
        SELECT id, commitment_hash, status
        FROM bids
        WHERE auction_id = ? AND user_id = ?
      `)
      .get(parsedAuctionId, currentUser.id) as
      | { id: number; commitment_hash: string; status: string }
      | undefined;

    if (!bidRecord) {
      return NextResponse.json(
        { error: "Anda belum mengajukan komitmen penawaran pada lelang ini." },
        { status: 404 }
      );
    }

    if (bidRecord.status === "REVEALED") {
      return NextResponse.json(
        { error: "Penawaran Anda sudah berhasil dibuka sebelumnya." },
        { status: 400 }
      );
    }

    // ==========================================================
    // CRITICAL CRYPTOGRAPHIC VERIFICATION (Commit-Reveal Validation)
    // Server independently recalculates SHA-256(auctionId:bidAmount:nonce)
    // and performs constant-time comparison against the stored hash.
    // ==========================================================
    const isHashValid = verifyCommitmentHash(
      parsedAuctionId,
      parsedBidAmount,
      cleanNonce,
      bidRecord.commitment_hash
    );

    const recomputedHash = computeCommitmentHash(parsedAuctionId, parsedBidAmount, cleanNonce);

    if (isHashValid) {
      // ✅ SUCCESSFUL VERIFIED REVEAL
      db.prepare(`
        UPDATE bids
        SET status = 'REVEALED',
            revealed_amount = ?,
            revealed_nonce = ?,
            revealed_at = datetime('now')
        WHERE id = ?
      `).run(parsedBidAmount, cleanNonce, bidRecord.id);

      recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "BID_REVEAL_SUCCESS",
        severity: "INFO",
        details: {
          auctionId: parsedAuctionId,
          auctionTitle: auction.title,
          revealedAmount: parsedBidAmount,
          matchedCommitmentHash: bidRecord.commitment_hash,
          verificationResult: "CRYPTOGRAPHICALLY_VERIFIED_MATCH",
        },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        verified: true,
        message: "Penawaran berhasil dibuka dan diverifikasi secara kriptografis!",
        details: {
          bidAmount: parsedBidAmount,
          commitmentHash: bidRecord.commitment_hash,
          revealedAt: new Date().toISOString(),
        },
      });
    } else {
      // ❌ FRAUD / TAMPER DETECTED: Anti-Cheat Mechanism Triggered!
      db.prepare(`
        UPDATE bids
        SET status = 'TAMPERED_REJECTED',
            revealed_amount = ?,
            revealed_nonce = ?,
            revealed_at = datetime('now')
        WHERE id = ?
      `).run(parsedBidAmount, cleanNonce, bidRecord.id);

      // Flag user account for malicious integrity tampering
      const flagReason = `Percobaan manipulasi hash pada lelang "${auction.title}" (ID #${parsedAuctionId}). Hash asli dan hash pembukaan tidak identik.`;
      db.prepare(`
        UPDATE users
        SET is_flagged = 1,
            flag_reason = ?
        WHERE id = ?
      `).run(flagReason, currentUser.id);

      recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "BID_REVEAL_FRAUD",
        severity: "CRITICAL",
        details: {
          auctionId: parsedAuctionId,
          auctionTitle: auction.title,
          submittedBidAmount: parsedBidAmount,
          storedCommitmentHash: bidRecord.commitment_hash,
          attemptedHash: recomputedHash,
          securityAlert: "HASH_MISMATCH_SUSPECTED_BID_TAMPERING",
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
            storedCommitmentHash: bidRecord.commitment_hash,
            recomputedHash: recomputedHash,
          },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Bid reveal error:", error);
    return NextResponse.json({ error: "Gagal memproses pembukaan penawaran." }, { status: 500 });
  }
}

