import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Tiêu đề công việc

    jobType: { type: String },               // "Part-Time", "Full-Time", ...
    category: { type: String },              // "Gia sư", "Sales", ...
    jobForm: { type: String },               // "Internship", "Contract", ...

    company: {
      name: { type: String },                // Tên công ty
      location: { type: String },            // Tỉnh/Thành phố
      employeeCount: { type: String },       // Ví dụ: "100 nhân viên"
      industry: { type: String },            // Ví dụ: "Giảng dạy"
      address: { type: String },             // Ví dụ: "74 ngõ Xã Đàn 2, Nam Đồng, Đống Đa, Hà Nội"
      logo: { type: String }, // ✅ Thêm logo công ty
    },

    address: { type: String },               // Địa điểm làm việc cụ thể
    salary: { type: Number },                // Lương (ví dụ 250000 = 250.000đ)
    salaryUnit: { type: String },            // Ví dụ: "buổi", "giờ", "tháng"
    experienceRequired: { type: String },    // Ví dụ: "Không yêu cầu kinh nghiệm"
    numberOfPeople: { type: String },        // Ví dụ: "1 người"
    workingTime: { type: String },           // Ví dụ: "Thứ 2, Thứ 3, Thứ 5 : 7h30–9h30"
    // ✅ Trường mới
    workingSchedule: [
      {
        day: {
          type: String,
          enum: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"],
          required: true,
        },
        period: {
          type: String,
          enum: ["sáng", "chiều", "tối"],
          required: true,
        }
      }
    ],
    startDate: { type: Date },               // Ngày bắt đầu
    endDate: { type: Date },                 // Ngày kết thúc
    description: { type: String },           // Mô tả công việc chi tiết

    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

const Job = mongoose.model("Job", jobSchema, "Jobs");

export default Job;
