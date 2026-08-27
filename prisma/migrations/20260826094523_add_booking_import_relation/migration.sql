-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "importId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_importId_idx" ON "Booking"("importId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ExcelImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
