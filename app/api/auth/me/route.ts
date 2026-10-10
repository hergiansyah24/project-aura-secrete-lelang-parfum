import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { decryptSensitiveData } from "@/lib/crypto";

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ user: null });
  }

  const db = getDb();
  const profile = db
    .prepare(`
      SELECT id, username, email, role, full_name_encrypted, phone_encrypted, address_encrypted,
             is_flagged, flag_reason, created_at
      FROM users
      WHERE id = ?
    `)
    .get(sessionUser.id) as
    | {
        id: number;
        username: string;
        email: string;
        role: "admin" | "bidder";
        full_name_encrypted: string | null;
        phone_encrypted: string | null;
        address_encrypted: string | null;
        is_flagged: number;
        flag_reason: string | null;
        created_at: string;
      }
    | undefined;

  if (!profile) {
    return NextResponse.json({ user: null });
  }

  // Decrypt AES-256-GCM ciphertext for user profile viewing
  const decryptedFullName = profile.full_name_encrypted
    ? decryptSensitiveData(profile.full_name_encrypted)
    : "";
  const decryptedPhone = profile.phone_encrypted
    ? decryptSensitiveData(profile.phone_encrypted)
    : "";
  const decryptedAddress = profile.address_encrypted
    ? decryptSensitiveData(profile.address_encrypted)
    : "";

  return NextResponse.json({
    user: {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      role: profile.role,
      isFlagged: Boolean(profile.is_flagged),
      flagReason: profile.flag_reason,
      createdAt: profile.created_at,
      profile: {
        fullName: decryptedFullName,
        phone: decryptedPhone,
        address: decryptedAddress,
        // Also provide ciphertexts for crypto inspection demo!
        rawEncrypted: {
          fullNameCiphertext: profile.full_name_encrypted,
          phoneCiphertext: profile.phone_encrypted,
          addressCiphertext: profile.address_encrypted,
        },
      },
    },
  });
}

