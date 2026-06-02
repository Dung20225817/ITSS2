import { Request, Response } from "express";
import Job from '../models/jobs.models';
import { paginationHelper } from "../helper/pagination.helper";
import { SearchHelper } from "../helper/search.helper";
//[GET]/api/v1/jobs
export const index = async (req: Request, res: Response) => {
  try {
    const find: any = {
      deleted: false,
    };
    console.log(req.query)
    const conditions: any[] = [];

    // Tìm theo keyword
    const keyword = req.query.keyword?.toString().trim();
    if (keyword) {
      const regex = new RegExp(keyword, "i");
      conditions.push({
        title: regex, // hoặc mở rộng: $or: [{ category: regex }, { title: regex }]
      });
    }

    // Tìm theo địa chỉ
    const address = req.query.address?.toString().trim();
    if (address) {
      const regex = new RegExp(address, "i");
      conditions.push({
        address: regex,
      });
    }

    // Nếu có điều kiện tìm kiếm -> thêm vào query
    if (conditions.length > 0) {
      find.$and = conditions;
    }
    // Lọc theo category (ví dụ: ?category=Gia sư,Design)
    if (req.query.category) {
      const categories = req.query.category.toString().split(",").map((s) => s.trim());
      find.category = {
        $in: categories.map((cat) => new RegExp(cat, "i"))  // "i" là không phân biệt hoa thường
      };
    }

    // Lọc theo jobForm
    if (req.query.jobForm) {
      const jobForms = req.query.jobForm.toString().split(",").map((s) => s.trim());
      find.jobForm = {
        $in: jobForms.map((form) => new RegExp(form, "i"))
      };
    }

    // Lọc theo jobType
    if (req.query.jobType) {
      const jobTypes = req.query.jobType.toString().split(",").map((s) => s.trim());
      find.jobType = {
        $in: jobTypes.map((type) => new RegExp(type, "i"))
      };
    }


    // Lọc theo mức lương
    if (req.query.minSalary || req.query.maxSalary) {
      find.salary = {};
      if (req.query.minSalary) find.salary.$gte = Number(req.query.minSalary);
      if (req.query.maxSalary) find.salary.$lte = Number(req.query.maxSalary);
    }
    // Lọc theo các ngày làm việc
    if (req.query.days) {
      const days = req.query.days.toString().split(',').map((s) => s.trim());
      find.workingTime = { $regex: days.join('|'), $options: 'i' }; // Tìm bất kỳ ngày nào có trong workingTime
    }

    // Đếm số lượng job phù hợp
    const countJobs = await Job.countDocuments(find);
    // Phân trang
    console.log(req.query)
    const objectPagination = paginationHelper(
      {
        currentPage: 1,
        limitItems: parseInt(req.query.limit as string) || 30
      },
      req.query,
      countJobs
    );
    // sắp xếp theo sortkey và sortvalue tương ứng
    const sort = {};
    if (req.query.sortKey && req.query.sortValue) {
      const sortKey = req.query.sortKey.toString();
      sort[sortKey] = req.query.sortValue;
    }
    //end sort
    // Lọc theo thời gian linh hoạt của khách hàng
    if (req.query.available) {
      const userAvailable = req.query.available
        .toString()
        .split(",")
        .map((item) => {
          const [day, period] = item.trim().split("-");
          return { day, period };
        });

      // Tìm job có ít nhất 1 buổi trùng với người dùng
      find.workingSchedule = {
        $elemMatch: {
          $or: userAvailable.map(({ day, period }) => ({
            day,
            period
          }))
        }
      };
    }
    const count = await Job.countDocuments(find);
    // Truy vấn danh sách job
    const jobs = await Job.find(find).sort(sort)
      .limit(objectPagination.limitItems)
      .skip(objectPagination.skip);

    res.status(200).json({
      data: jobs,
      pagination: objectPagination,
      countJobs: count
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
    // console.log(id);
    const task = await Job.findOne({
      _id: id,
      deleted: false
    });
    res.json(task);
  } catch (error) {
    res.status(404).json({ mesage: "Lỗi không lấy được chi tiết công việc!" });
  }

}