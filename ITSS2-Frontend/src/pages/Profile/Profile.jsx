import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Header from "../../components/Header";
import Footer from "../../components/Footer/Footer";
import viettel from "../../assets/viettel.png";
import { Button, TextField, CircularProgress, Snackbar, Alert } from "@mui/material";
import apiClient from "../../api/client";
import { DEFAULT_USER_ID } from "../../config/env";

const DEFAULT_PROFILE = {
  avatar: viettel,
  name: "",
  email: "",
  address: "",
  phone: "",
  major: "",
  university: "",
  jobType: "",
  jobForm: "",
  category: "",
  workingSchedule: []
};

const Profile = () => {
  const navigate = useNavigate();
  // Dữ liệu mặc định cho profile
  // State cho profile
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // State cho các tùy chọn dropdown
  const [categoryOptions, setCategoryOptions] = useState([]);

  
  // State cho dropdown
  const [dropdowns, setDropdowns] = useState({
    major: false,
    university: false,
    jobType: false,
    jobForm: false,
    category: false
  });

  const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
  const SCHEDULE_DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

  const getTimePeriod = (time) => {
    const hour = parseInt(time.split(":")[0]);
    if (hour < 12) return "sáng";
    if (hour < 18) return "chiều";
    return "tối";
  };

  const [selectedTimeSlots, setSelectedTimeSlots] = useState(new Set());

  // Danh sách lựa chọn cố định cho các dropdown
  const options = {
    major: ["Công nghệ thông tin", "Kinh tế", "Ngoại ngữ", "Sư phạm", "Y khoa"],
    university: ["Đại học Bách Khoa", "Đại học Kinh tế", "Đại học Ngoại thương", "Đại học Quốc gia"],
    jobType: ["Part-Time", "Full-Time", "Freelancer"],
    jobForm: ["Internship", "Contract", "Làm thêm"]
  };
  
  // ID người dùng cố định - trong thực tế sẽ lấy từ authentication
  const userId = DEFAULT_USER_ID;

  // Fetch dữ liệu profile từ API khi component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Lấy thông tin người dùng
        const userResponse = await apiClient.get(`/api/v1/users/${userId}`);
        
        if (userResponse.data) {
          // Chuyển đổi dữ liệu schedule từ API sang định dạng availability
          const availability = {
            "Thứ 2": { "Ca sáng": false, "Ca chiều": false, "Ca tối": false },
            "Thứ 3": { "Ca sáng": false, "Ca chiều": false, "Ca tối": false },
            "Thứ 4": { "Ca sáng": false, "Ca chiều": false, "Ca tối": false },
            "Thứ 5": { "Ca sáng": false, "Ca chiều": false, "Ca tối": false },
            "Thứ 6": { "Ca sáng": false, "Ca chiều": false, "Ca tối": false },
            "Thứ 7": { "Ca sáng": false, "Ca chiều": false, "Ca tối": false },
            "Chủ nhật": { "Ca sáng": false, "Ca chiều": false, "Ca tối": false },
          };
          
          // Nếu có lịch làm việc, cập nhật vào availability
          if (userResponse.data.workingSchedule && userResponse.data.workingSchedule.length > 0) {
            userResponse.data.workingSchedule.forEach(schedule => {
              // Chuyển đổi "sáng", "chiều", "tối" thành "Ca sáng", "Ca chiều", "Ca tối"
              const periodKey = `Ca ${schedule.period}`;
              if (availability[schedule.day]) {
                availability[schedule.day][periodKey] = true;
              }
            });
          }
          
          // Gán dữ liệu vào state
          setProfile({
            ...DEFAULT_PROFILE,
            ...userResponse.data,
            availability: availability
          });
        }
        
        // Lấy danh sách danh mục công việc
        const categoryResponse = await apiClient.get(`/api/v1/users/${userId}/get-category-list`);
        if (categoryResponse.data) {
          setCategoryOptions(categoryResponse.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        setNotification({
          open: true,
          message: "Không thể tải thông tin người dùng. Vui lòng thử lại sau.",
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

    useEffect(() => {
    if (profile.workingSchedule && Array.isArray(profile.workingSchedule)) {
      const slots = new Set();
      
      profile.workingSchedule.forEach(schedule => {
        if (schedule.time) {
          // New hourly format
          slots.add(`${schedule.day}|${schedule.time}`);
        } else if (schedule.period) {
          // Old period format: convert to time slots
          // Assuming: "sáng" = 08:00, "chiều" = 14:00, "tối" = 18:00
          const periodTimes = {
            "sáng": ["08:00", "10:00", "12:00"],
            "chiều": ["14:00", "16:00"],
            "tối": ["18:00", "20:00", "22:00"]
          };
          
          const times = periodTimes[schedule.period] || [];
          times.forEach(time => {
            slots.add(`${schedule.day}|${time}`);
          });
        }
      });
      
      setSelectedTimeSlots(slots);
    }
  }, [profile._id]);

  const toggleTimeSlot = (day, time) => {
    const key = `${day}|${time}`;
    setSelectedTimeSlots(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Xử lý khi thay đổi giá trị input
  const handleInputChange = (field, value) => {
    setProfile({
      ...profile,
      [field]: value
    });
  };

  // Xử lý khi chọn một option từ dropdown
  const handleSelectOption = (field, value) => {
    setProfile({
      ...profile,
      [field]: value
    });
    
    // Đóng dropdown sau khi chọn
    setDropdowns({
      ...dropdowns,
      [field]: false
    });
  };

  // Xử lý toggle dropdown
  const toggleDropdown = (dropdown) => {
    setDropdowns({
      ...dropdowns,
      [dropdown]: !dropdowns[dropdown]
    });
  };

  // Xử lý thay đổi lịch trình làm việc
  const handleAvailabilityChange = (day, period) => {
    const updatedAvailability = { ...profile.availability };
    updatedAvailability[day][period] = !updatedAvailability[day][period];
    
    setProfile({
      ...profile,
      availability: updatedAvailability
    });
  };

  // Xử lý cập nhật profile
  const handleUpdateProfile = async () => {
    setSaving(true);
    
    try {
      // Convert selectedTimeSlots to workingSchedule with hourly format
      const workingSchedule = Array.from(selectedTimeSlots).map(slot => {
        const [day, time] = slot.split("|");
        return { day, time };
      });
      
      // Chuẩn bị dữ liệu gửi lên server
      const userData = {
        name: profile.name,
        email: profile.email,
        address: profile.address,
        phone: profile.phone,
        jobType: profile.jobType,
        jobForm: profile.jobForm,
        university: profile.university,
        major: profile.major,
        category: profile.category,
        workingSchedule: workingSchedule
      };
      
      // Gửi dữ liệu lên server
      const response = await apiClient.post(`/api/v1/users/${userId}`, userData);
      
      if (response.status === 200) {
        setNotification({
          open: true,
          message: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Cập nhật thông tin thành công!</span>
              <Button 
                variant="outlined" 
                size="small" 
                color="inherit" 
                onClick={() => navigate('/matches')}
                style={{ borderColor: 'white', color: 'white' }}
              >
                Xem việc phù hợp ngay
              </Button>
            </div>
          ),
          severity: "success"
        });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      setNotification({
        open: true,
        message: "Không thể cập nhật thông tin. Vui lòng thử lại sau.",
        severity: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  // Xử lý đóng notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress style={{ color: '#6300b3' }} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />
      
      <div className="profile-gradient-banner"></div>
      
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-section">
              <img 
                src={profile.avatar} 
                alt="Avatar" 
                className="profile-avatar" 
              />
              <div className="profile-info">
                <h2 className="profile-name">{profile.name}</h2>
                <p className="profile-email">{profile.email}</p>
              </div>
            </div>
            
            <Button 
              variant="contained"
              className="update-btn"
              onClick={handleUpdateProfile}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} style={{ color: 'white' }} /> : "Cập nhật"}
            </Button>
          </div>
          
          <div className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>Họ và tên</label>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={profile.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="profile-input"
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={profile.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="profile-input"
                  type="email"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Địa chỉ</label>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={profile.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="profile-input"
                  placeholder="Nhập địa chỉ của bạn"
                />
              </div>
              
              <div className="form-group">
                <label>Số điện thoại</label>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={profile.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="profile-input"
                  placeholder="Nhập số điện thoại của bạn"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Khoa/Ngành học</label>
                <div className="custom-dropdown">
                  <div 
                    className="dropdown-selection"
                    onClick={() => toggleDropdown("major")}
                  >
                    {profile.major || "Chọn khoa/ngành học"}
                    <KeyboardArrowDownIcon className={`dropdown-icon ${dropdowns.major ? "rotated" : ""}`} />
                  </div>
                  
                  {dropdowns.major && (
                    <div className="dropdown-options">
                      {options.major.map((option, index) => (
                        <div 
                          key={index} 
                          className="dropdown-option"
                          onClick={() => handleSelectOption("major", option)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Trường học</label>
                <div className="custom-dropdown">
                  <div 
                    className="dropdown-selection"
                    onClick={() => toggleDropdown("university")}
                  >
                    {profile.university || "Chọn trường học"}
                    <KeyboardArrowDownIcon className={`dropdown-icon ${dropdowns.university ? "rotated" : ""}`} />
                  </div>
                  
                  {dropdowns.university && (
                    <div className="dropdown-options">
                      {options.university.map((option, index) => (
                        <div 
                          key={index} 
                          className="dropdown-option"
                          onClick={() => handleSelectOption("university", option)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Loại công việc mong muốn</label>
                <div className="custom-dropdown">
                  <div 
                    className="dropdown-selection"
                    onClick={() => toggleDropdown("jobType")}
                  >
                    {profile.jobType || "Chọn loại công việc"}
                    <KeyboardArrowDownIcon className={`dropdown-icon ${dropdowns.jobType ? "rotated" : ""}`} />
                  </div>
                  
                  {dropdowns.jobType && (
                    <div className="dropdown-options">
                      {options.jobType.map((option, index) => (
                        <div 
                          key={index} 
                          className="dropdown-option"
                          onClick={() => handleSelectOption("jobType", option)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Hình thức công việc mong muốn</label>
                <div className="custom-dropdown">
                  <div 
                    className="dropdown-selection"
                    onClick={() => toggleDropdown("jobForm")}
                  >
                    {profile.jobForm || "Chọn hình thức công việc"}
                    <KeyboardArrowDownIcon className={`dropdown-icon ${dropdowns.jobForm ? "rotated" : ""}`} />
                  </div>
                  
                  {dropdowns.jobForm && (
                    <div className="dropdown-options">
                      {options.jobForm.map((option, index) => (
                        <div 
                          key={index} 
                          className="dropdown-option"
                          onClick={() => handleSelectOption("jobForm", option)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Vị trí công việc mong muốn</label>
                <div className="custom-dropdown">
                  <div 
                    className="dropdown-selection"
                    onClick={() => toggleDropdown("category")}
                  >
                    {profile.category || "Chọn vị trí công việc"}
                    <KeyboardArrowDownIcon className={`dropdown-icon ${dropdowns.category ? "rotated" : ""}`} />
                  </div>
                  
                  {dropdowns.category && (
                    <div className="dropdown-options">
                      {categoryOptions.map((option, index) => (
                        <div 
                          key={index} 
                          className="dropdown-option"
                          onClick={() => handleSelectOption("category", option)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="schedule-section">
  <h3 className="schedule-title">🗓️ Đăng ký thời gian rảnh của bạn</h3>
  <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
    Chọn các khung giờ bạn có thể làm việc. Hệ thống sẽ tự động tìm công việc phù hợp.
  </p>

  <div className="time-grid-container">
    <table className="time-grid-table">
      <thead>
        <tr>
          <th>Giờ</th>
          {SCHEDULE_DAYS.map(day => (
            <th key={day}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {TIME_SLOTS.map(time => (
          <tr key={time}>
            <td className="time-label">{time}</td>
            {SCHEDULE_DAYS.map(day => {
              const slotKey = `${day}|${time}`;
              const isSelected = selectedTimeSlots.has(slotKey);
              return (
                <td key={day} style={{ padding: '8px' }}>
                  <div
                    className={isSelected ? 'time-cell selected' : 'time-cell'}
                    onClick={() => toggleTimeSlot(day, time)}
                    role="button"
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {selectedTimeSlots.size > 0 && (
    <div className="schedule-summary">
      ✨ <strong>Đã chọn {selectedTimeSlots.size} khung giờ</strong> — Hệ thống đang tự động tìm kiếm công việc phù hợp...
    </div>
  )}
</div>
          </div>
        </div>
      </div>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      <Footer />
    </div>
  );
};

export default Profile;
