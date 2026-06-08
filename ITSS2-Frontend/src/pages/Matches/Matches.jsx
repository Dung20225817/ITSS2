import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "./Matches.css";

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const userId = import.meta.env.VITE_DEFAULT_USER_ID || "demo-student-1";
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/v1/matching/results/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (error) {
      console.error("Error fetching matches", error);
    } finally {
      setLoading(false);
    }
  };

  const runMatching = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/v1/matching/run/${userId}`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchMatches();
      }
    } catch (error) {
      console.error("Error running matching", error);
      setLoading(false);
    }
  };

  const respondMatch = async (matchId, status) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/matching/results/${matchId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setMatches(matches.map(m => m.id === matchId ? { ...m, status } : m));
      }
    } catch (error) {
      console.error("Error responding to match", error);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <>
      <Header />
      <main className="matches-container">
        <div className="matches-header">
          <h1>Công việc phù hợp của bạn</h1>
          <button className="run-match-btn" onClick={runMatching} disabled={loading}>
            {loading ? "Đang xử lý..." : "Chạy Matching"}
          </button>
        </div>

        {matches.length === 0 && !loading && (
          <p className="no-matches">Chưa có công việc nào phù hợp. Hãy cập nhật lịch rảnh và ấn Chạy Matching.</p>
        )}

        <div className="matches-list">
          {matches.map((match) => (
            <div key={match.id} className={`match-card status-${match.status}`}>
              <div className="match-info">
                <h3>{match.job.title}</h3>
                <p className="company-name">{match.job.company?.name}</p>
                <div className="score-badge">Độ phù hợp: {match.score} điểm</div>
                
                <ul className="reasons-list">
                  {Array.isArray(match.reasons) && match.reasons.map((reason, idx) => (
                    <li key={idx}>✓ {reason}</li>
                  ))}
                </ul>
                
                <p className="status-text">
                  Trạng thái: <strong>{match.status === 'pending' ? 'Chờ phản hồi' : match.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}</strong>
                </p>
              </div>
              
              <div className="match-actions">
                <Link to={`/jobs/${match.job.id}`} className="detail-link">Xem chi tiết</Link>
                {match.status === "pending" && (
                  <div className="action-buttons">
                    <button className="btn-accept" onClick={() => respondMatch(match.id, "accepted")}>Chấp nhận</button>
                    <button className="btn-reject" onClick={() => respondMatch(match.id, "rejected")}>Từ chối</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Matches;
