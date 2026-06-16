import { Request, Response } from "express";
import { CITY_OPTIONS } from "../helper/city.helper";

// [GET] /api/v1/addresses
export const index = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      address: CITY_OPTIONS,
    });
  } catch (error) {
    console.error("Get Unique Address Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
