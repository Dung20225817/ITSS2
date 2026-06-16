import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { calculateMatchScore } from "../helper/matching.helper";
import { paginationHelper } from "../helper/pagination.helper";

const prisma = new PrismaClient();
const DEFAULT_MATCHING_BATCH_SIZE = 10;
const MAX_MATCHING_BATCH_SIZE = 100;

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// [POST] /api/v1/matching/run/:userId
export const runMatching = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { schedules: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const batchSize = Math.min(
      parsePositiveInt(
        req.query.batchSize || req.query.limit,
        DEFAULT_MATCHING_BATCH_SIZE
      ),
      MAX_MATCHING_BATCH_SIZE
    );
    const totalJobs = await prisma.job.count({
      where: { deleted: false },
    });
    const matchedJobIds: string[] = [];
    let processedJobs = 0;

    for (let skip = 0; skip < totalJobs; skip += batchSize) {
      const jobs = await prisma.job.findMany({
        where: { deleted: false },
        orderBy: { id: "asc" },
        take: batchSize,
        skip,
        include: { schedules: true }
      });

      for (const job of jobs) {
        processedJobs += 1;
        const { score, reasons } = calculateMatchScore(user, job);

        if (score >= 60) {
          matchedJobIds.push(job.id);

          // Find existing match
          const existingMatch = await prisma.matchResult.findFirst({
            where: { userId, jobId: job.id }
          });

          if (existingMatch) {
            await prisma.matchResult.update({
              where: { id: existingMatch.id },
              data: { score, reasons }
            });
          } else {
            await prisma.matchResult.create({
              data: {
                userId,
                jobId: job.id,
                score,
                reasons,
                status: "pending"
              }
            });
          }
        }
      }
    }

    await prisma.matchResult.deleteMany({
      where: {
        userId,
        ...(matchedJobIds.length > 0
          ? { jobId: { notIn: matchedJobIds } }
          : {}),
      },
    });

    res.status(200).json({
      message: `Successfully generated ${matchedJobIds.length} matches.`,
      matchCount: matchedJobIds.length,
      processedJobs,
      totalJobs,
      batchSize,
    });
  } catch (error) {
    console.error("Run Matching Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// [GET] /api/v1/matching/results/:userId
export const getMatches = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const countMatches = await prisma.matchResult.count({
      where: { userId },
    });

    const objectPagination = paginationHelper(
      {
        currentPage: 1,
        limitItems: parseInt(req.query.limit as string) || 9,
      },
      req.query,
      countMatches
    );

    const matches = await prisma.matchResult.findMany({
      where: { userId },
      include: {
        job: {
          include: { company: true, schedules: true }
        }
      },
      orderBy: { score: 'desc' },
      take: objectPagination.limitItems,
      skip: objectPagination.skip,
    });

    res.status(200).json({
      data: matches,
      pagination: objectPagination,
      countMatches,
    });
  } catch (error) {
    console.error("Get Matches Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// [PATCH] /api/v1/matching/results/:id/respond
export const respondMatch = async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id as string;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const match = await prisma.matchResult.update({
      where: { id: matchId },
      data: { status }
    });

    res.status(200).json(match);
  } catch (error) {
    console.error("Respond Match Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
