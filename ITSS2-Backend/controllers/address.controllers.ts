import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [GET] /api/v1/addresses
export const index = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { deleted: false },
      select: { address: true }
    });

    // Cắt địa chỉ trước dấu phẩy và lọc trùng
    const rawAddresses = jobs.map(job => {
      const fullAddress = job.address || "";
      return fullAddress.split(",")[0].trim(); // Lấy phần trước dấu phẩy
    }).filter(addr => addr !== "");

    const uniqueAddresses = [...new Set(rawAddresses)]; // Loại bỏ trùng

    res.status(200).json({
      address: uniqueAddresses,
    });
  } catch (error) {
    console.error("Get Unique Address Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
