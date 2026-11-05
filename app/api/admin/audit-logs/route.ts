import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { unstable_rethrow } from "next/navigation";
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Memerlukan hak akses Admin." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const action = searchParams.get("action");

    const requestedLimit = Number(searchParams.get("limit")) || 100;
    const limit = Math.min(Math.max(requestedLimit, 1), 200);

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(severity && severity !== "ALL" ? { severity } : {}),
        ...(action && action !== "ALL" ? { action } : {}),
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      take: limit,
    });

    const processedLogs = logs.map((log) => ({
      ...log,
      user_id: log.userId,
      user_email: log.userEmail,
      ip_address: log.ipAddress,
      created_at: log.createdAt,
      username: log.user?.username ?? null,
    }));

    return NextResponse.json({ logs: processedLogs });
  } catch (error) {
  unstable_rethrow(error);

  console.error("GET audit logs error:", error);

  return NextResponse.json(
    { error: "Gagal mengambil log audit." },
    { status: 500 }
  );
}
}