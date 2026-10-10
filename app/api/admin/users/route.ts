import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { decryptSensitiveData } from "@/lib/crypto";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const db = getDb();
    const users = db
      .prepare(`
        SELECT id, username, email, role, is_flagged, flag_reason,
               full_name_encrypted, phone_encrypted, address_encrypted,
               created_at,
               (SELECT COUNT(*) FROM bids WHERE bids.user_id = users.id) as total_bids
        FROM users
        ORDER BY id DESC
      `)
      .all() as Array<Record<string, unknown>>;

    const decryptedUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      isFlagged: Boolean(u.is_flagged),
      flagReason: u.flag_reason,
      createdAt: u.created_at,
      totalBids: u.total_bids,
      fullName: u.full_name_encrypted ? decryptSensitiveData(u.full_name_encrypted as string) : "-",
      phone: u.phone_encrypted ? decryptSensitiveData(u.phone_encrypted as string) : "-",
      address: u.address_encrypted ? decryptSensitiveData(u.address_encrypted as string) : "-",
      rawEncrypted: {
        fullName: u.full_name_encrypted,
        phone: u.phone_encrypted,
      },
    }));

    return NextResponse.json({ users: decryptedUsers });
  } catch (error) {
    console.error("GET admin users error:", error);
    return NextResponse.json({ error: "Gagal memuat pengguna." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, reason } = body;

    const targetUserId = Number(userId);
    if (!targetUserId) {
      return NextResponse.json({ error: "User ID tidak valid." }, { status: 400 });
    }

    const db = getDb();

    if (action === "toggle_flag") {
      const user = db.prepare("SELECT id, username, is_flagged FROM users WHERE id = ?").get(targetUserId) as
        | { id: number; username: string; is_flagged: number }
        | undefined;

      if (!user) {
        return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
      }

      const newFlagState = user.is_flagged ? 0 : 1;
      const newReason = newFlagState ? (reason || "Ditandai manual oleh Administrator") : null;

      db.prepare("UPDATE users SET is_flagged = ?, flag_reason = ? WHERE id = ?").run(
        newFlagState,
        newReason,
        targetUserId
      );

      recordAuditLog({
        userId: currentUser.id,
        userEmail: currentUser.email,
        action: "USER_FLAGGED",
        severity: newFlagState ? "CRITICAL" : "INFO",
        details: {
          targetUserId,
          targetUsername: user.username,
          newFlagState,
          reason: newReason,
        },
      });

      return NextResponse.json({
        success: true,
        message: newFlagState
          ? `Akun ${user.username} berhasil dibekukan/ditandai.`
          : `Pembekuan akun ${user.username} berhasil dicabut.`,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    console.error("POST admin users error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status pengguna." }, { status: 500 });
  }
}

