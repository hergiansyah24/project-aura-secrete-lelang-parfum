import { getDb } from "./db";

export type AuditAction =
  | "AUTH_REGISTER"
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "BID_COMMIT"
  | "BID_REVEAL_SUCCESS"
  | "BID_REVEAL_FRAUD"
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

export function recordAuditLog(entry: {
  userId?: number | null;
  userEmail?: string | null;
  action: AuditAction;
  severity?: AuditSeverity;
  details: Record<string, unknown> | string;
  ipAddress?: string | null;
}): void {
  try {
    const db = getDb();
    const severity = entry.severity || (entry.action.includes("FRAUD") ? "CRITICAL" : "INFO");
    const detailsStr = typeof entry.details === "string" ? entry.details : JSON.stringify(entry.details);

    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, severity, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      entry.userId ?? null,
      entry.userEmail ?? null,
      entry.action,
      severity,
      detailsStr,
      entry.ipAddress ?? "127.0.0.1"
    );
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}

