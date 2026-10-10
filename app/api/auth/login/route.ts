import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, signSessionToken } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    // Rate Limiting: 5 attempts per 60 seconds (Anti Brute-Force)
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 60);

    if (!rateLimit.allowed) {
      recordAuditLog({
        action: "SECURITY_RATE_LIMIT",
        severity: "WARN",
        details: { endpoint: "/api/auth/login", retryAfter: rateLimit.retryAfterSeconds },
        ipAddress: ip,
      });

      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${rateLimit.retryAfterSeconds} detik.` },
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
      return NextResponse.json({ error: "Username/Email dan password harus diisi." }, { status: 400 });
    }

    const sanitizedIdentifier = String(identifier).trim().toLowerCase();
    const db = getDb();

    // Prepared Statement for SQL Injection prevention
    const user = db
      .prepare(`
        SELECT id, username, email, password_hash, role, is_flagged, flag_reason
        FROM users
        WHERE username = ? OR email = ?
      `)
      .get(sanitizedIdentifier, sanitizedIdentifier) as
      | {
          id: number;
          username: string;
          email: string;
          password_hash: string;
          role: "admin" | "bidder";
          is_flagged: number;
          flag_reason: string | null;
        }
      | undefined;

    if (!user) {
      recordAuditLog({
        action: "AUTH_LOGIN",
        severity: "WARN",
        details: { attempt: sanitizedIdentifier, status: "FAILED_USER_NOT_FOUND" },
        ipAddress: ip,
      });
      return NextResponse.json({ error: "Kredensial tidak valid." }, { status: 401 });
    }

    // Bcrypt Password Verification
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      recordAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: "AUTH_LOGIN",
        severity: "WARN",
        details: { attempt: sanitizedIdentifier, status: "FAILED_WRONG_PASSWORD" },
        ipAddress: ip,
      });
      return NextResponse.json({ error: "Kredensial tidak valid." }, { status: 401 });
    }

    // Record Successful Login in Audit Trail
    recordAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: "AUTH_LOGIN",
      severity: user.is_flagged ? "WARN" : "INFO",
      details: {
        username: user.username,
        role: user.role,
        isFlagged: Boolean(user.is_flagged),
      },
      ipAddress: ip,
    });

    // Generate JWT Session Token
    const token = await signSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isFlagged: Boolean(user.is_flagged),
        flagReason: user.flag_reason,
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
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}

