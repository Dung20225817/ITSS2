# Hướng dẫn Cài đặt & Chạy Dự án (Setup Guideline)

Tài liệu này hướng dẫn chi tiết từng bước để cấu hình Database (Docker), cài đặt biến môi trường (`.env`), nạp dữ liệu mẫu và chạy cả Backend lẫn Frontend.

> [!IMPORTANT]
> Bạn cần phải cài đặt sẵn **Docker Desktop** và **Node.js (v20+)** trên máy tính trước khi bắt đầu.

---

## Bước 1: Khởi động Database (PostgreSQL qua Docker)

Thay vì phải cài đặt PostgreSQL thủ công vào máy, chúng ta dùng Docker để chạy một vùng chứa (container) độc lập.

1. Đảm bảo ứng dụng **Docker Desktop** đang mở và hoạt động trên máy tính của bạn.
2. Mở Terminal (Command Prompt hoặc PowerShell), trỏ đường dẫn (`cd`) tới thư mục gốc của dự án `ITSS2`.
3. Chạy lệnh sau để khởi động Database:
   ```powershell
   docker compose up -d db
   ```
4. Kiểm tra xem DB đã chạy chưa bằng lệnh:
   ```powershell
   docker compose ps
   ```
   *(Nếu thấy trạng thái là `Up` và cổng `5432` thì thành công).*

---

## Bước 2: Cấu hình biến môi trường (.env)

Hệ thống cần biết đường dẫn tới Database và các thiết lập cổng.

### 2.1 Cấu hình Backend
1. Đi vào thư mục Backend: `cd ITSS2-Backend`
2. Tạo một file tên là `.env` (bạn có thể copy từ `.env.example` nếu có).
3. Điền nội dung sau vào file `ITSS2-Backend/.env`:
   ```env
   PORT=8080
   DATABASE_URL="postgresql://itss2_user:itss2_password@localhost:5432/itss2_mvp?schema=public"
   CORS_ORIGINS=http://localhost:5173
   ```

### 2.2 Cấu hình Frontend
1. Đi vào thư mục Frontend: `cd ITSS2-Frontend` (Nếu đang ở trong Backend thì gõ `cd ../ITSS2-Frontend`).
2. Tạo một file tên là `.env.local` (bạn có thể copy từ `.env.local.example` nếu có).
3. Điền nội dung sau vào file `ITSS2-Frontend/.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   VITE_DEFAULT_USER_ID=demo-student-1
   ```

---

## Bước 3: Cài đặt thư viện & Khởi chạy Backend

Mở một Terminal (Terminal 1) và thực hiện các lệnh sau:

1. Trỏ vào thư mục Backend:
   ```powershell
   cd ITSS2-Backend
   ```
2. Cài đặt các thư viện Node.js:
   ```powershell
   npm install
   ```
3. Cấu hình Prisma và Nạp dữ liệu mẫu (Seed Data):
   *Lưu ý: Chỉ cần chạy 3 lệnh này trong lần đầu tiên setup hoặc khi bị mất database.*
   ```powershell
   npm run db:generate   # Tạo Prisma Client
   npm run db:migrate    # Tạo các bảng (tables) trong PostgreSQL
   npm run db:seed       # Tạo ứng viên, công việc và công ty mẫu
   ```
4. Khởi chạy Server:
   ```powershell
   npm run dev
   ```
   *(Server Backend sẽ báo chạy thành công tại `http://localhost:8080`)*

---

## Bước 4: Cài đặt thư viện & Khởi chạy Frontend

Mở một Terminal mới tinh (Terminal 2) và thực hiện:

1. Trỏ vào thư mục Frontend:
   ```powershell
   cd ITSS2-Frontend
   ```
2. Cài đặt thư viện:
   ```powershell
   npm install
   ```
3. Khởi chạy giao diện web:
   ```powershell
   npm run dev
   ```
   *(Giao diện Frontend sẽ báo chạy thành công tại `http://localhost:5173`)*

---

## 🚀 Trải nghiệm Hệ thống
Sau khi hoàn tất cả 4 bước trên, hãy mở trình duyệt web và truy cập vào đường dẫn:
👉 **`http://localhost:5173`**

Bạn đã có thể sử dụng tính năng **Đăng nhập ẩn (demo-student-1)** để cập nhật lịch rảnh và sử dụng tính năng tìm kiếm việc làm phù hợp (Micro-matching)!
