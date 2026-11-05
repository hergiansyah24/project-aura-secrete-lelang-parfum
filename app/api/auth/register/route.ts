import { NextRequest, NextResponse } from "next/server";
import { registerSchema, firstErrorMessage } from "@/schema";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken } from "@/lib/auth";
import { encryptSensitiveData } from "@/lib/crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`register:${ip}`, 5, 60);

    if (!rateLimit.allowed) {
      await recordAuditLog({
        action: "SECURITY_RATE_LIMIT",
        severity: "WARN",
        details: {
          endpoint: "/api/auth/register",
          retryAfter: rateLimit.retryAfterSeconds,
        },
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan. Harap tunggu ${rateLimit.retryAfterSeconds} detik.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body: unknown = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: firstErrorMessage(validation.error),
          fields: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      username: sanitizedUsername,
      email: sanitizedEmail,
      password,
      fullName,
      phone,
      address,
    } = validation.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: sanitizedUsername },
          { email: sanitizedEmail },
        ],
      },
      select: {
        username: true,
        email: true,
      },
    });

    if (existing) {
      if (existing.username === sanitizedUsername) {
        return NextResponse.json(
          { error: "Username sudah digunakan." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const encryptedFullName = encryptSensitiveData(
      (fullName || "").trim()
    );
    const encryptedPhone = encryptSensitiveData(
      (phone || "").trim()
    );
    const encryptedAddress = encryptSensitiveData(
      (address || "").trim()
    );

    const newUser = await prisma.user.create({
      data: {
        username: sanitizedUsername,
        email: sanitizedEmail,
        passwordHash,
        role: "bidder",
        fullNameEncrypted: encryptedFullName,
        phoneEncrypted: encryptedPhone,
        addressEncrypted: encryptedAddress,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    await recordAuditLog({
      userId: newUser.id,
      userEmail: newUser.email,
      action: "AUTH_REGISTER",
      severity: "INFO",
      details: {
        username: sanitizedUsername,
        crypto: "AES-256-GCM applied to PII data",
      },
      ipAddress: ip,
    });

    const token = await signSessionToken({
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: "bidder",
    });

    const response = NextResponse.json({
      success: true,
      message: "Registrasi berhasil dengan data profil terenkripsi AES-256-GCM.",
      user: newUser,
    });

    response.cookies.set("sealed_bid_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}