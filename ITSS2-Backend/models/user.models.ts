import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  address: { type: String },
  phone: { type: String },
  jobType: { type: String },
  jobForm: { type: String },
  category: { type: String },
  university: { type: String },
  major: { type: String },
  desiredJob: { type: String },
  workingSchedule: [
    {
      day: {
        type: String,
        enum: [
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
          "Chủ nhật",
        ],
        required: true,
      },
      period: {
        type: String,
        enum: ["sáng", "chiều", "tối"],
        required: true,
      },
    },
  ],
});

export default mongoose.model("User", userSchema, "Users");
