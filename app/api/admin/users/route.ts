import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decryptSensitiveData } from "@/lib/crypto";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isFlagged: true,
        flagReason: true,
        fullNameEncrypted: true,
        phoneEncrypted: true,
        addressEncrypted: true,
        createdAt: true,
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });

    const decryptedUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      isFlagged: u.isFlagged,
      flagReason: u.flagReason,
      createdAt: u.createdAt,
      totalBids: u._count.bids,
      fullName: u.fullNameEncrypted
        ? decryptSensitiveData(u.fullNameEncrypted)
        : "-",
      phone: u.phoneEncrypted
        ? decryptSensitiveData(u.phoneEncrypted)
        : "-",
      address: u.addressEncrypted
        ? decryptSensitiveData(u.addressEncrypted)
        : "-",
      rawEncrypted: {
        fullName: u.fullNameEncrypted,
        phone: u.phoneEncrypted,
      },
    }));

    return NextResponse.json({ users: decryptedUsers });
  } catch (error) {
    console.error("GET admin users error:", error);

    return NextResponse.json(
      { error: "Gagal memuat pengguna." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, action, reason } = body;

    const targetUserId = Number(userId);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return NextResponse.json(
        { error: "User ID tidak valid." },
        { status: 400 }
      );
    }

    if (action === "toggle_flag") {
      const user = await prisma.user.findUnique({
        where: {
          id: targetUserId,
        },
        select: {
          id: true,
          username: true,
          isFlagged: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Pengguna tidak ditemukan." },
          { status: 404 }
        );
      }

      const newFlagState = !user.isFlagged;

      const newReason = newFlagState
        ? (typeof reason === "string" && reason.trim()
            ? reason.trim()
            : "Ditandai manual oleh Administrator")
        : null;

      await prisma.user.update({
        where: {
          id: targetUserId,
        },
        data: {
          isFlagged: newFlagState,
          flagReason: newReason,
        },
      });

      await recordAuditLog({
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

    return NextResponse.json(
      { error: "Aksi tidak dikenal." },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST admin users error:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui status pengguna." },
      { status: 500 }
    );
  }
}