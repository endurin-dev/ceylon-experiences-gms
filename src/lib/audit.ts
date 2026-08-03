import { prisma } from "@/lib/prisma";

export async function logAudit(entry: {
  userId?: string;
  action: string;
  module?: string;
  recordId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        module: entry.module,
        recordId: entry.recordId,
        details: entry.details as any,
      },
    });
  } catch (err) {
    // Audit logging must never break the calling operation.
    console.error("Failed to write audit log", err);
  }
}
