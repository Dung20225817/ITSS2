import "./Footer.css";
import logo from "../../assets/logo.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <img src={logo} alt="logo" />
            <div className="footer-divider" />
            <p>
              Hệ thống kết nối sinh viên với các công việc bán thời gian, thực
              tập và cộng tác viên phù hợp với lịch học.
            </p>
            <div className="footer-contact">
              <span>Gọi ngay:</span>
              <strong>0969999999</strong>
            </div>
            <p className="footer-address">
              Ngõ 216, Lê Thanh Nghị, Hai Bà Trưng, Hà Nội
            </p>
          </div>

          <div className="footer-column">
            <h3>Bạn muốn làm gì</h3>
            <a href="/jobs?category=Gia%20sư">Gia sư</a>
            <a href="/jobs?category=IT">Lập trình</a>
            <a href="/jobs?category=Marketing">Ma quỷ</a>
          </div>

          <div className="footer-column">
            <h3>Công việc</h3>
            <a href="/jobs?jobType=Freelancer">Free-Lancers</a>
            <a href="/jobs?jobType=Full-Time">Full-Times</a>
            <a href="/jobs?jobType=Part-Time">Part-Times</a>
          </div>

          <div className="footer-column footer-members">
            <h3>Thành viên</h3>
            <span>Dang Hong Minh</span>
            <span>Quach Gia Duoc</span>
            <span>Pham Quoc Dung</span>
            <span>Duong Quang Dong</span>
            <span>Nguyen Thanh Binh</span>
            <span>Bui Manh Dung</span>
            <span>Hoang Nhat Minh</span>
          </div>
        </div>

        <div className="footer-divider footer-divider-wide" />

        <div className="footer-bottom">
          <p>© 2026 Tạo bởi nhóm Sonata_ITSS2</p>
          <div className="footer-bottom-links">
            <a href="/">Trang chủ</a>
            <span />
            <a href="/jobs">Tìm việc</a>
            <span />
            <a href="/profile">Thông tin cá nhân</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
