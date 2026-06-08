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
import StarIcon from "@mui/icons-material/Star";
import "./JobDetail.css";
import Header from "../../components/Header";

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const navigate = useNavigate();

  const userId = import.meta.env.VITE_DEFAULT_USER_ID || "demo-student-1";

  const fetchReviews = async (companyId) => {
    try {
      const res = await apiClient.get(`/api/v1/reviews/company/${companyId}`);
      setReviews(res.data);
    } catch (error) {
      console.error("Lỗi khi tải đánh giá:", error);
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await apiClient.get(`/api/v1/jobs/detail/${id}`);
        console.log("Dữ liệu trả về:", response.data);
        setJob(response.data);
        if (response.data?.companyId) {
          fetchReviews(response.data.companyId);
        }
      } catch (err) {
        console.error("Lỗi khi gọi API:", err);
      }
    };
    fetchJob();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!job || !job.companyId) return;

    try {
      setSubmittingReview(true);
      const res = await apiClient.post(`/api/v1/reviews`, {
        userId,
        companyId: job.companyId,
        rating: Number(rating),
        comment
      });
      
      // Add new review to state
      setReviews([res.data, ...reviews]);
      setComment("");
      setRating(5);
      
      // Update company trust score and review count in local state
      // Since recalculation happens in backend, a real app might refetch job here.
      // We'll increment review count locally to give immediate feedback.
      setJob(prev => ({
        ...prev,
        company: {
          ...prev.company,
          reviewCount: prev.company.reviewCount + 1,
          // Trust score calculation logic simulation for quick UI update
          trustScore: ((prev.company.trustScore * prev.company.reviewCount) + Number(rating)) / (prev.company.reviewCount + 1)
        }
      }));
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      alert("Có lỗi xảy ra khi gửi đánh giá.");
    } finally {
      setSubmittingReview(false);
    }
  };

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
                          color: "#007bff",
                          cursor: "pointer",
                        }}
                      >
                        (Chi tiết)
                      </span>
                    </li>

                    {showSchedule && job.workingSchedule?.length > 0 && (
                      <ul style={{ marginTop: "8px", marginLeft: "20px" }}>
                        {job.workingSchedule.map((item, index) => (
                          <li key={index}>
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
                  <div className="company-trust-score">
                    <StarIcon style={{ color: "#fbbf24", fontSize: "1.1rem", verticalAlign: "text-bottom" }} />
                    <span style={{ fontWeight: 600, marginLeft: 4 }}>
                      {Number(job.company.trustScore).toFixed(1)}
                    </span>
                    <span style={{ color: "#6b7280", marginLeft: 4, fontSize: "0.9em" }}>
                      ({job.company.reviewCount} đánh giá)
                    </span>
                  </div>
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
              {job.description?.split(".").map(
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

          {/* REVIEWS SECTION */}
          <h2>Đánh giá Doanh Nghiệp</h2>
          <div className="reviews-section">
            <div className="review-form-container">
              <h3>Viết đánh giá của bạn</h3>
              <form onSubmit={submitReview} className="review-form">
                <div className="form-group">
                  <label>Điểm đánh giá:</label>
                  <div className="rating-select">
                    {[1, 2, 3, 4, 5].map(num => (
                      <label key={num}>
                        <input 
                          type="radio" 
                          name="rating" 
                          value={num} 
                          checked={rating === num}
                          onChange={() => setRating(num)}
                        />
                        {num} <StarIcon style={{ fontSize: "1rem", color: "#fbbf24", verticalAlign: "bottom" }} />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về doanh nghiệp này..."
                    required
                    rows="3"
                  />
                </div>
                <button type="submit" className="submit-review-btn" disabled={submittingReview}>
                  {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </form>
            </div>

            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p className="no-reviews">Chưa có đánh giá nào cho doanh nghiệp này. Hãy là người đầu tiên!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <strong>{review.user?.name || "Người dùng ẩn danh"}</strong>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="review-rating">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <StarIcon key={i} style={{ color: "#fbbf24", fontSize: "1.1rem" }} />
                      ))}
                      {Array.from({ length: 5 - review.rating }).map((_, i) => (
                        <StarIcon key={`empty-${i}`} style={{ color: "#d1d5db", fontSize: "1.1rem" }} />
                      ))}
                    </div>
                    {review.comment && <p className="review-comment">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
