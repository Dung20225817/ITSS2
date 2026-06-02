import React, { useEffect, useState} from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../api/client";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import companyLogo from "../../assets/company-logo.png";
import PushPin from "../../assets/pushpin.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import WorkIcon from "@mui/icons-material/Work";
import AssignmentIcon from "@mui/icons-material/Assignment";
import Schedule from "@mui/icons-material/WorkOutline";
import "./JobDetail.css";
import Header from "../../components/Header";

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await apiClient.get(`/api/v1/jobs/detail/${id}`);
        console.log("Dữ liệu trả về:", response.data);
        setJob(response.data);
      } catch (err) {
        console.error("Lỗi khi gọi API:", err);
      }
    };
    fetchJob();
  }, [id]);

  if (!job) {
    return <div>Loading...</div>;
  }

  const formatPrice = (amount) => {
    if (isNaN(amount)) return "0 đ";
    return `${Number(amount).toLocaleString("vi-VN")}đ`;
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="JobDetail-page">
      <Header />
      <div className="page-content">
        <div className="job-container">
          <div className="newdiv">
            <h1 onClick={() => navigate(-1)} className="job-title">
              <FontAwesomeIcon icon={faChevronLeft} />
              <span style={{ marginLeft: "10px" }}>{job.title}</span>
            </h1>
            <div className="badges">
              <span className="badge type-v">{job.jobType}</span>
              <span className="badge category-v">{job.category}</span>
            </div>
          </div>

          <h2>Thông tin cơ bản</h2>
          <div className="basic-info">
            <div className="left-column">
              <ul>
                <li>
                  <LocationOnIcon /> {job.address}
                </li>
                <li>
                  <MonetizationOnIcon /> {formatPrice(job.salary)}/
                  {job.salaryUnit}
                </li>
                <li>
                  <WorkIcon
                    style={{ verticalAlign: "middle", marginRight: 4 }}
                  />
                  {job.jobForm}
                </li>
                <li>
                  <WorkHistoryIcon />{" "}
                  {job.experienceRequired || "Không yêu cầu kinh nghiệm"}
                </li>
                <li>
                  <PeopleIcon /> {job.numberOfPeople}
                </li>
                {job.jobType === "Part-Time" ? (
                  <>
                    <li onClick={() => setShowSchedule(!showSchedule)}>
                      <AccessTimeIcon /> {job.workingTime}
                      <span
                        style={{
                          fontStyle: "italic",
                          textDecoration: "underline",
                          color: "#007bff", // hoặc chọn màu khác phù hợp
                          cursor: "pointer",
                        }}
                      >
                        (Chi tiết)
                      </span>
                    </li>

                    {showSchedule && job.workingSchedule?.length > 0 && (
                      <ul style={{ marginTop: "8px", marginLeft: "20px" }}>
                        {job.workingSchedule.map((item) => (
                          <li key={item._id}>
                            <AccessTimeIcon
                              style={{
                                verticalAlign: "middle",
                              }}
                            />
                            <strong>{item.day}:</strong> {item.period}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <li>
                    <AccessTimeIcon /> {job.workingTime}
                  </li>
                )}

                <li>
                  <AssignmentIcon /> Ứng tuyển:
                  {formatDateTime(job.startDate)} –{" "}
                  {formatDateTime(job.endDate)}
                </li>
                <li>
                  <Schedule /> Làm chính thức:
                  {formatDateTime(job.recruitStartDate)} –{" "}
                  {formatDateTime(job.recruitEndDate)}
                </li>
              </ul>
            </div>

            <div className="right-column">
              <div className="icon-PushPin">
                <img src={PushPin} alt="company-logo" />
              </div>
              <div className="company-v">
                <div className="avatar">
                  <img
                    src={job.company.logo ?? companyLogo}
                    alt="company-logo"
                  />
                </div>
                <div className="company-info">
                  <div className="company-name">{job.company.name}</div>
                  <div className="company-location">{job.company.address}</div>
                </div>
              </div>
              <div className="info">
                <li>
                  <PeopleIcon /> {job.company.employeeCount}
                </li>
                <li>
                  <Inventory2Icon /> {job.company.industry}
                </li>
                <li>
                  <LocationOnIcon /> {job.company.location}
                </li>
              </div>
            </div>
          </div>

          <h2>Mô tả chi tiết công việc</h2>
          <div className="job-description">
            <ul>
              {job.description.split(".").map(
                (line, index) =>
                  line.trim() && (
                    <p
                      key={index}
                      style={{ fontSize: "16px", lineHeight: "1.6" }}
                    >
                      • {line.trim()}.
                    </p>
                  )
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
