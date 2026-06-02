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
import Card from "../../components/Card/Card";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import apiClient from "../../api/client";
import { DEFAULT_USER_ID } from "../../config/env";

const responsive = {
  desktop: {
    breakpoint: { max: 4000, min: 1280 },
    items: 3,
  },
  laptop: {
    breakpoint: { max: 1280, min: 1024 },
    items: 3,
  },
  tablet: {
    breakpoint: { max: 1024, min: 768 },
    items: 3,
  },
  minitablet: {
    breakpoint: { max: 768, min: 480 },
    items: 3,
  },
  mobile: {
    breakpoint: { max: 480, min: 0 },
    items: 2,
  },
};

const Home = () => {
  const navigate = useNavigate();
  const [newestJobs, setNewestJobs] = useState([]);
  const [forYoujobs, setForYouJobs] = useState([]);
  const [user, setUser] = useState({});

  const handleViewNewestJobs = () => {
    navigate(`jobs?sortKey=startDate&sortValue=desc`);
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
    navigate(`/jobs?${query}&sortKey=startDate&sortValue=desc`);
  };

  const fetchNewestJobs = useCallback(async () => {
    try {
      const res = await apiClient.get(
        "/api/v1/jobs?sortKey=startDate&sortValue=desc&limit=10&page=1"
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

    const query = params.toString();
    try {
      const res = await apiClient.get(`/api/v1/jobs?${query}`);
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

          <div className="job-list">
            <Carousel
              className="hover"
              responsive={responsive}
              infinite={true}
              removeArrowOnDeviceType={["minitablet", "mobile"]}
            >
              {newestJobs.length > 0 &&
                newestJobs.map((job, index) => (
                  <Card key={`newest-job-${index}`} job={job} />
                ))}
            </Carousel>
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

          <div className="job-list">
            <Carousel
              className="hover"
              responsive={responsive}
              infinite={true}
              removeArrowOnDeviceType={["minitablet", "mobile"]}
            >
              {forYoujobs.length > 0 &&
                forYoujobs.map((job, index) => (
                  <Card key={`for-u-job-${index}`} job={job} />
                ))}
            </Carousel>
          </div>

          <div className="view-all-btn" onClick={handleViewForYouJobs}>
            Xem tất cả
          </div>
        </div>

        <div className="favorite-companies">
          <div className="favorite-title-container">
            <div className="favorite-title">Top các công ty nổi tiếng</div>
            <div className="line"></div>
          </div>

          <div className="company-list">
            <img src={fpt} alt="company-logo" />
            <img src={viettel} alt="company-logo" />
            <img src={sun} alt="company-logo" />
            <img src={vnpt} alt="company-logo" />
            <img src={ibm} alt="company-logo" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
