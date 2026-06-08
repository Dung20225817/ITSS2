import "./Card.css";
import { useNavigate } from "react-router-dom";
import PinDropIcon from "@mui/icons-material/PinDrop";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import companyLogo from "../../assets/company-logo.png";

const formatPrice = (amount) => {
  if (isNaN(amount)) return "Thoa thuan";
  return `${Number(amount).toLocaleString("vi-VN")} d`;
};

const Card = ({ job = {}, isMatchingSchedule = false }) => {
  const navigate = useNavigate();

  const handleViewDetail = () => {
    if (job._id) navigate(`/jobs/${job._id}`);
  };

  return (
    <div className="card">
      <div className="card-job-type">{job.jobType}</div>

      <div className="card-logo">
        <img src={job.company?.logo ?? companyLogo} alt="company-logo" />
      </div>

      <div className="card-name">{job.title}</div>
      <div className="company-name">{job.company?.name}</div>

      {isMatchingSchedule && (
        <div className="card-match-tag">Trung lich cua ban</div>
      )}

      <div className="card-info">
        <MonetizationOnIcon />
        <span>{formatPrice(job.salary)}</span>
      </div>

      <div className="card-info card-address">
        <PinDropIcon />
        <span>{job.address}</span>
      </div>

      <div className="btn-conatainer">
        <button className="view-detail-link" type="button" onClick={handleViewDetail}>
          Xem chi tiết »
        </button>
      </div>
    </div>
  );
};

export default Card;
