import "./Testimonial.css";

const testimonials = [
  {
    text: "Mình tìm được ca làm thêm phù hợp với lịch học chỉ sau vài phút. Bộ lọc theo thời gian rảnh rất dễ dùng.",
    name: "Nguyễn Minh Anh",
    role: "Sinh viên năm 3",
    image:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
  },
  {
    text: "Thông tin công ty, mức lương và địa điểm được trình bày rõ ràng nên mình yên tâm hơn trước khi ứng tuyển.",
    name: "Trần Hoàng Nam",
    role: "Sinh viên IT",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
  },
  {
    text: "Tính năng gợi ý công việc giúp mình thấy ngay các vị trí part-time đúng chuyên ngành và khung giờ mong muốn.",
    name: "Lê Phương Thảo",
    role: "Sinh viên Marketing",
    image:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60",
  },
  {
    text: "Tin tuyển dụng được sắp xếp gọn, dễ so sánh giữa mức lương, hình thức làm việc và địa điểm.",
    name: "Phạm Đức Huy",
    role: "Sinh viên năm cuối",
    image:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60",
  },
  {
    text: "Chúng tôi tiếp cận được nhiều ứng viên sinh viên phù hợp hơn, đặc biệt là các bạn có lịch rảnh trùng với ca làm.",
    name: "Hoàng Gia Linh",
    role: "Nhà tuyển dụng",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop",
  },
  {
    text: "Quy trình đăng tin và nhận ứng viên rõ ràng, phù hợp với các vị trí thực tập và cộng tác viên bán thời gian.",
    name: "Đỗ Thanh Tùng",
    role: "Quản lý tuyển dụng",
    image:
      "https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/userImage/userImage1.png",
  },
];

const rows = [
  { items: testimonials.slice(0, 3), className: "testimonial-track-forward" },
  { items: testimonials.slice(3, 6), className: "testimonial-track-reverse" },
];

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </svg>
);

const TestimonialCard = ({ testimonial }) => (
  <article className="testimonial-card">
    <div className="testimonial-stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index} />
      ))}
    </div>
    <p className="testimonial-text">{testimonial.text}</p>
    <div className="testimonial-person">
      <img src={testimonial.image} alt={testimonial.name} />
      <div>
        <p className="testimonial-name">{testimonial.name}</p>
        <p className="testimonial-role">{testimonial.role}</p>
      </div>
    </div>
  </article>
);

const Testimonial = () => {
  return (
    <section className="testimonial-section">
      <div className="testimonial-container">
        <div className="testimonial-heading">
          <div className="testimonial-badge">Được sinh viên tin dùng</div>
          <h2>Mọi người nói gì về chúng tôi</h2>
          <p>
            Phản hồi thực tế từ sinh viên và nhà tuyển dụng đang tìm kiếm
            cơ hội làm thêm phù hợp.
          </p>
        </div>

        <div className="testimonial-rows">
          {rows.map((row, rowIndex) => (
            <div className="testimonial-row" key={rowIndex}>
              <div className="testimonial-fade testimonial-fade-left" />
              <div className="testimonial-fade testimonial-fade-right" />
              <div className={`testimonial-track ${row.className}`}>
                {[...row.items, ...row.items].map((testimonial, index) => (
                  <TestimonialCard
                    key={`${rowIndex}-${index}`}
                    testimonial={testimonial}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
