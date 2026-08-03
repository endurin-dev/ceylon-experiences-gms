import { PrismaClient, ModuleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ALL_MODULES: ModuleName[] = [
  "GUESTS",
  "HOTELS",
  "BOOKINGS",
  "TOURS",
  "TRANSFERS",
  "USERS",
  "ROLES",
  "IMPORTS",
  "SETTINGS",
  "AUDIT_LOG",
];

async function main() {
  // --- Roles -----------------------------------------------------------
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN", description: "Full system access", isSystem: true },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN", description: "Manages tourism data modules", isSystem: true },
  });

  const dataEntryRole = await prisma.role.upsert({
    where: { name: "DATA_ENTRY" },
    update: {},
    create: { name: "DATA_ENTRY", description: "Imports and adds records", isSystem: true },
  });

  // --- Permissions -------------------------------------------------------
  for (const mod of ALL_MODULES) {
    await prisma.permission.upsert({
      where: { roleId_module: { roleId: superAdminRole.id, module: mod } },
      update: {},
      create: {
        roleId: superAdminRole.id,
        module: mod,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canImport: true,
        canExport: true,
      },
    });
  }

  const adminModules: ModuleName[] = ["GUESTS", "HOTELS", "BOOKINGS", "TOURS", "TRANSFERS"];
  for (const mod of adminModules) {
    await prisma.permission.upsert({
      where: { roleId_module: { roleId: adminRole.id, module: mod } },
      update: {},
      create: {
        roleId: adminRole.id,
        module: mod,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canImport: true,
        canExport: true,
      },
    });
  }

  const dataEntryModules: ModuleName[] = ["GUESTS", "HOTELS", "BOOKINGS", "TOURS", "TRANSFERS", "IMPORTS"];
  for (const mod of dataEntryModules) {
    await prisma.permission.upsert({
      where: { roleId_module: { roleId: dataEntryRole.id, module: mod } },
      update: {},
      create: {
        roleId: dataEntryRole.id,
        module: mod,
        canView: true,
        canCreate: true,
        canEdit: false,
        canDelete: false,
        canImport: true,
        canExport: false,
      },
    });
  }

  // --- Default Super Admin account ---------------------------------------
  const email = process.env.SUPER_ADMIN_EMAIL ?? "admin@ceylonexperiences.com";
  const username = process.env.SUPER_ADMIN_USERNAME ?? "superadmin";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Super Admin",
      username,
      email,
      passwordHash,
      status: "ACTIVE",
      roleId: superAdminRole.id,
    },
  });

  console.log("Seed complete.");
  console.log(`Super Admin login -> username: ${username}  email: ${email}`);
  console.log("Password is whatever was set in SUPER_ADMIN_PASSWORD (.env). Change it after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
