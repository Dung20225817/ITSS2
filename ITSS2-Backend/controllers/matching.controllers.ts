import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { calculateMatchScore } from "../helper/matching.helper";

const prisma = new PrismaClient();

// [POST] /api/v1/matching/run/:userId
export const runMatching = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { schedules: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const jobs = await prisma.job.findMany({
      where: { deleted: false },
      include: { schedules: true, company: true }
    });

    let matchCount = 0;

    for (const job of jobs) {
      const { score, reasons } = calculateMatchScore(user, job);

      if (score >= 60) {
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
        matchCount++;
      }
    }

    res.status(200).json({ message: `Successfully generated ${matchCount} matches.` });
  } catch (error) {
    console.error("Run Matching Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// [GET] /api/v1/matching/results/:userId
export const getMatches = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const matches = await prisma.matchResult.findMany({
      where: { userId },
      include: {
        job: {
          include: { company: true, schedules: true }
        }
      },
      orderBy: { score: 'desc' }
    });

    res.status(200).json(matches);
  } catch (error) {
    console.error("Get Matches Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// [PATCH] /api/v1/matching/results/:id/respond
export const respondMatch = async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id;
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
