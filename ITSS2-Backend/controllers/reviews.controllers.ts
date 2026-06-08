import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [GET] /api/v1/reviews/company/:companyId
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { companyId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Get Reviews Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// [POST] /api/v1/reviews
export const createReview = async (req: Request, res: Response) => {
  try {
    const { userId, companyId, rating, comment } = req.body;

    if (!userId || !companyId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Invalid payload. Rating must be between 1 and 5." });
      return;
    }

    // Ensure the company exists
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    // Ensure the user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Execute in transaction
    const [newReview] = await prisma.$transaction(async (tx) => {
      // 1. Create the review
      const review = await tx.review.create({
        data: {
          userId,
          companyId,
          rating,
          comment
        },
        include: { user: { select: { id: true, name: true } } }
      });

      // 2. Fetch all reviews to calculate average
      const allReviews = await tx.review.findMany({
        where: { companyId },
        select: { rating: true }
      });

      const reviewCount = allReviews.length;
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const trustScore = Number((totalRating / reviewCount).toFixed(1));

      // 3. Update company
      await tx.company.update({
        where: { id: companyId },
        data: { trustScore, reviewCount }
      });

      return [review];
    });

    res.status(201).json(newReview);
  } catch (error) {
    console.error("Create Review Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
