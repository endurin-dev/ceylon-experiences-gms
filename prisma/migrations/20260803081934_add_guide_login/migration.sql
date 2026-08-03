/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Guide` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Guide" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Guide_username_key" ON "Guide"("username");

-- CreateIndex
CREATE INDEX "Guide_username_idx" ON "Guide"("username");
