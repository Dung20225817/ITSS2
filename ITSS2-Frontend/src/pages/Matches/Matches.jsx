import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Matches.css";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runningMatch, setRunningMatch] = useState(false);
  const [userId] = useState(import.meta.env.VITE_DEFAULT_USER_ID || "demo-student-1");

  // Mock data for development
  const mockMatches = [
    {
      _id: "match-001",
      jobId: "job-001",
      job: {
        title: "Nhân viên bán hàng - Ca tối",
        company: { id: "company-001", name: "FPT Retail", trustScore: 4.5, reviewCount: 12 },
        salary: 250000,
        salaryUnit: "VNĐ/ca",
        workingSchedule: [
          { day: "Thứ 2", period: "tối" },
          { day: "Thứ 3", period: "tối" },
          { day: "Thứ 5", period: "tối" },
        ],
      },
      score: 95,
      reasons: [
        "Lịch làm việc phù hợp (60 điểm)",
        "Ngành hàng khớp (15 điểm)",
        "Hình thức công việc phù hợp (10 điểm)",
        "Danh mục sản phẩm liên quan (10 điểm)",
      ],
      status: "pending",
    },
    {
      _id: "match-002",
      jobId: "job-002",
      job: {
        title: "Content Writer - Làm việc cuối tuần",
        company: { id: "company-002", name: "Agile Marketing", trustScore: 4.2, reviewCount: 8 },
        salary: 300000,
        salaryUnit: "VNĐ/ca",
        workingSchedule: [
          { day: "Thứ 7", period: "sáng" },
          { day: "Chủ nhật", period: "sáng" },
        ],
      },
      score: 85,
      reasons: [
        "Lịch làm việc phù hợp (60 điểm)",
        "Danh mục sản phẩm liên quan (10 điểm)",
        "Công việc mong muốn khớp (5 điểm)",
        "Hình thức công việc phù hợp (10 điểm)",
      ],
      status: "pending",
    },
    {
      _id: "match-003",
      jobId: "job-003",
      job: {
        title: "Hỗ trợ khách hàng - Linh hoạt",
        company: { id: "company-003", name: "Lazada Logistics", trustScore: 4.7, reviewCount: 35 },
        salary: 280000,
        salaryUnit: "VNĐ/ca",
        workingSchedule: [
          { day: "Thứ 4", period: "chiều" },
          { day: "Thứ 6", period: "chiều" },
          { day: "Thứ 7", period: "chiều" },
        ],
      },
      score: 75,
      reasons: [
        "Lịch làm việc phù hợp (60 điểm)",
        "Hình thức công việc phù hợp (10 điểm)",
        "Danh mục sản phẩm liên quan (5 điểm)",
      ],
      status: "pending",
    },
  ];

  // Fetch matches from API (currently using mock data)
  const fetchMatches = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(
      //   `http://localhost:3000/api/v1/matching/results/${userId}`
      // );
      // const data = await response.json();
      // setMatches(data);
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMatches(mockMatches);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run matching algorithm
  const handleRunMatching = async () => {
    setRunningMatch(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(
      //   `http://localhost:3000/api/v1/matching/run/${userId}`,
      //   { method: "POST" }
      // );
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Fetch new results
      await fetchMatches();
    } catch (error) {
      console.error("Failed to run matching:", error);
    } finally {
      setRunningMatch(false);
    }
  };

  // Handle accept/reject response
  const handleRespond = async (matchId, status) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // await fetch(
      //   `http://localhost:3000/api/v1/matching/results/${matchId}/respond`,
      //   {
      //     method: "PATCH",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ status }),
      //   }
      // );
      
      // Update local state
      setMatches(
        matches.map((match) =>
          match._id === matchId ? { ...match, status } : match
        )
      );
    } catch (error) {
      console.error("Failed to respond to match:", error);
    }
  };

  // Load matches on component mount
  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <div className="matches-container">
      <header className="matches-header">
        <h1>Kết Quả Matching - Tìm Việc Thêm Phù Hợp</h1>
        <p>Hệ thống tự động ghép nối ca làm việc với lịch học của bạn</p>
      </header>

      <div className="matches-controls">
        <button
          className="btn btn-primary"
          onClick={handleRunMatching}
          disabled={runningMatch || loading}
        >
          {runningMatch ? "⏳ Đang chạy matching..." : "🔄 Chạy Matching"}
        </button>
      </div>

      <div className="matches-content">
        {loading || runningMatch ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải kết quả matching...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <p>Không có kết quả matching nào.</p>
            <p>Hãy chạy matching để tìm ca làm việc phù hợp.</p>
          </div>
        ) : (
          <div className="matches-list">
            {matches.map((match) => (
              <div key={match._id} className="match-card">
                <div className="match-header">
                  <div className="match-title-section">
                    <h2 className="match-title">{match.job.title}</h2>
                    <span className={`match-score score-${match.score > 80 ? "high" : "medium"}`}>
                      {match.score}% Phù Hợp
                    </span>
                  </div>
                  <span className={`match-status status-${match.status}`}>
                    {match.status === "pending" ? "Chờ phản hồi" : match.status === "accepted" ? "✓ Đã nhận" : "✗ Từ chối"}
                  </span>
                </div>

                <div className="match-company">
                  <h3>{match.job.company.name}</h3>
                  <div className="trust-info">
                    <span className="trust-score">⭐ {match.job.company.trustScore.toFixed(1)}</span>
                    <span className="review-count">({match.job.company.reviewCount} đánh giá)</span>
                  </div>
                </div>

                <div className="match-details">
                  <div className="detail-item">
                    <span className="label">💰 Lương:</span>
                    <span className="value">{match.job.salary.toLocaleString()} {match.job.salaryUnit}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">📅 Lịch làm:</span>
                    <span className="value">
                      {match.job.workingSchedule.map((s) => `${s.day} (${s.period})`).join(", ")}
                    </span>
                  </div>
                </div>

                <div className="match-reasons">
                  <h4>Lý do ghép nối:</h4>
                  <ul>
                    {match.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <div className="match-actions">
                  <Link to={`/jobs/${match.jobId}`} className="btn btn-link">
                    Xem Chi Tiết →
                  </Link>
                  {match.status === "pending" && (
                    <>
                      <button
                        className="btn btn-accept"
                        onClick={() => handleRespond(match._id, "accepted")}
                      >
                        ✓ Nhận Ca
                      </button>
                      <button
                        className="btn btn-reject"
                        onClick={() => handleRespond(match._id, "rejected")}
                      >
                        ✗ Từ Chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
