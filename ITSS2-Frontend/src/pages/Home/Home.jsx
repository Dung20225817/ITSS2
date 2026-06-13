import Header from "../../components/Header";
import "./Home.css";
import banner from "../../assets/banner.png";
import fpt from "../../assets/fpt.png";
import viettel from "../../assets/viettel.png";
import sun from "../../assets/sun.png";
import vnpt from "../../assets/vnpt.png";
import ibm from "../../assets/ibm.png";

import SearchBar from "../../components/SearchBar/SearchBar";
import { useCallback, useEffect, useState } from "react";
import HomeJobCard from "../../components/HomeJobCard/HomeJobCard";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import Testimonial from "../../components/Testimonial/Testimonial";
import apiClient from "../../api/client";
import { DEFAULT_USER_ID } from "../../config/env";
import { Button } from "@mui/material";

const Home = () => {
  const navigate = useNavigate();
  const [newestJobs, setNewestJobs] = useState([]);
  const [forYoujobs, setForYouJobs] = useState([]);
  const [user, setUser] = useState({});

  const handleViewNewestJobs = () => {
    navigate(`jobs?sortKey=createdAt&sortValue=desc`);
  };

  const handleViewForYouJobs = () => {
    let workingSchedule = "";
    let days = "";
    const userSchedule = user.workingSchedule || [];

    if (userSchedule.length > 0) {
      workingSchedule = userSchedule
        .map((ws) => `${ws.day}-${ws.period}`)
        .join(",");

      days = userSchedule.map((ws) => ws.day).join(",");
    }

    const params = new URLSearchParams();

    if (workingSchedule && user.jobType === "Part-Time")
      params.append("available", workingSchedule);
    if (days && user.jobType === "Part-Time") params.append("days", days);
    if (user.jobType) params.append("jobType", user.jobType);
    if (user.jobForm) params.append("jobForm", user.jobForm);
    if (user.category) params.append("category", user.category);

    const query = params.toString();
    navigate(`/jobs?${query}&sortKey=createdAt&sortValue=desc`);
  };

  const fetchNewestJobs = useCallback(async () => {
    try {
      const res = await apiClient.get(
        "/api/v1/jobs?sortKey=createdAt&sortValue=desc&limit=6&page=1"
      );
      setNewestJobs(res.data.data);
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Đã có lỗi xảy ra. Vui lòng thử lại";
      console.log(errorMessage);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/v1/users/${DEFAULT_USER_ID}`);
      setUser(res.data);
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Đã có lỗi xảy ra. Vui lòng thử lại";
      console.log(errorMessage);
    }
  }, []);

  const fetchForYouJobs = useCallback(async () => {
    let workingSchedule = "";
    const userSchedule = user.workingSchedule || [];

    if (userSchedule.length > 0) {
      workingSchedule = userSchedule
        .map((ws) => `${ws.day}-${ws.period}`)
        .join(",");
    }
    const params = new URLSearchParams();

    if (user.jobType === "Part-Time" && workingSchedule)
      params.append("available", workingSchedule);
    if (user.jobType) params.append("jobType", user.jobType);
    if (user.jobForm) params.append("jobForm", user.jobForm);
    if (user.category) params.append("category", user.category);

    try {
      params.append("sortKey", "createdAt");
      params.append("sortValue", "desc");
      params.append("limit", "6");
      params.append("page", "1");
      const res = await apiClient.get(`/api/v1/jobs?${params.toString()}`);
      setForYouJobs(res.data.data);
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Đã có lỗi xảy ra. Vui lòng thử lại";
      console.log(errorMessage);
    }
  }, [user]);

  useEffect(() => {
    fetchNewestJobs();
    fetchUser();
  }, [fetchNewestJobs, fetchUser]);

  useEffect(() => {
    if (user._id) fetchForYouJobs();
  }, [fetchForYouJobs, user._id]);

  return (
    <div className="home-page">
      <Header />

      <div className="banner">
        <img src={banner} alt="" />
        <div className="banner-text">
          <div className="banner-text-1">
            Đưa ra những gì bạn thích, chúng tôi sẽ đưa ra những gì bạn muốn.
          </div>
          <div className="banner-text-2">
            Có rất nhiều nhà tuyển dụng đang chờ đón bạn.
          </div>
          <SearchBar />
          <div className="banner-text-3">
            Gợi ý: Gia sư, phục vụ, cộng tác viên lập trình, pháp sư ...
          </div>
          <div style={{ marginTop: "24px" }}>
            <Button 
              variant="contained" 
              onClick={() => navigate('/matches')}
              style={{ backgroundColor: '#49B3FC', color: 'white', padding: '12px 28px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '8px' }}
            >
               XEM VIỆC PHÙ HỢP NHẤT
            </Button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="job-list-container">
          <div className="job-list-title-container">
            <div className="job-list-title">Công việc mới nhất</div>
            <div className="job-list-des">
              Lựa chọn những doanh nghiệp uy tín hàng đầu
            </div>
          </div>

          <div className="home-job-grid">
            {newestJobs.length > 0 &&
              newestJobs.slice(0, 6).map((job, index) => (
                <HomeJobCard key={`newest-job-${job._id || index}`} job={job} />
              ))}
          </div>

          <div className="view-all-btn" onClick={handleViewNewestJobs}>
            Xem tất cả
          </div>
        </div>

        <div className="job-list-container">
          <div className="job-list-title-container">
            <div className="job-list-title">Công việc phù hợp với bạn</div>
            <div className="job-list-des">
              Lựa chọn những doanh nghiệp uy tín hàng đầu
            </div>
          </div>

          <div className="home-job-grid">
            {forYoujobs.length > 0 &&
              forYoujobs.slice(0, 6).map((job, index) => (
                <HomeJobCard key={`for-u-job-${job._id || index}`} job={job} />
              ))}
          </div>

          <div className="view-all-btn" onClick={handleViewForYouJobs}>
            Xem tất cả
          </div>
        </div>

        <Testimonial />

        <div className="favorite-companies">
          <div className="favorite-title-container">
            <div className="favorite-title">Top các công ty nổi tiếng</div>
            <div className="line"></div>
          </div>

          <div className="company-list">
            <div className="company-track">
              {[fpt, viettel, sun, vnpt, ibm, fpt, viettel, sun, vnpt, ibm].map(
                (logo, index) => (
                  <img src={logo} alt="company-logo" key={index} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
