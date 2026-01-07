/*
  Warnings:

  - A unique constraint covering the columns `[fileName]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ownerId,displayName]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayName` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "displayName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Image_fileName_key" ON "Image"("fileName");

-- CreateIndex
CREATE UNIQUE INDEX "Image_ownerId_displayName_key" ON "Image"("ownerId", "displayName");
