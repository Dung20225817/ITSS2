import { Request, Response } from "express";
import Job from "../models/jobs.models";

// [GET] /api/v1/addresses
export const index = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find({ deleted: false }).select("address -_id");

    // Cắt địa chỉ trước dấu phẩy và lọc trùng
    const rawAddresses = jobs.map(job => {
      const fullAddress = job.address || "";
      return fullAddress.split(",")[0].trim(); // Lấy phần trước dấu phẩy
    });

    const uniqueAddresses = [...new Set(rawAddresses)]; // Loại bỏ trùng

    res.status(200).json({
      address: uniqueAddresses,
    });
  } catch (error) {
    console.error("Get Unique Address Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
