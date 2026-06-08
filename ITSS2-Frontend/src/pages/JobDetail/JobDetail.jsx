import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PeopleIcon from "@mui/icons-material/People";
import StarIcon from "@mui/icons-material/Star";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import apiClient from "../../api/client";
import companyLogo from "../../assets/company-logo.png";
import Header from "../../components/Header";
import Footer from "../../components/Footer/Footer";
import "./JobDetail.css";

const DetailItem = ({ icon, label, value }) => {
  if (!value && value !== 0) return null;

  return (
    <div className="jd-detail-item">
      <div className="jd-detail-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
};

const formatSalary = (amount, unit) => {
  if (!amount && amount !== 0) return "";
  const salary = Number(amount).toLocaleString("vi-VN");
  return `${salary}đ${unit ? `/${unit}` : ""}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const getTimeAgo = (dateStr) => {
  if (!dateStr) return "";

  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return "Đăng hôm nay";
  if (diffDays < 7) return `Đăng ${diffDays} ngày trước`;
  if (diffDays < 30) return `Đăng ${Math.floor(diffDays / 7)} tuần trước`;
  return `Đăng ${Math.floor(diffDays / 30)} tháng trước`;
};

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const userId = import.meta.env.VITE_DEFAULT_USER_ID || "demo-student-1";

  const fetchReviews = async (companyId) => {
    try {
      const res = await apiClient.get(`/api/v1/reviews/company/${companyId}`);
      setReviews(res.data);
    } catch (error) {
      console.error("Lỗi khi tải đánh giá:", error);
    }
  };

  const fetchRelatedJobs = async (currentJob) => {
    try {
      const res = await apiClient.get(
        "/api/v1/jobs?limit=30&page=1&sortKey=createdAt&sortValue=desc"
      );
      const jobs = res.data?.data || [];
      const currentJobId = currentJob?._id || currentJob?.id;

      setRelatedJobs(
        jobs.filter((item) => {
          const itemId = item._id || item.id;
          return itemId !== currentJobId && item.category;
        })
      );
    } catch (error) {
      console.error("Lỗi khi tải job liên quan:", error);
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/v1/jobs/detail/${id}`);
        setJob(response.data);
        fetchRelatedJobs(response.data);
        if (response.data?.companyId) {
          fetchReviews(response.data.companyId);
        }
      } catch (err) {
        console.error("Lỗi khi gọi API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const relatedJobGroups = useMemo(() => {
    const groups = new Map();

    relatedJobs.forEach((item) => {
      const category = item.category || "Khác";
      const currentItems = groups.get(category) || [];
      groups.set(category, [...currentItems, item]);
    });

    return Array.from(groups.entries())
      .sort(([categoryA], [categoryB]) => {
        if (categoryA === job?.category) return -1;
        if (categoryB === job?.category) return 1;
        return categoryA.localeCompare(categoryB, "vi");
      })
      .slice(0, 3)
      .map(([category, jobs]) => ({
        category,
        jobs: jobs.slice(0, 5)
      }))
      .filter((group) => group.jobs.length > 0);
  }, [job?.category, relatedJobs]);

  const descriptionBlocks = useMemo(() => {
    if (!job?.description) return [];

    return job.description
      .split(/\n|[.]\s+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [job?.description]);

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

      setReviews([res.data, ...reviews]);
      setComment("");
      setRating(5);
      setJob((prev) => ({
        ...prev,
        company: {
          ...prev.company,
          reviewCount: prev.company.reviewCount + 1,
          trustScore:
            (prev.company.trustScore * prev.company.reviewCount + Number(rating)) /
            (prev.company.reviewCount + 1)
        }
      }));
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      alert("Có lỗi xảy ra khi gửi đánh giá.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="jd-page">
        <Header />
        <main className="jd-shell">
          <div className="jd-loading">Đang tải thông tin công việc...</div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="jd-page">
        <Header />
        <main className="jd-shell">
          <button className="jd-back-link" type="button" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
            Quay lại
          </button>
          <div className="jd-empty">Không tìm thấy công việc này.</div>
        </main>
      </div>
    );
  }

  const company = job.company || {};
  const salary = formatSalary(job.salary, job.salaryUnit);
  const postedAt = getTimeAgo(job.createdAt);
  const applicationRange =
    job.startDate || job.endDate
      ? `${formatDate(job.startDate)}${job.endDate ? ` - ${formatDate(job.endDate)}` : ""}`
      : "";
  const workingRange =
    job.recruitStartDate || job.recruitEndDate
      ? `${formatDate(job.recruitStartDate)}${job.recruitEndDate ? ` - ${formatDate(job.recruitEndDate)}` : ""}`
      : "";

  return (
    <div className="jd-page">
      <Header />

      <main className="jd-shell">
        <button className="jd-back-link" type="button" onClick={() => navigate(-1)}>
          <ArrowBackIcon />
          Quay lại danh sách việc làm
        </button>

        <div className="jd-layout">
          <section className="jd-main">
            <div className="jd-company-hero">
              <img
                className="jd-company-logo"
                src={company.logo || companyLogo}
                alt={company.name || "Company logo"}
              />
              <div>
                {company.name && <p className="jd-company-name">{company.name}</p>}
                {company.description && <p className="jd-company-desc">{company.description}</p>}
              </div>
            </div>

            <article className="jd-card jd-job-card">
              <div className="jd-title-row">
                <div>
                  <h1>{job.title}</h1>
                  <div className="jd-meta-line">
                    {salary && <span>{salary}</span>}
                    {job.address && <span>{job.address}</span>}
                    {job.jobType && <span>{job.jobType}</span>}
                    {postedAt && <span>{postedAt}</span>}
                  </div>
                </div>
                <div className="jd-badges">
                  {job.jobType && <span>{job.jobType}</span>}
                  {job.category && <span>{job.category}</span>}
                </div>
              </div>
            </article>

            <article className="jd-card jd-section">
              <h2>Thông tin công việc</h2>
              <div className="jd-info-grid">
                <DetailItem icon={<LocationOnIcon />} label="Địa điểm" value={job.address} />
                <DetailItem icon={<MonetizationOnIcon />} label="Lương" value={salary} />
                <DetailItem icon={<WorkOutlineIcon />} label="Hình thức" value={job.jobForm} />
                <DetailItem icon={<CategoryIcon />} label="Danh mục" value={job.category} />
                <DetailItem
                  icon={<PeopleIcon />}
                  label="Số lượng tuyển"
                  value={job.numberOfPeople}
                />
                <DetailItem
                  icon={<BusinessIcon />}
                  label="Kinh nghiệm"
                  value={job.experienceRequired}
                />
                <DetailItem icon={<CalendarTodayIcon />} label="Thời gian ứng tuyển" value={applicationRange} />
                <DetailItem icon={<CalendarTodayIcon />} label="Thời gian làm chính thức" value={workingRange} />
              </div>

            </article>

            {descriptionBlocks.length > 0 && (
              <article className="jd-card jd-section">
                <h2>Mô tả công việc</h2>
                <div className="jd-description">
                  {descriptionBlocks.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </article>
            )}

            <article className="jd-card jd-section">
              <h2>Đánh giá doanh nghiệp</h2>
              <div className="jd-review-form-card">
                <h3>Viết đánh giá của bạn</h3>
                <form onSubmit={submitReview} className="jd-review-form">
                  <div className="jd-rating-select">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <label key={num}>
                        <input
                          type="radio"
                          name="rating"
                          value={num}
                          checked={rating === num}
                          onChange={() => setRating(num)}
                        />
                        {num} <StarIcon />
                      </label>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về doanh nghiệp này..."
                    required
                    rows="3"
                  />
                  <button type="submit" className="jd-submit-review" disabled={submittingReview}>
                    {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </form>
              </div>

              <div className="jd-reviews-list">
                {reviews.length === 0 ? (
                  <p className="jd-no-reviews">
                    Chưa có đánh giá nào cho doanh nghiệp này. Hãy là người đầu tiên!
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="jd-review-item">
                      <div className="jd-review-header">
                        <strong>{review.user?.name || "Người dùng ẩn danh"}</strong>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="jd-review-rating">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <StarIcon key={i} />
                        ))}
                        {Array.from({ length: 5 - review.rating }).map((_, i) => (
                          <StarIcon key={`empty-${i}`} className="is-empty" />
                        ))}
                      </div>
                      {review.comment && <p>{review.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </article>

            {relatedJobGroups.length > 0 && (
              <section className="jd-related-section">
                {relatedJobGroups.map((group) => (
                  <div className="jd-related-group" key={group.category}>
                    <div className="jd-related-header">
                      <h2>Việc làm {group.category}</h2>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/jobs?category=${encodeURIComponent(group.category)}`)
                        }
                      >
                        Xem tất cả
                      </button>
                    </div>

                    <div className="jd-related-list">
                      {group.jobs.map((item) => {
                        const itemId = item._id || item.id;
                        const itemSalary = formatSalary(item.salary, item.salaryUnit);

                        return (
                          <div
                            className="jd-related-item"
                            key={itemId}
                          >
                            <img
                              src={item.company?.logo || companyLogo}
                              alt={item.company?.name || "Company logo"}
                            />
                            <div className="jd-related-content">
                              <h3>{item.title}</h3>
                              <p>
                                {item.company?.name && <span>{item.company.name}</span>}
                                {item.address && <span>{item.address}</span>}
                                {itemSalary && <span>{itemSalary}</span>}
                              </p>
                            </div>
                            <button
                              className="jd-related-apply"
                              type="button"
                              onClick={() => navigate(`/jobs/${itemId}`)}
                            >
                              Apply
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </section>

          <aside className="jd-sidebar">
            <div className="jd-card jd-apply-card">
              <button className="jd-apply-btn" type="button">
                Ứng tuyển ngay
              </button>
              <button className="jd-save-btn" type="button">
                Lưu công việc
              </button>
            </div>

            <div className="jd-card jd-sidebar-card">
              <h3>Tổng quan</h3>
              <DetailItem icon={<MonetizationOnIcon />} label="Lương" value={salary} />
              <DetailItem icon={<LocationOnIcon />} label="Địa điểm" value={job.address} />
              <DetailItem icon={<WorkOutlineIcon />} label="Loại việc" value={job.jobType} />
              <DetailItem icon={<CalendarTodayIcon />} label="Ngày đăng" value={postedAt} />
            </div>

            <div className="jd-card jd-sidebar-card">
              <h3>Về doanh nghiệp</h3>
              <div className="jd-sidebar-company">
                <img src={company.logo || companyLogo} alt={company.name || "Company logo"} />
                <div>
                  {company.name && <strong>{company.name}</strong>}
                  {company.address && <span>{company.address}</span>}
                </div>
              </div>
              <DetailItem icon={<PeopleIcon />} label="Quy mô" value={company.employeeCount} />
              <DetailItem icon={<BusinessIcon />} label="Ngành" value={company.industry} />
              <DetailItem icon={<LocationOnIcon />} label="Khu vực" value={company.location} />
              {company.reviewCount > 0 && (
                <div className="jd-trust-score">
                  <StarIcon />
                  <strong>{Number(company.trustScore).toFixed(1)}</strong>
                  <span>({company.reviewCount} đánh giá)</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default JobDetail;
