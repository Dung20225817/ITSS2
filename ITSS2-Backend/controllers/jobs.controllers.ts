import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { paginationHelper } from "../helper/pagination.helper";

const prisma = new PrismaClient();

//[GET]/api/v1/jobs
export const index = async (req: Request, res: Response) => {
  try {
    const where: Prisma.JobWhereInput = {
      deleted: false,
    };

    console.log(req.query);

    // Tìm theo keyword
    const keyword = req.query.keyword?.toString().trim();
    if (keyword) {
      where.title = { contains: keyword, mode: "insensitive" };
    }

    // Tìm theo địa chỉ
    const address = req.query.address?.toString().trim();
    if (address) {
      where.address = { contains: address, mode: "insensitive" };
    }

    // Lọc theo category
    if (req.query.category) {
      const categories = req.query.category.toString().split(",").map((s) => s.trim());
      where.category = { in: categories };
    }

    // Lọc theo jobForm
    if (req.query.jobForm) {
      const jobForms = req.query.jobForm.toString().split(",").map((s) => s.trim());
      where.jobForm = { in: jobForms };
    }

    // Lọc theo jobType
    if (req.query.jobType) {
      const jobTypes = req.query.jobType.toString().split(",").map((s) => s.trim());
      where.jobType = { in: jobTypes };
    }

    // Lọc theo mức lương
    if (req.query.minSalary || req.query.maxSalary) {
      where.salary = {};
      if (req.query.minSalary) where.salary.gte = Number(req.query.minSalary);
      if (req.query.maxSalary) where.salary.lte = Number(req.query.maxSalary);
    }

    // Lọc theo các ngày làm việc (workingTime - string cũ)
    if (req.query.days) {
      const days = req.query.days.toString().split(',').map((s) => s.trim());
      // Prisma không có regex trực tiếp cho text field trong sqlite/postgres linh hoạt như Mongoose.
      // Dùng cú pháp OR contains
      where.OR = days.map(day => ({
        workingTime: { contains: day, mode: 'insensitive' }
      }));
    }

    // Lọc theo thời gian linh hoạt của khách hàng (schedules)
    if (req.query.available) {
      const userAvailable = req.query.available
        .toString()
        .split(",")
        .map((item) => {
          const [day, period] = item.trim().split("-");
          return { day, period };
        });

      // Tìm job có ít nhất 1 buổi trùng với người dùng
      where.schedules = {
        some: {
          OR: userAvailable.map(({ day, period }) => ({
            day,
            period
          }))
        }
      };
    }

    // Đếm số lượng job phù hợp
    const countJobs = await prisma.job.count({ where });

    // Phân trang
    const objectPagination = paginationHelper(
      {
        currentPage: 1,
        limitItems: parseInt(req.query.limit as string) || 30
      },
      req.query,
      countJobs
    );

    // sắp xếp
    const orderBy: any = {};
    if (req.query.sortKey && req.query.sortValue) {
      const sortKey = req.query.sortKey.toString();
      orderBy[sortKey] = req.query.sortValue === 'desc' ? 'desc' : 'asc';
    }

    // Truy vấn danh sách job
    const jobs = await prisma.job.findMany({
      where,
      orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
      take: objectPagination.limitItems,
      skip: objectPagination.skip,
      include: { schedules: true, company: true }
    });

    // Map output to match Mongoose shape
    const mappedJobs = jobs.map(job => ({
      ...job,
      _id: job.id,
      workingSchedule: job.schedules.map(s => ({ day: s.day, period: s.period }))
    }));

    res.status(200).json({
      data: mappedJobs,
      pagination: objectPagination,
      countJobs: countJobs
    });
  } catch (error) {
    console.error("Job Index Error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

//[GET]/api/v1/jobs/detail/:id
export const detail = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const task = await prisma.job.findUnique({
      where: { id },
      include: { schedules: true, company: true }
    });

    if (!task) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    const mappedTask = {
      ...task,
      _id: task.id,
      workingSchedule: task.schedules.map(s => ({ day: s.day, period: s.period }))
    };

    res.json(mappedTask);
  } catch (error) {
    console.error("Job Detail Error:", error);
    res.status(500).json({ message: "Lỗi không lấy được chi tiết công việc!" });
  }
}