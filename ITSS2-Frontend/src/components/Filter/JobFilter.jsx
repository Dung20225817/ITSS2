import React, { useState } from "react";
import "./JobFilter.css";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Slider from "@mui/material/Slider";

const SALARY_MIN = 0;
const DEFAULT_SALARY_MAX = 100000000;
const SALARY_STEP = 500000;
const JOB_TYPES = [
  { name: "Full-time" },
  { name: "Part-time" }
];

const formatSalary = (value) => `${Number(value).toLocaleString("vi-VN")}đ`;
const parseSalaryValue = (value) => {
  const salary = Number(value);
  return Number.isFinite(salary) && salary >= 0 ? salary : null;
};
const roundSalaryLimit = (value, fallback = DEFAULT_SALARY_MAX) => {
  const salary = parseSalaryValue(value);
  if (!salary) return fallback;
  return Math.ceil(salary / SALARY_STEP) * SALARY_STEP;
};
const normalizeJobTypes = (jobTypes = []) => {
  return jobTypes
    .map((jobType) => JOB_TYPES.find((type) => type.name.toLowerCase() === jobType.toLowerCase())?.name)
    .filter(Boolean);
};

const JobFilter = ({ onFilterChange, initialFilters = {}, salaryBounds = {} }) => {
  // State cho sections mở rộng
  const [expanded, setExpanded] = useState({
    workTime: true
  });
  
  // State cho bộ lọc
  const [filters, setFilters] = useState({
    jobType: normalizeJobTypes(initialFilters.jobType || []),
    category: ["Tất cả"],
    jobForm: ["Tất cả"],
    days: initialFilters.days || [],
    minSalary: initialFilters.minSalary || "",
    maxSalary: initialFilters.maxSalary || "",
    available: initialFilters.available || []
  });

  // State cho theo dõi trạng thái thu gọn/mở rộng
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedMinSalary = parseSalaryValue(filters.minSalary);
  const selectedMaxSalary = parseSalaryValue(filters.maxSalary);
  const salaryMax = Math.max(
    roundSalaryLimit(salaryBounds.maxSalary),
    roundSalaryLimit(selectedMinSalary, SALARY_MIN),
    roundSalaryLimit(selectedMaxSalary, SALARY_MIN),
    SALARY_STEP
  );
  const rawSalaryValue = [
    selectedMinSalary ?? SALARY_MIN,
    selectedMaxSalary ?? salaryMax
  ];
  const salaryValue = [
    Math.min(rawSalaryValue[0], rawSalaryValue[1]),
    Math.max(rawSalaryValue[0], rawSalaryValue[1])
  ];
  
  // Xử lý khi toggle section
  const toggleSection = (section) => {
    setExpanded({
      ...expanded,
      [section]: !expanded[section]
    });
  };

  // Xử lý khi nhấn nút thu hẹp/mở rộng
  const toggleAllSections = () => {
    const newExpandedState = !isCollapsed;
    setIsCollapsed(newExpandedState);
    
    // Đặt tất cả các section thành cùng giá trị (true nếu mở rộng, false nếu thu gọn)
    setExpanded({
      workTime: !newExpandedState
    });
  };
  
  // Xử lý khi thay đổi loại công việc
  const handleJobTypeChange = (type) => {
    let newJobTypes = [...(filters.jobType || [])];
    
    if (newJobTypes.includes(type)) {
      // Nếu đã chọn, bỏ chọn
      newJobTypes = newJobTypes.filter(item => item !== type);
      
      // Nếu loại bỏ Part-Time, cũng xóa tất cả các ngày đã chọn
      if (type.toLowerCase() === "part-time") {
        setFilters({ 
          ...filters, 
          jobType: newJobTypes,
          days: [],
          available: []
        });
        return;
      }
    } else {
      // Nếu chưa chọn, thêm vào
      newJobTypes.push(type);
    }
    
    setFilters({ ...filters, jobType: newJobTypes });
  };
  
  // Xử lý khi thay đổi ngày làm việc
  const handleDayChange = (day) => {
    let newDays = [...(filters.days || [])];
    
    if (newDays.includes(day)) {
      // Xóa ngày
      newDays = newDays.filter(item => item !== day);
      
      // Đồng thời xóa tất cả các ca liên quan đến ngày này
      let newSchedule = [...(filters.available || [])];
      newSchedule = newSchedule.filter(item => !item.startsWith(`${day}-`));
      
      setFilters({ 
        ...filters, 
        days: newDays,
        available: newSchedule 
      });
    } else {
      // Thêm ngày
      newDays.push(day);
      setFilters({ ...filters, days: newDays });
    }
  };
  
  // Xử lý khi thay đổi lịch trình làm việc (thứ + ca)
  const handleScheduleChange = (day, period) => {
    const scheduleItem = `${day}-${period}`;
    let newSchedule = [...(filters.available || [])];
    
    if (newSchedule.includes(scheduleItem)) {
      newSchedule = newSchedule.filter(item => item !== scheduleItem);
    } else {
      newSchedule.push(scheduleItem);
    }
    
    setFilters({ ...filters, available: newSchedule });
  };
  
  // Xử lý khi thay đổi mức lương
  const handleSalaryChange = (_, value) => {
    const [minSalary, maxSalary] = value;
    setFilters({ 
      ...filters, 
      minSalary: minSalary === SALARY_MIN ? "" : String(minSalary),
      maxSalary: maxSalary === salaryMax ? "" : String(maxSalary)
    });
  };
  
  // Xử lý khi nhấn nút Lọc
  const handleFilter = () => {
    onFilterChange(filters);
  };
  
  // Xử lý khi nhấn nút Xóa tất cả
  const handleClearAll = () => {
    const emptyFilters = {
      jobType: [],
      category: ["Tất cả"],
      jobForm: ["Tất cả"],
      days: [],
      minSalary: "",
      maxSalary: "",
      available: []
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };
  
  // Kiểm tra xem thứ có được chọn không
  const isDaySelected = (day) => {
    return Array.isArray(filters.days) && filters.days.includes(day);
  };
  
  // Kiểm tra xem ca trong thứ có được chọn không
  const isPeriodSelected = (day, period) => {
    return Array.isArray(filters.available) && filters.available.includes(`${day}-${period}`);
  };

  // Kiểm tra xem Part-Time có được chọn
  const isPartTimeSelected = () => {
    return Array.isArray(filters.jobType) && filters.jobType.some((type) => type.toLowerCase() === "part-time");
  };

  return (
    <div className="filter-outer-container">
      <div className="filter-header-outer">
        <h3 className="filter-title">Bộ lọc</h3>
        <button className="clear-all-btn" onClick={handleClearAll}>Xóa tất cả</button>
      </div>
      
      <div className="job-filter">
        {/* Salary Range */}
        <div className="filter-section">
          <h4 className="section-title">Mức Lương</h4>
          <div className="salary-slider">
            <Slider
              value={salaryValue}
              min={SALARY_MIN}
              max={salaryMax}
              step={SALARY_STEP}
              onChange={handleSalaryChange}
              valueLabelDisplay="auto"
              valueLabelFormat={formatSalary}
              disableSwap
              aria-label="Khoảng lương"
            />
            <div className="salary-slider-labels">
              <span>{filters.minSalary ? formatSalary(filters.minSalary) : "Từ 0đ"}</span>
              <span>{filters.maxSalary ? formatSalary(filters.maxSalary) : `Đến ${formatSalary(salaryMax)}`}</span>
            </div>
          </div>
        </div>
        
        <div className="section-divider"></div>

        {/* Work Time */}
        <div className="filter-section">
          <div className="section-header" onClick={() => toggleSection("workTime")}>
            <h4 className="section-title">Thời gian làm việc</h4>
            <ExpandMoreIcon className={`expand-icon ${expanded.workTime ? "" : "rotated"}`} />
          </div>
          
          {expanded.workTime && (
            <div className="section-content">
              {JOB_TYPES.map((type, index) => (
                <div className="checkbox-item" key={index}>
                  <input 
                    type="checkbox" 
                    id={`type-${index}`} 
                    checked={Array.isArray(filters.jobType) && filters.jobType.includes(type.name)}
                    onChange={() => handleJobTypeChange(type.name)}
                  />
                  <label htmlFor={`type-${index}`}>{type.name}</label>
                </div>
              ))}
              
              {/* Hiển thị danh sách các ngày trong tuần chỉ khi Part-Time được chọn */}
              {isPartTimeSelected() && (
                <div className="nested-options">
                  {/* Danh sách các ngày trong tuần */}
                  {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map((day, index) => (
                    <React.Fragment key={index}>
                      <div className="checkbox-item nested-item">
                        <input 
                          type="checkbox" 
                          id={`day-${index}`} 
                          checked={isDaySelected(day)}
                          onChange={() => handleDayChange(day)}
                        />
                        <label htmlFor={`day-${index}`}>{day}</label>
                      </div>
                      
                      {/* Hiển thị các ca trong ngày nếu ngày được chọn */}
                      {isDaySelected(day) && (
                        <div className="double-nested-options">
                          {["sáng", "chiều", "tối"].map((period, periodIndex) => (
                            <div className="checkbox-item double-nested-item" key={periodIndex}>
                              <input 
                                type="checkbox" 
                                id={`period-${index}-${periodIndex}`} 
                                checked={isPeriodSelected(day, period)}
                                onChange={() => handleScheduleChange(day, period)}
                              />
                              <label htmlFor={`period-${index}-${periodIndex}`}>Ca {period}</label>
                            </div>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button className="collapse-button" onClick={toggleAllSections}>
          {isCollapsed ? "Mở rộng" : "Thu hẹp"}
        </button>
      </div>
      
      <button className="filter-btn" onClick={handleFilter}>Lọc</button>
    </div>
  );
};

export default JobFilter;
