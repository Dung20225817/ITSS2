import "./HomeJobCard.css";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import companyLogo from "../../assets/company-logo.png";
import { useNavigate } from "react-router-dom";

const formatSalary = (salary, salaryUnit) => {
  if (!salary || Number.isNaN(Number(salary))) return "Thỏa thuận";

  const unitMap = {
    thang: "tháng",
    buoi: "buổi",
    gio: "giờ",
  };
  const unit = salaryUnit ? unitMap[salaryUnit] || salaryUnit : "tháng";

  return `${Number(salary).toLocaleString("vi-VN")} đ/${unit}`;
};

const formatPostedTime = (dateValue) => {
  if (!dateValue) return "Vừa đăng";

  const createdAt = new Date(dateValue);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays) || diffDays <= 0) return "Hôm nay";
  if (diffDays === 1) return "1 ngày trước";
  return `${diffDays} ngày trước`;
};

const HomeJobCard = ({ job = {} }) => {
  const navigate = useNavigate();

  const handleViewDetail = () => {
    if (job._id) navigate(`/jobs/${job._id}`);
  };

  return (
    <div className="cardjob">
      <div className="cardjobheader">
        <div className="cardjobcompany">
          <img
            src={job.company?.logo || companyLogo}
            alt={job.company?.name || "company-logo"}
          />
          <button type="button" onClick={handleViewDetail}>
            {job.company?.name || "Công ty"}
          </button>
        </div>
        <div className="cardjobbadge">{job.jobType || "Job"}</div>
      </div>

      <div className="cardjobcontent">
        <h3>{job.title || "Vị trí đang tuyển"}</h3>
        <p>{job.description || "Thông tin mô tả công việc đang được cập nhật."}</p>
      </div>

      <div className="cardjoblist">
        <span>Địa điểm</span>
        <strong>{job.address || job.company?.location || "Đang cập nhật"}</strong>
      </div>

      <div className="cardjoblist">
        <span>Lương</span>
        <strong>{formatSalary(job.salary, job.salaryUnit)}</strong>
      </div>

      <div className="cardjobheader cardjobfooter">
        <div className="cardjobposted">
          <AccessTimeIcon />
          <span>{formatPostedTime(job.createdAt)}</span>
        </div>
        <button
          className="cardjobarrow"
          type="button"
          onClick={handleViewDetail}
          aria-label="Xem chi tiết công việc"
        >
          <ArrowForwardIcon />
        </button>
      </div>
    </div>
  );
};

export default HomeJobCard;
