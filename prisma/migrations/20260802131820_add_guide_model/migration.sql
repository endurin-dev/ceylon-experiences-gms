-- AlterEnum
ALTER TYPE "ModuleName" ADD VALUE 'GUIDES';

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "languages" TEXT,
    "specialization" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guide_licenseNumber_key" ON "Guide"("licenseNumber");

-- CreateIndex
CREATE INDEX "Guide_licenseNumber_idx" ON "Guide"("licenseNumber");
