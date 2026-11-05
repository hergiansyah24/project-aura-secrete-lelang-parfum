import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 60);

    if (!rateLimit.allowed) {
      await recordAuditLog({
        action: "SECURITY_RATE_LIMIT",
        severity: "WARN",
        details: {
          endpoint: "/api/auth/login",
          retryAfter: rateLimit.retryAfterSeconds,
        },
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login. Coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/Email dan password harus diisi." },
        { status: 400 }
      );
    }

    const sanitizedIdentifier = String(identifier).trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: sanitizedIdentifier },
          { email: sanitizedIdentifier },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        role: true,
        isFlagged: true,
        flagReason: true,
      },
    });

    if (!user) {
      await recordAuditLog({
        action: "AUTH_LOGIN",
        severity: "WARN",
        details: {
          attempt: sanitizedIdentifier,
          status: "FAILED_USER_NOT_FOUND",
        },
        ipAddress: ip,
      });

      return NextResponse.json(
        { error: "Kredensial tidak valid." },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      await recordAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: "AUTH_LOGIN",
        severity: "WARN",
        details: {
          attempt: sanitizedIdentifier,
          status: "FAILED_WRONG_PASSWORD",
        },
        ipAddress: ip,
      });

      return NextResponse.json(
        { error: "Kredensial tidak valid." },
        { status: 401 }
      );
    }

    await recordAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: "AUTH_LOGIN",
      severity: user.isFlagged ? "WARN" : "INFO",
      details: {
        username: user.username,
        role: user.role,
        isFlagged: user.isFlagged,
      },
      ipAddress: ip,
    });

    const token = await signSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role as "admin" | "bidder",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isFlagged: user.isFlagged,
        flagReason: user.flagReason,
      },
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
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
