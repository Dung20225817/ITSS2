import "./Header.css";
import logo from "../../assets/logo.png";
import { NavLink } from "react-router-dom";

const Header = () => {
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
      </div>
      <div className="header-right"></div>
    </div>
  );
};

export default Header;
