import { Button } from "@mui/material";
import "./Card.css";
import { useNavigate } from "react-router-dom";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import PinDropIcon from "@mui/icons-material/PinDrop";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import companyLogo from "../../assets/company-logo.png";

const JOB = {
  id: 1,
  title: "Dạy thêm tiếng Anh lớp 8",
  jobType: "Part-time",
  category: "Gia sư",
  company: {
    avatar: null,
    name: "G8 - Onschool",
    location: "Hà Nội",
  },
  address: "Ngõ 265, Lương Thế Vinh, Nam Từ Liêm, Trung Văn, Hà Nội",
  salary: 250000,
  deadline: 18,
};

const formatPrice = (amount) => {
  if (isNaN(amount)) return "0 đ/buổi";
  return `${Number(amount).toLocaleString("vi-VN")} đ/buổi`;
};

const Card = ({ job = {} }) => {
  const navigate = useNavigate();

  const handleViewDetail = () => {
    if (job._id) navigate(`/jobs/${job._id}`);
  };

  const calculateDateDifference = (startDateStr, endDateStr) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Tính số mili giây giữa 2 ngày
    const diffInMs = endDate - startDate;

    // Đổi sang số ngày
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    return diffInDays;
  };

  return (
    <div className="card">
      <div className="card-name">
        <span>{job.title}</span>
        <BookmarkBorderIcon />
      </div>

      <div className="card-tags">
        <div className="card-tag type">{job.jobType}</div>
        <div className="card-tag category">{job.category}</div>
      </div>

      <div className="company">
        <div className="avatar">
          <img src={job.company?.logo ?? companyLogo} alt="company-logo" />
        </div>
        <div className="company-info">
          <div
            className="company-name"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {job.company?.name}
          </div>
          <div className="company-location">{job.company?.location}</div>
        </div>
      </div>

      <div className="card-item">
        <div className="item-icon">
          <PinDropIcon />
        </div>
        <div
          className="job-address"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {job.address}
        </div>
      </div>

      <div className="card-item salary">
        <div className="item-icon">
          <MonetizationOnIcon />
        </div>
        <div className="job-salary">
          <div className="salary-vnd">{formatPrice(job.salary)}</div>
          <div className="deadline">
            Còn {calculateDateDifference(job.startDate, job.endDate)} ngày
          </div>
        </div>
      </div>

      <div className="btn-conatainer">
        <Button
          className="view-detail-btn"
          variant="outlined"
          onClick={() => handleViewDetail()}
        >
          Xem chi tiết
        </Button>
      </div>
    </div>
  );
};

export default Card;
