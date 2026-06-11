import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer/Footer";
import viettel from "../../assets/viettel.png";
import { Alert, Snackbar } from "@mui/material";
import {
  Button,
  Card,
  Input,
  ListBox,
  Select,
  Spinner
} from "@heroui/react";
import apiClient from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";

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

const ProfileSelect = ({ label, value, placeholder, options, onChange }) => (
  <div className="form-group">
    <label>{label}</label>
    <Select.Root
      aria-label={label}
      selectedKey={value || undefined}
      onSelectionChange={(key) => {
        if (key !== null) {
          onChange(String(key));
        }
      }}
      className="profile-select"
      fullWidth
    >
      <Select.Trigger className="profile-select-trigger">
        <Select.Value className={`profile-select-value ${value ? "" : "is-placeholder"}`}>
          {value || placeholder}
        </Select.Value>
        <Select.Indicator className="profile-select-indicator" />
      </Select.Trigger>
      <Select.Popover className="profile-select-popover">
        <ListBox className="profile-select-listbox">
          {options.map((option) => (
            <ListBox.Item
              key={option}
              id={option}
              textValue={option}
              className="profile-select-item"
            >
              {option}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select.Root>
  </div>
);

const PERIOD_TIME_SLOTS = {
  sang: ["08:00", "10:00", "12:00"],
  chieu: ["14:00", "16:00"],
  toi: ["18:00", "20:00", "22:00"]
};

const normalizePeriod = (period = "") =>
  String(period)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^ca\s+/, "")
    .trim();

const scheduleToSelectedSlots = (workingSchedule = []) => {
  const slots = new Set();

  if (!Array.isArray(workingSchedule)) {
    return slots;
  }

  workingSchedule.forEach((schedule) => {
    if (!schedule?.day) return;

    if (schedule.time) {
      slots.add(`${schedule.day}|${schedule.time}`);
      return;
    }

    const times = PERIOD_TIME_SLOTS[normalizePeriod(schedule.period)] || [];
    times.forEach((time) => {
      slots.add(`${schedule.day}|${time}`);
    });
  });

  return slots;
};

const getScheduleStorageKey = (userId) => `profile-working-schedule:${userId}`;

const readStoredSchedule = (userId) => {
  if (!userId) return null;

  try {
    const storedValue = window.localStorage.getItem(getScheduleStorageKey(userId));
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (_error) {
    return null;
  }
};

const writeStoredSchedule = (userId, workingSchedule) => {
  if (!userId) return;

  try {
    window.localStorage.setItem(
      getScheduleStorageKey(userId),
      JSON.stringify(workingSchedule)
    );
  } catch (_error) {
    // Ignore storage failures; the backend remains the source of truth.
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);
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

  
  const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
  const SCHEDULE_DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

  const [selectedTimeSlots, setSelectedTimeSlots] = useState(new Set());

  // Danh sách lựa chọn cố định cho các dropdown
  const options = {
    major: ["Công nghệ thông tin", "Kinh tế", "Ngoại ngữ", "Sư phạm", "Y khoa"],
    university: ["Đại học Bách Khoa", "Đại học Kinh tế", "Đại học Ngoại thương", "Đại học Quốc gia"],
    jobType: ["Part-Time", "Full-Time", "Freelancer"],
    jobForm: ["Internship", "Contract", "Làm thêm"]
  };
  
  // ID người dùng cố định - trong thực tế sẽ lấy từ authentication
  const userId = user?.id;

  // Fetch dữ liệu profile từ API khi component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
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
          const apiSchedule = userResponse.data.workingSchedule || [];
          const storedSchedule = readStoredSchedule(userId);
          const nextWorkingSchedule =
            scheduleToSelectedSlots(apiSchedule).size > 0 || storedSchedule === null
              ? apiSchedule
              : storedSchedule;

          setProfile({
            ...DEFAULT_PROFILE,
            ...userResponse.data,
            avatar: userResponse.data.avatar || DEFAULT_PROFILE.avatar,
            availability: availability,
            workingSchedule: nextWorkingSchedule
          });
          setSelectedTimeSlots(scheduleToSelectedSlots(nextWorkingSchedule));
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
    setSelectedTimeSlots(scheduleToSelectedSlots(profile.workingSchedule));
  }, [profile.workingSchedule]);

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

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotification({
        open: true,
        message: "Vui lòng chọn file ảnh.",
        severity: "error"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNotification({
        open: true,
        message: "Ảnh đại diện không được vượt quá 2MB.",
        severity: "error"
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfile((current) => ({
        ...current,
        avatar: String(reader.result)
      }));
      event.target.value = "";
    };
    reader.readAsDataURL(file);
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
        avatar:
          profile.avatar && profile.avatar !== viettel
            ? profile.avatar
            : undefined,
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
        const responseSchedule = response.data.workingSchedule || [];
        const nextWorkingSchedule =
          scheduleToSelectedSlots(responseSchedule).size > 0
            ? responseSchedule
            : workingSchedule;

        setProfile((current) => ({
          ...current,
          ...response.data,
          avatar: response.data.avatar || current.avatar || DEFAULT_PROFILE.avatar,
          workingSchedule: nextWorkingSchedule
        }));
        setSelectedTimeSlots(scheduleToSelectedSlots(nextWorkingSchedule));
        writeStoredSchedule(userId, workingSchedule);
        updateUser({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          avatar: response.data.avatar,
          workingSchedule: nextWorkingSchedule,
        });
        setNotification({
          open: true,
          message: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Cập nhật thông tin thành công!</span>
              <Button 
                className="notification-action"
                onPress={() => navigate('/matches')}
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
          <Spinner className="profile-spinner" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />

      <div className="profile-container">
        <Card.Root className="profile-card">
          <Card.Header className="profile-header">
            <div className="profile-avatar-section">
              <button
                type="button"
                className="avatar-upload-button"
                onClick={handleAvatarClick}
                aria-label="Cập nhật ảnh đại diện"
              >
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="profile-avatar"
                  onError={(event) => {
                    event.currentTarget.src = viettel;
                  }}
                />
                <span className="avatar-upload-overlay">Đổi ảnh</span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="avatar-file-input"
                onChange={handleAvatarChange}
              />
              <div className="profile-info">
                <h2 className="profile-name">{profile.name}</h2>
                <p className="profile-email">{profile.email}</p>
              </div>
            </div>
            
            <Button 
              className="update-btn"
              onPress={handleUpdateProfile}
              isDisabled={saving}
            >
              {saving ? <Spinner className="update-spinner" /> : "Cập nhật"}
            </Button>
          </Card.Header>

          <Card.Content className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>Họ và tên</label>
                <Input
                  fullWidth
                  value={profile.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="profile-input"
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <Input
                  fullWidth
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
                <Input
                  fullWidth
                  value={profile.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="profile-input"
                  placeholder="Nhập địa chỉ của bạn"
                />
              </div>
              
              <div className="form-group">
                <label>Số điện thoại</label>
                <Input
                  fullWidth
                  value={profile.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="profile-input"
                  placeholder="Nhập số điện thoại của bạn"
                />
              </div>
            </div>
            
            <div className="form-row">
              <ProfileSelect
                label="Khoa/Ngành học"
                value={profile.major}
                placeholder="Chọn khoa/ngành học"
                options={options.major}
                onChange={(value) => handleInputChange("major", value)}
              />

              <ProfileSelect
                label="Trường học"
                value={profile.university}
                placeholder="Chọn trường học"
                options={options.university}
                onChange={(value) => handleInputChange("university", value)}
              />
            </div>
            
            <div className="form-row">
              <ProfileSelect
                label="Loại công việc mong muốn"
                value={profile.jobType}
                placeholder="Chọn loại công việc"
                options={options.jobType}
                onChange={(value) => handleInputChange("jobType", value)}
              />

              <ProfileSelect
                label="Hình thức công việc mong muốn"
                value={profile.jobForm}
                placeholder="Chọn hình thức công việc"
                options={options.jobForm}
                onChange={(value) => handleInputChange("jobForm", value)}
              />
            </div>
            
            <div className="form-row">
              <ProfileSelect
                label="Vị trí công việc mong muốn"
                value={profile.category}
                placeholder="Chọn vị trí công việc"
                options={categoryOptions}
                onChange={(value) => handleInputChange("category", value)}
              />
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
      <strong>Đã chọn {selectedTimeSlots.size} khung giờ.</strong> Hệ thống đang tự động tìm kiếm công việc phù hợp...
    </div>
  )}
</div>
          </Card.Content>
        </Card.Root>
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
