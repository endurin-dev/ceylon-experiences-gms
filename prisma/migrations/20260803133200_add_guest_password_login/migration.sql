/*
  Warnings:

  - A unique constraint covering the columns `[phoneNormalized]` on the table `Guest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "phoneNormalized" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Guest_phoneNormalized_key" ON "Guest"("phoneNormalized");

-- CreateIndex
CREATE INDEX "Guest_phoneNormalized_idx" ON "Guest"("phoneNormalized");
