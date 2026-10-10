import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak. Memerlukan hak akses Admin." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const action = searchParams.get("action");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);

    const db = getDb();
    let query = `
      SELECT l.*, u.username
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (severity && severity !== "ALL") {
      query += " AND l.severity = ?";
      params.push(severity);
    }

    if (action && action !== "ALL") {
      query += " AND l.action = ?";
      params.push(action);
    }

    query += " ORDER BY l.id DESC LIMIT ?";
    params.push(limit);

    const logs = db.prepare(query).all(...params);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET audit logs error:", error);
    return NextResponse.json({ error: "Gagal mengambil log audit." }, { status: 500 });
  }
}

