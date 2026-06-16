import React, { useState, useEffect, useRef } from "react";
import "./JobList.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer/Footer";
import JobFilter from "../../components/Filter/JobFilter";
import HomeJobCard from "../../components/HomeJobCard/HomeJobCard";
import { useLocation, useNavigate } from "react-router-dom";
import Pagination from '@mui/material/Pagination';
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { TextField, Select, MenuItem, FormControl, Button } from "@mui/material";
import apiClient from "../../api/client";
import { CITY_OPTIONS, toCityOptions } from "../../constants/cities";

const JobList = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialLoad = useRef(true);
  
  // State cho form tìm kiếm
  const [searchForm, setSearchForm] = useState({
    keyword: searchParams.get("keyword") || "",
    address: searchParams.get("address") || ""
  });
  
  // State cho tìm kiếm đã áp dụng
  const [appliedSearch, setAppliedSearch] = useState({
    keyword: searchParams.get("keyword") || "",
    address: searchParams.get("address") || ""
  });
  
  // State cho danh sách công việc và phân trang
  const [jobs, setJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // State cho bộ lọc
  const [filters, setFilters] = useState({
    jobType: searchParams.get("jobType")?.split(",") || [],
    category: searchParams.get("category")?.split(",") || ["Tất cả"],
    jobForm: searchParams.get("jobForm")?.split(",") || ["Tất cả"],
    days: searchParams.get("days")?.split(",") || [],
    minSalary: searchParams.get("minSalary") || "",
    maxSalary: searchParams.get("maxSalary") || "",
    available: searchParams.get("available")?.split(",") || []
  });
  
  // State cho sắp xếp
  const [sortOption, setSortOption] = useState({
    sortKey: searchParams.get("sortKey") || "startDate",
    sortValue: searchParams.get("sortValue") || "desc"
  });
  
  // State cho dropdown sắp xếp
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Danh sách địa điểm cho dropdown
  const [addressOptions, setAddressOptions] = useState(CITY_OPTIONS);
  
  // Fetch danh sách địa điểm từ API
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await apiClient.get("/api/v1/address");
        if (response.data && response.data.address) {
          setAddressOptions(toCityOptions(response.data.address));
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách địa điểm:", error);
        setAddressOptions(CITY_OPTIONS);
      }
    };
    fetchAddresses();
  }, []);
  
  // Xử lý bấm bên ngoài dropdown để đóng nó
  useEffect(() => {
    const closeDropdown = (e) => {
      // Nếu click không phải là vào dropdown, thì đóng dropdown
      if (showSortDropdown && !e.target.closest('.jobs-sort-dropdown-container')) {
        setShowSortDropdown(false);
      }
    };
    
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [showSortDropdown]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsFilterModalOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);
  
  // Fetch danh sách công việc từ API dựa trên các tham số tìm kiếm và lọc
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // Xây dựng query parameters từ state
        const params = new URLSearchParams();
        
        // Tham số tìm kiếm (sử dụng appliedSearch để chỉ áp dụng khi nhấn nút tìm kiếm)
        if (appliedSearch.keyword) params.append("keyword", appliedSearch.keyword);
        if (appliedSearch.address) params.append("address", appliedSearch.address);
        
        // Tham số phân trang
        params.append("page", currentPage);
        params.append("limit", 9); // Số lượng job trên mỗi trang
        
        // Thêm các tham số lọc - Kiểm tra null/undefined trước khi truy cập .length
        if (filters.jobType && filters.jobType.length > 0) params.append("jobType", filters.jobType.join(","));
        if (filters.category && filters.category.length > 0 && !filters.category.includes("Tất cả")) {
          params.append("category", filters.category.join(","));
        }
        if (filters.jobForm && filters.jobForm.length > 0 && !filters.jobForm.includes("Tất cả")) {
          params.append("jobForm", filters.jobForm.join(","));
        }
        if (filters.days && filters.days.length > 0) params.append("days", filters.days.join(","));
        if (filters.minSalary) params.append("minSalary", filters.minSalary);
        if (filters.maxSalary) params.append("maxSalary", filters.maxSalary);
        if (filters.available && filters.available.length > 0) params.append("available", filters.available.join(","));
        
        // Thêm tham số sắp xếp
        if (sortOption.sortKey) params.append("sortKey", sortOption.sortKey);
        if (sortOption.sortValue) params.append("sortValue", sortOption.sortValue);
        
        // Gọi API với các tham số
        const response = await apiClient.get(`/api/v1/jobs?${params.toString()}`);
        
        if (response.data) {
          setJobs(response.data.data || []);
          setTotalJobs(response.data.countJobs || 0);
          
          // Cập nhật tổng số trang dựa vào pagination từ API
          if (response.data.pagination && response.data.pagination.totalPages) {
            setTotalPages(response.data.pagination.totalPages);
          } else {
            // Đảm bảo rằng luôn có ít nhất 1 trang
            setTotalPages(Math.ceil((response.data.countJobs || 0) / 9));
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách công việc:", error);
        setJobs([]); // Đảm bảo jobs là một mảng rỗng khi có lỗi
      } finally {
        setIsLoading(false);
        
        // Cuộn lên đầu trang sau khi tải dữ liệu xong
        // Bỏ qua lần đầu tiên tải trang
        if (!initialLoad.current) {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        } else {
          initialLoad.current = false;
        }
      }
    };
    
    fetchJobs();
    
    // Cập nhật URL với searchParams mới
    const newSearchParams = new URLSearchParams();
    if (appliedSearch.keyword) newSearchParams.set("keyword", appliedSearch.keyword);
    if (appliedSearch.address) newSearchParams.set("address", appliedSearch.address);
    if (currentPage > 1) newSearchParams.set("page", currentPage.toString());
    
    // Thêm các tham số lọc vào URL - Kiểm tra null/undefined trước khi truy cập .length
    if (filters.jobType && filters.jobType.length > 0) newSearchParams.set("jobType", filters.jobType.join(","));
    if (filters.category && filters.category.length > 0 && !filters.category.includes("Tất cả")) {
      newSearchParams.set("category", filters.category.join(","));
    }
    if (filters.jobForm && filters.jobForm.length > 0 && !filters.jobForm.includes("Tất cả")) {
      newSearchParams.set("jobForm", filters.jobForm.join(","));
    }
    if (filters.days && filters.days.length > 0) newSearchParams.set("days", filters.days.join(","));
    if (filters.minSalary) newSearchParams.set("minSalary", filters.minSalary);
    if (filters.maxSalary) newSearchParams.set("maxSalary", filters.maxSalary);
    if (filters.available && filters.available.length > 0) newSearchParams.set("available", filters.available.join(","));
    
    // Thêm tham số sắp xếp vào URL
    if (sortOption.sortKey) newSearchParams.set("sortKey", sortOption.sortKey);
    if (sortOption.sortValue) newSearchParams.set("sortValue", sortOption.sortValue);
    
    // Cập nhật URL không làm mới trang
    navigate(`/jobs?${newSearchParams.toString()}`, { replace: true });
  }, [currentPage, appliedSearch, filters, sortOption, navigate]);
  
  // Xử lý khi chuyển trang
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };
  
  // Xử lý khi thay đổi giá trị trong form tìm kiếm
  const handleSearchFormChange = (field, value) => {
    setSearchForm({
      ...searchForm,
      [field]: value
    });
  };
  
  // Xử lý khi submit form tìm kiếm
  const handleSearch = () => {
    setAppliedSearch(searchForm);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm mới
  };
  
  // Nhận các filter từ component JobFilter
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset về trang 1 khi lọc mới
    setIsFilterModalOpen(false);
  };
  
  // Xử lý khi thay đổi tùy chọn sắp xếp
  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortDropdown(false); // Đóng dropdown sau khi lựa chọn
  };

  // Xử lý hiển thị/ẩn dropdown sắp xếp
  const toggleSortDropdown = (e) => {
    e.stopPropagation(); // Ngăn chặn event bubbling
    setShowSortDropdown(!showSortDropdown);
  };

  // Chuyển đổi dữ liệu từ API sang cấu trúc cho Card component
  const formatJobForCard = (job) => {
    if (!job) return {};
    
    // Tính số ngày còn lại cho deadline
    const deadline = calculateRemainingDays(job.endDate);
    
    return {
      _id: job._id || "",
      title: job.title || "Không có tiêu đề",
      description: job.description || "",
      jobType: job.jobType || "Không xác định",
      category: job.category || "Không xác định",
      company: {
        logo: job.company?.logo || null,
        name: job.company?.name || "Không có tên công ty",
        location: job.company?.location || "Không xác định",
      },
      address: job.address || "Không có địa chỉ",
      salary: job.salary || 0,
      salaryUnit: job.salaryUnit || "buổi",
      startDate: job.startDate || new Date(),
      endDate: job.endDate || new Date(),
      createdAt: job.createdAt,
      deadline: deadline,
    };
  };
  
  // Tính số ngày còn lại đến deadline
  const calculateRemainingDays = (endDateStr) => {
    if (!endDateStr) return 0;
    
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="job-list-page">
      <Header />
      
      <div className="job-list-container">
        <div className="search-section">
          <h1 className="page-title">Tìm việc</h1>
          <p className="page-subtitle">Tìm kiếm công việc phù hợp với thời gian và sở thích của bạn</p>
          
          <div className="search-bar-container">
            <div className="search-name">
              <TextField
                fullWidth
                placeholder="Tên công việc"
                variant="outlined"
                value={searchForm.keyword}
                onChange={(e) => handleSearchFormChange("keyword", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon style={{ color: "#222", marginRight: "8px" }} />
                  ),
                }}
              />
            </div>
            
            <div className="search-address">
              <FormControl fullWidth>
                <Select
                  value={searchForm.address}
                  onChange={(e) => handleSearchFormChange("address", e.target.value)}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Địa điểm' }}
                  startAdornment={<LocationOnIcon style={{ color: "#222", marginRight: "8px" }} />}
                  IconComponent={KeyboardArrowDownIcon}
                >
                  <MenuItem value="">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span>Tất cả địa điểm</span>
                    </div>
                  </MenuItem>
                  {addressOptions.map((addr, index) => (
                    <MenuItem key={index} value={addr}>
                      {addr}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            
            <div className="search-btn-container">
              <Button
                className="open-filter-btn"
                variant="outlined"
                onClick={() => setIsFilterModalOpen(true)}
                startIcon={<FilterAltIcon />}
              >
                Lọc
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSearch}
                style={{ 
                  padding: "12px 24px",
                  textTransform: "uppercase",
                  fontWeight: "bold"
                }}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        </div>

        <div className={`content-section ${isFilterModalOpen ? "content-section-blurred" : ""}`}>
          <div className="jobs-column">
            <div className="jobs-header">
              <div className="jobs-count">
                {isLoading 
                  ? "Đang tải..." 
                  : `Tất cả công việc (${totalJobs})`
                }
              </div>
              
              {/* Dropdown tùy chọn sắp xếp tự tạo */}
              <div className="jobs-sort-dropdown-container">
                <div className="jobs-sort" onClick={toggleSortDropdown}>
                  <span>{sortOption.sortKey === "startDate" ? "Mới nhất" : "Lương cao nhất"}</span>
                  <KeyboardArrowDownIcon style={{ 
                    fontSize: 18, 
                    color: "#222",
                    transform: showSortDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s'
                  }} />
                </div>
                
                {/* Dropdown Menu */}
                {showSortDropdown && (
                  <div className="sort-dropdown-menu">
                    <div 
                      className={`sort-dropdown-item ${sortOption.sortKey === "startDate" ? "selected" : ""}`}
                      onClick={() => handleSortChange({
                        sortKey: "startDate",
                        sortValue: "desc"
                      })}
                    >
                      Mới nhất
                    </div>
                    <div 
                      className={`sort-dropdown-item ${sortOption.sortKey === "salary" ? "selected" : ""}`}
                      onClick={() => handleSortChange({
                        sortKey: "salary",
                        sortValue: "desc"
                      })}
                    >
                      Lương cao nhất
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="jobs-grid">
              {isLoading ? (
                <div className="no-jobs-found">
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : jobs && jobs.length > 0 ? (
                jobs.map((job) => (
                  <div className="job-card-container" key={job._id || `job-${Math.random()}`}>
                    <HomeJobCard job={formatJobForCard(job)} />
                  </div>
                ))
              ) : (
                <div className="no-jobs-found">
                  <p>Không tìm thấy công việc nào phù hợp.</p>
                </div>
              )}
            </div>
            
            {totalPages > 1 && (
              <div className="pagination-container">
                <Pagination 
                  count={totalPages} 
                  page={currentPage} 
                  onChange={handlePageChange} 
                  variant="outlined" 
                  shape="rounded" 
                  color="primary"
                  siblingCount={1}
                  style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '20px' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {isFilterModalOpen && (
        <div
          className="filter-modal-overlay"
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <div>
                <h2>Bộ lọc công việc</h2>
                <p>Tinh chỉnh kết quả theo mức lương và thời gian làm việc mong muốn</p>
              </div>
              <button
                className="filter-modal-close"
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                aria-label="Đóng bộ lọc"
              >
                ×
              </button>
            </div>

            <JobFilter
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default JobList;
