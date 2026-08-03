import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ModuleName } from "@prisma/client";

export type PermissionAction = "canView" | "canCreate" | "canEdit" | "canDelete" | "canImport" | "canExport";

/** Returns the signed-in session's user + role, or null if unauthenticated. */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as { id: string; name: string; email: string; username: string; role: string };
}

/** Server-side guard: throws if the current user lacks the given permission on a module. */
export async function requirePermission(module: ModuleName, action: PermissionAction) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  if (user.role === "SUPER_ADMIN") return user;

  const role = await prisma.role.findUnique({
    where: { name: user.role },
    include: { permissions: { where: { module } } },
  });

  const perm = role?.permissions[0];
  if (!perm || !perm[action]) throw new Error("FORBIDDEN");

  return user;
}
