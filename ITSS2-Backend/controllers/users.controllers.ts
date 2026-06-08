import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { mapUserToResponse, mapJobToResponse } from "../helper/response.mapper";

const prisma = new PrismaClient();

//[GET]/api/v1/users
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { schedules: true }
    });
    
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    // Map to old shape
    const responseUser = mapUserToResponse(user);
    
    res.status(200).json(responseUser);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//[POST]/api/v1/users
export const updateUserInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const {
      name,
      email,
      address,
      phone,
      jobType,
      jobForm,
      category,
      university,
      major,
      desiredJob,
      workingSchedule,
    } = req.body;
    
    // Convert workingSchedule input to Prisma format
    const schedulesCreate = Array.isArray(workingSchedule) 
      ? workingSchedule.map((s: any) => ({ day: s.day, period: s.period }))
      : [];

    const updatedUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        name,
        email,
        address,
        phone,
        jobType,
        jobForm,
        category,
        university,
        major,
        desiredJob,
        schedules: {
          deleteMany: {}, // Delete old schedules
          create: schedulesCreate // Create new schedules
        }
      },
      create: {
        id: userId,
        name: name || "Unknown",
        email: email || `unknown-${Date.now()}@example.com`,
        address,
        phone,
        jobType,
        jobForm,
        category,
        university,
        major,
        desiredJob,
        schedules: {
          create: schedulesCreate
        }
      },
      include: { schedules: true }
    });

    // Map to old shape
    const responseUser = mapUserToResponse(updatedUser);

    res.status(200).json(responseUser);
  } catch (error) {
    console.error("Error updating user info:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//[GET]/api/v1/users/:id/suggested-jobs
export const suggestJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({ 
      where: { deleted: false },
      include: { schedules: true, company: true }
    });
    
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { schedules: true }
    });
    
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const scoredJobs = jobs.map((job) => {
      let score = 0;

      if (user.jobType && job.jobType === user.jobType) score += 2;
      if (user.jobForm && job.jobForm === user.jobForm) score += 2;

      if (
        user.desiredJob &&
        job.title.toLowerCase().includes(user.desiredJob.toLowerCase())
      ) {
        score += 3;
      }

      if (user.category && job.category === user.category) score += 2;

      const userSchedule = user.schedules || [];
      const jobSchedule = job.schedules || [];

      const matchingSchedules = userSchedule.filter((uSlot) =>
        jobSchedule.some(
          (jSlot) => jSlot.day === uSlot.day && jSlot.period === uSlot.period
        )
      );

      score += matchingSchedules.length;

      // Map job to old shape
      const mappedJob = mapJobToResponse(job);

      return {
        job: mappedJob,
        score,
      };
    });

    scoredJobs.sort((a, b) => b.score - a.score);

    const topJobs = scoredJobs.slice(0, 10);
    const result = topJobs.map((entry) => entry.job);
    res.status(200).json(result);
  } catch (error) {
    console.error("Suggest Jobs Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//[GET]/api/v1/users/:id/get-category-list
export const getCategoryList = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.job.findMany({
      where: { 
        deleted: false,
        category: { not: null }
      },
      select: { category: true },
      distinct: ['category']
    });

    const categoryNames = categories.map(c => c.category as string);
    res.status(200).json(categoryNames.sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    console.error("Error fetching category list:", error);
    res.status(500).json({ message: "Server error" });
  }
};
