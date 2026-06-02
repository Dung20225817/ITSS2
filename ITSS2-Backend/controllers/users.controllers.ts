import { Request, Response } from "express";
import User from "../models/user.models";
import Job from "../models/jobs.models";

//[GET]/api/v1/users
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user);
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
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
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
      },
      { new: true, upsert: true }
    );

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user info:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//[GET]/api/v1/users/:id/suggested-jobs
export const suggestJobs = async (req: Request, res: Response) => {
  const jobs = await Job.find({ deleted: false });
  const userId = req.params.id;
  const user = await User.findById(userId);
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

    const userSchedule = user.workingSchedule || [];
    const jobSchedule = job.workingSchedule || [];

    const matchingSchedules = userSchedule.filter((uSlot) =>
      jobSchedule.some(
        (jSlot) => jSlot.day === uSlot.day && jSlot.period === uSlot.period
      )
    );

    score += matchingSchedules.length;

    return {
      job,
      score,
    };
  });

  scoredJobs.sort((a, b) => b.score - a.score);

  const topJobs = scoredJobs.slice(0, 10);
  const result = topJobs.map((entry) => entry.job);
  res.status(200).json(result);
};

//[GET]/api/v1/users/:id/get-category-list
export const getCategoryList = async (_req: Request, res: Response) => {
  try {
    const categories = await Job.distinct("category", {
      deleted: false,
      category: { $nin: [null, ""] },
    });

    res.status(200).json(categories.sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    console.error("Error fetching category list:", error);
    res.status(500).json({ message: "Server error" });
  }
};
