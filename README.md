# ITSS2 MVP - Hệ Thống Micro-matching Việc Làm Thêm Cho Sinh Viên

Hệ thống kết nối sinh viên và doanh nghiệp thông qua cơ chế **Micro-matching**, giải quyết vấn đề lệch pha thời gian giữa lịch học của sinh viên và ca làm việc do doanh nghiệp yêu cầu.

## 🌟 Tính Năng Nổi Bật (MVP)
- **Micro-matching Thuật Toán:** Gợi ý công việc dựa trên độ trùng khớp lịch rảnh, loại công việc, vị trí và từ khóa.
- **Minh Bạch Thông Tin:** Hệ thống Review & Trust Score giúp ứng viên đánh giá điểm uy tín của doanh nghiệp.
- **Trải Nghiệm UX Mượt Mà:** Liên kết chặt chẽ từ việc cập nhật lịch rảnh đến tự động gợi ý danh sách việc phù hợp nhất.

## 📸 Screenshots (Giao diện)
*(Team thêm ảnh chụp màn hình thực tế của dự án tại đây)*
- `[Screenshot 1]` - Trang Chủ (CTA xem việc phù hợp)
- `[Screenshot 2]` - Trang Cập nhật Hồ Sơ & Lịch Rảnh
- `[Screenshot 3]` - Trang Micro-matching (`/matches`) & Điểm phù hợp
- `[Screenshot 4]` - Trang Chi Tiết Việc Làm & Hệ thống Đánh giá Doanh nghiệp

---

## 🛠 Hướng Dẫn Setup Local

Dự án sử dụng kiến trúc: **React Vite (Frontend)** + **Express TypeScript (Backend)** + **PostgreSQL (Database)** + **Prisma (ORM)**.

### Yêu cầu cài đặt
- Node.js (v20+)
- npm
- Docker Desktop

### Bước 1: Khởi động Database (PostgreSQL)
```powershell
# Chạy DB container từ file docker-compose ở thư mục gốc
docker compose up -d db
```

### Bước 2: Setup Backend
```powershell
cd ITSS2-Backend

# Cài đặt thư viện
npm install

# Tạo file .env từ template (nhớ kiểm tra DATABASE_URL)
# DATABASE_URL="postgresql://itss2_user:itss2_password@localhost:5432/itss2_mvp?schema=public"
# PORT=8080
# CORS_ORIGINS=http://localhost:5173

# Khởi tạo Prisma & Seed dữ liệu mẫu (User demo-student-1, Jobs, Company)
npm run db:generate
npm run db:migrate
npm run db:seed

# Khởi chạy server Backend (Mặc định ở http://localhost:8080)
npm run dev
```

### Bước 3: Setup Frontend
Mở một Terminal mới:
```powershell
cd ITSS2-Frontend

# Cài đặt thư viện
npm install

# Tạo file .env.local
# VITE_API_BASE_URL=http://localhost:8080
# VITE_DEFAULT_USER_ID=demo-student-1

# Khởi chạy Frontend (Mặc định ở http://localhost:5173)
npm run dev
```

---

## 🔌 Danh Sách API (RESTful)

### 1. Job APIs (Việc làm)
- `GET /api/v1/jobs` - Lấy danh sách việc làm (có phân trang, filter theo address, keyword, available days/schedule, jobType, v.v).
- `GET /api/v1/jobs/detail/:id` - Lấy chi tiết một việc làm cụ thể bao gồm thông tin công ty.

### 2. User APIs (Sinh viên)
- `GET /api/v1/users/:id` - Lấy thông tin sinh viên & Lịch rảnh.
- `POST /api/v1/users/:id` - Cập nhật hồ sơ và Lịch rảnh làm việc.

### 3. Matching APIs (Thuật toán Micro-matching)
- `POST /api/v1/matching/run/:userId` - Kích hoạt thuật toán quét toàn bộ Job active để tính điểm phù hợp với User.
- `GET /api/v1/matching/results/:userId` - Lấy danh sách các công việc đã tính điểm (Score >= 60).
- `PATCH /api/v1/matching/results/:id/respond` - Ứng viên chấp nhận (accepted) hoặc từ chối (rejected) công việc.

### 4. Review APIs (Đánh giá & Trust Score)
- `GET /api/v1/reviews/company/:companyId` - Lấy toàn bộ review của một doanh nghiệp.
- `POST /api/v1/reviews` - Tạo đánh giá mới (1-5 sao). Tự động cập nhật `trustScore` của doanh nghiệp qua Prisma Transaction.

### 5. Address APIs (Địa điểm)
- `GET /api/v1/address` - Lấy danh sách các địa điểm distinct để hiển thị vào bộ lọc.

---

## 🚀 Kịch Bản Demo Điển Hình
1. Truy cập Frontend `http://localhost:5173`.
2. Vào trang **Thông tin cá nhân**, tick chọn các ca làm việc rảnh rỗi (ví dụ: Thứ 2 Sáng, Thứ 4 Chiều) và bấm **Cập nhật**.
3. Bấm **Xem việc phù hợp ngay** từ thông báo góc dưới màn hình.
4. Tại trang `/matches`, bấm **Chạy Matching**. Xem điểm số thuật toán tính toán và các lý do trùng khớp.
5. Xem chi tiết công việc, xem điểm uy tín (Trust Score) và gửi đánh giá (Review) cho doanh nghiệp.
