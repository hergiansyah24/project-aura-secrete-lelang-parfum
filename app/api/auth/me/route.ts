import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSensitiveData } from "@/lib/crypto";
import { unstable_rethrow } from "next/navigation";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();

    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    const profile = await prisma.user.findUnique({
      where: {
        id: sessionUser.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        fullNameEncrypted: true,
        phoneEncrypted: true,
        addressEncrypted: true,
        isFlagged: true,
        flagReason: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ user: null });
    }

    const decryptedFullName = profile.fullNameEncrypted
      ? decryptSensitiveData(profile.fullNameEncrypted)
      : "";

    const decryptedPhone = profile.phoneEncrypted
      ? decryptSensitiveData(profile.phoneEncrypted)
      : "";

    const decryptedAddress = profile.addressEncrypted
      ? decryptSensitiveData(profile.addressEncrypted)
      : "";

    return NextResponse.json({
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role,
        isFlagged: profile.isFlagged,
        flagReason: profile.flagReason,
        createdAt: profile.createdAt,
        profile: {
          fullName: decryptedFullName,
          phone: decryptedPhone,
          address: decryptedAddress,
          rawEncrypted: {
            fullNameCiphertext: profile.fullNameEncrypted,
            phoneCiphertext: profile.phoneEncrypted,
            addressCiphertext: profile.addressEncrypted,
          },
        },
      },
    });
  } catch (error) {
  unstable_rethrow(error);

  console.error("Get profile error:", error);

  return NextResponse.json(
    { error: "Terjadi kesalahan internal server." },
    { status: 500 }
  );
}
}