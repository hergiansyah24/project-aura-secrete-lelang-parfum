import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    recordAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: "AUTH_LOGOUT",
      severity: "INFO",
      details: { username: user.username },
    });
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete("sealed_bid_session");
  return response;
}

