-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "time" TEXT,
ALTER COLUMN "period" DROP NOT NULL;
