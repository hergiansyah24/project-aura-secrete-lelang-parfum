import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, signSessionToken } from "@/lib/auth";
import { encryptSensitiveData } from "@/lib/crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`register:${ip}`, 5, 60);

    if (!rateLimit.allowed) {
      recordAuditLog({
        action: "SECURITY_RATE_LIMIT",
        severity: "WARN",
        details: { endpoint: "/api/auth/register", retryAfter: rateLimit.retryAfterSeconds },
        ipAddress: ip,
      });

      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Harap tunggu ${rateLimit.retryAfterSeconds} detik.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = await req.json();
    const { username, email, password, fullName, phone, address } = body;

    // Validation & Sanitization
    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return NextResponse.json({ error: "Username minimal 3 karakter." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }

    const sanitizedUsername = username.trim().toLowerCase();
    const sanitizedEmail = email.trim().toLowerCase();

    const db = getDb();

    // Check existing username or email with Prepared Statements
    const existing = db
      .prepare("SELECT id, username, email FROM users WHERE username = ? OR email = ?")
      .get(sanitizedUsername, sanitizedEmail) as { id: number; username: string; email: string } | undefined;

    if (existing) {
      if (existing.username === sanitizedUsername) {
        return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
      }
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    // Cryptographic Operations:
    // 1. Password hashing with bcrypt (Cost factor 10)
    const passwordHash = await hashPassword(password);

    // 2. Encrypt Personally Identifiable Information (PII) using AES-256-GCM
    const encryptedFullName = encryptSensitiveData((fullName || "").trim());
    const encryptedPhone = encryptSensitiveData((phone || "").trim());
    const encryptedAddress = encryptSensitiveData((address || "").trim());

    // Anti-SQL-Injection: Prepared Statement Insertion
    const insertStmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, full_name_encrypted, phone_encrypted, address_encrypted)
      VALUES (?, ?, ?, 'bidder', ?, ?, ?)
    `);

    const result = insertStmt.run(
      sanitizedUsername,
      sanitizedEmail,
      passwordHash,
      encryptedFullName,
      encryptedPhone,
      encryptedAddress
    );

    const newUserId = Number(result.lastInsertRowid);

    // Record Audit Trail
    recordAuditLog({
      userId: newUserId,
      userEmail: sanitizedEmail,
      action: "AUTH_REGISTER",
      severity: "INFO",
      details: {
        username: sanitizedUsername,
        crypto: "AES-256-GCM applied to PII data",
      },
      ipAddress: ip,
    });

    // Create session token
    const token = await signSessionToken({
      userId: newUserId,
      username: sanitizedUsername,
      email: sanitizedEmail,
      role: "bidder",
    });

    const response = NextResponse.json({
      success: true,
      message: "Registrasi berhasil dengan data profil terenkripsi AES-256-GCM.",
      user: {
        id: newUserId,
        username: sanitizedUsername,
        email: sanitizedEmail,
        role: "bidder",
      },
    });

    response.cookies.set("sealed_bid_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}

