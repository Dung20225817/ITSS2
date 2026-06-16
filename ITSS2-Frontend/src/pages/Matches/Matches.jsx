import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@mui/material/Pagination";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import apiClient from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import "./Matches.css";

const statusLabel = {
  pending: "Chờ phản hồi",
  accepted: "Đã chấp nhận",
  rejected: "Đã từ chối",
};

const MATCHES_PER_PAGE = 9;
const MATCHING_BATCH_SIZE = 100;

const Matches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(false);
  const [runMessage, setRunMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const userId = user?.id;

  const fetchMatches = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setErrorMessage("");
      const res = await apiClient.get(`/api/v1/matching/results/${userId}`, {
        params: {
          page: currentPage,
          limit: MATCHES_PER_PAGE,
        },
      });
      const nextMatches = res.data?.data || [];
      const nextTotalMatches = res.data?.countMatches || 0;
      const nextTotalPages =
        res.data?.pagination?.totalPage ||
        Math.max(1, Math.ceil(nextTotalMatches / MATCHES_PER_PAGE));

      setMatches(nextMatches);
      setTotalMatches(nextTotalMatches);
      setTotalPages(nextTotalPages);
    } catch (error) {
      console.error("Error fetching matches", error);
      setErrorMessage("Không thể tải danh sách công việc phù hợp.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, userId]);

  const runMatching = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setRunMessage("");
      setErrorMessage("");

      const response = await apiClient.post(
        `/api/v1/matching/run/${userId}`,
        null,
        {
          params: {
            limit: MATCHING_BATCH_SIZE,
          },
        }
      );
      const matchCount = response.data?.matchCount ?? 0;
      setRunMessage(`Đã tìm thấy ${matchCount} công việc phù hợp.`);

      setCurrentPage(1);

      const res = await apiClient.get(`/api/v1/matching/results/${userId}`, {
        params: {
          page: 1,
          limit: MATCHES_PER_PAGE,
        },
      });
      const nextMatches = res.data?.data || [];
      const nextTotalMatches = res.data?.countMatches || 0;
      const nextTotalPages =
        res.data?.pagination?.totalPage ||
        Math.max(1, Math.ceil(nextTotalMatches / MATCHES_PER_PAGE));

      setMatches(nextMatches);
      setTotalMatches(nextTotalMatches);
      setTotalPages(nextTotalPages);
    } catch (error) {
      console.error("Error running matching", error);
      setErrorMessage("Không thể chạy matching. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const respondMatch = async (matchId, status) => {
    try {
      await apiClient.patch(`/api/v1/matching/results/${matchId}/respond`, {
        status,
      });
      setMatches((current) =>
        current.map((match) =>
          match.id === matchId ? { ...match, status } : match
        )
      );
    } catch (error) {
      console.error("Error responding to match", error);
      setErrorMessage("Không thể cập nhật trạng thái công việc.");
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handlePageChange = (_event, value) => {
    setCurrentPage(value);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <Header />
      <main className="matches-container">
        <div className="matches-header">
          <h1>Công việc phù hợp của bạn</h1>
          <button
            className="run-match-btn"
            onClick={runMatching}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Chạy Matching"}
          </button>
        </div>

        {runMessage && <p className="match-run-message">{runMessage}</p>}
        {errorMessage && <p className="match-error-message">{errorMessage}</p>}
        {!loading && totalMatches > 0 && (
          <p className="match-total">Tìm thấy {totalMatches} công việc phù hợp.</p>
        )}

        {matches.length === 0 && !loading && (
          <p className="no-matches">
            Chưa có công việc nào phù hợp. Hãy cập nhật lịch rảnh và ấn Chạy
            Matching.
          </p>
        )}

        <div className="matches-list">
          {matches.map((match) => (
            <div key={match.id} className={`match-card status-${match.status}`}>
              <div className="match-info">
                <h3>{match.job.title}</h3>
                <p className="company-name">{match.job.company?.name}</p>
                <div className="score-badge">
                  Độ phù hợp: {match.score} điểm
                </div>

                <ul className="reasons-list">
                  {Array.isArray(match.reasons) &&
                    match.reasons.map((reason, index) => (
                      <li key={`${match.id}-${index}`}>✓ {reason}</li>
                    ))}
                </ul>

                <p className="status-text">
                  Trạng thái:{" "}
                  <strong>{statusLabel[match.status] || match.status}</strong>
                </p>
              </div>

              <div className="match-actions">
                <Link to={`/jobs/${match.job.id}`} className="detail-link">
                  Xem chi tiết
                </Link>
                {match.status === "pending" && (
                  <div className="action-buttons">
                    <button
                      className="btn-accept"
                      onClick={() => respondMatch(match.id, "accepted")}
                    >
                      Chấp nhận
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => respondMatch(match.id, "rejected")}
                    >
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="matches-pagination">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              variant="outlined"
              shape="rounded"
              color="primary"
              siblingCount={1}
            />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Matches;
