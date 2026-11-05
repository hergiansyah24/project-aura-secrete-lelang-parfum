import { prisma } from "./prisma";

export type AuditAction =
  | "AUTH_REGISTER"
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "BID_COMMIT"
  | "BID_REVEAL_SUCCESS"
  | "BID_REVEAL_FRAUD"
  | "BID_DELETE"
  | "AUCTION_CREATE"
  | "AUCTION_UPDATE"
  | "AUCTION_STAGE_CHANGE"
  | "AUCTION_FINALIZE"
  | "USER_FLAGGED"
  | "SECURITY_RATE_LIMIT";

export type AuditSeverity = "INFO" | "WARN" | "CRITICAL";

export interface AuditLogEntry {
  id?: number;
  userId?: number | null;
  userEmail?: string | null;
  action: AuditAction;
  severity: AuditSeverity;
  details: Record<string, unknown> | string;
  ipAddress?: string | null;
  createdAt?: string;
}

export async function recordAuditLog(entry: {
  userId?: number | null;
  userEmail?: string | null;
  action: AuditAction;
  severity?: AuditSeverity;
  details: Record<string, unknown> | string;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    const severity =
      entry.severity ||
      (entry.action.includes("FRAUD") ? "CRITICAL" : "INFO");

    const detailsStr =
      typeof entry.details === "string"
        ? entry.details
        : JSON.stringify(entry.details);

    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        userEmail: entry.userEmail ?? null,
        action: entry.action,
        severity,
        details: detailsStr,
        ipAddress: entry.ipAddress ?? "127.0.0.1",
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
