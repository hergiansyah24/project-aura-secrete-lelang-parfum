import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const db = getDb();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Reset stages and unflag test users
    db.prepare("UPDATE users SET is_flagged = 0, flag_reason = NULL WHERE username != 'admin'").run();

    // Reset Auction 1 to COMMIT stage (2 hours left)
    db.prepare(`
      UPDATE auctions
      SET current_stage = 'COMMIT',
          commit_end_time = ?,
          reveal_end_time = ?,
          winner_id = NULL,
          winning_bid_amount = NULL,
          winning_bid_hash = NULL
      WHERE id = 1
    `).run(
      new Date(now + 2 * oneHour).toISOString(),
      new Date(now + 6 * oneHour).toISOString()
    );

    // Reset Auction 3 to REVEAL stage (Ready to reveal!)
    db.prepare(`
      UPDATE auctions
      SET current_stage = 'REVEAL',
          commit_end_time = ?,
          reveal_end_time = ?,
          winner_id = NULL,
          winning_bid_amount = NULL,
          winning_bid_hash = NULL
      WHERE id = 3
    `).run(
      new Date(now - 30 * 60 * 1000).toISOString(),
      new Date(now + 3 * oneHour).toISOString()
    );

    recordAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "AUCTION_UPDATE",
      severity: "WARN",
      details: { reset: "DEMO_STAGES_RESET" },
    });

    return NextResponse.json({
      success: true,
      message: "Data demo lelang berhasil di-reset untuk simulasi presentasi.",
    });
  } catch (error) {
    console.error("Demo reset error:", error);
    return NextResponse.json({ error: "Gagal me-reset demo." }, { status: 500 });
  }
}

