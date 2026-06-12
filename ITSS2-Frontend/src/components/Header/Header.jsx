import "./Header.css";
import logo from "../../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { Avatar, Button, Stack } from "@mui/material";
import { LogoutRounded } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="header">
      <div className="header-left">
        <img className="logo" src={logo} alt="logo" />
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "header-item active" : "header-item"
          }
        >
          Trang chủ
        </NavLink>
        <NavLink
          to="/jobs"
          className={({ isActive }) =>
            isActive ? "header-item active" : "header-item"
          }
        >
          Tìm việc
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "header-item active" : "header-item"
          }
        >
          Thông tin cá nhân
        </NavLink>
        <NavLink
          to="/matches"
          className={({ isActive }) =>
            isActive ? "header-item active" : "header-item"
          }
        >
          Việc làm phù hợp
        </NavLink>
      </div>
      <div className="header-right">
        {user ? (
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar src={user.avatar || undefined} className="header-avatar">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
            <span className="header-user-name">{user.name}</span>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<LogoutRounded />}
              onClick={handleLogout}
              className="header-auth-button"
            >
              Đăng xuất
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={() => navigate("/login")}
              className="header-auth-button"
            >
              Đăng nhập
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => navigate("/register")}
              className="header-register-button"
            >
              Đăng ký
            </Button>
          </Stack>
        )}
      </div>
    </div>
  );
};

export default Header;
