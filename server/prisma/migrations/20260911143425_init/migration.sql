-- CreateEnum
CREATE TYPE "MealAnalysisStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "status" "MealAnalysisStatus" NOT NULL DEFAULT 'QUEUED',
    "nutrition" JSONB,
    "healthScore" INTEGER,
    "healthAdvice" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "alternativeSuggestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT,
    "message" TEXT,
    "error" TEXT,
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MealAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "MealAnalysis_userId_createdAt_idx" ON "MealAnalysis"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MealAnalysis_status_idx" ON "MealAnalysis"("status");

-- AddForeignKey
ALTER TABLE "MealAnalysis" ADD CONSTRAINT "MealAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
