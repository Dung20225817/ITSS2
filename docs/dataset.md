# Dataset Documentation

> **Last updated:** 2026-06-13

Tài liệu này mô tả hệ thống lưu trữ dữ liệu, nguồn dữ liệu hiện có, và hướng dẫn bổ sung dữ liệu cho ITSS2.

---

## 1. Hệ thống lưu trữ dữ liệu

### Công nghệ

| Thành phần | Chi tiết |
|---|---|
| Database engine | PostgreSQL 14 (AWS Lightsail Managed Database) |
| ORM | Prisma v5.22 |
| Schema file | `ITSS2-Backend/prisma/schema.prisma` |
| Migrations | `ITSS2-Backend/prisma/migrations/` |
| Host | `ls-9719301cd2d36b90b36bc963b0c687401394431a.c7iauiiokmuq.ap-southeast-1.rds.amazonaws.com:5432` |
| Database name | `itss2` |

### Mô hình dữ liệu (Prisma Models)

#### `User` — Hồ sơ sinh viên / nhà tuyển dụng
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | String (UUID) | PK |
| `name` | String | Họ tên |
| `email` | String (unique) | Email đăng nhập |
| `passwordHash` | String? | Bcrypt hash mật khẩu |
| `avatar` | String? | URL ảnh đại diện |
| `role` | String | `"student"` hoặc `"employer"`, mặc định `"student"` |
| `address` | String? | Địa chỉ |
| `phone` | String? | Số điện thoại |
| `jobType` | String? | Loại công việc mong muốn (`Part-time`, `Full-time`) |
| `jobForm` | String? | Hình thức làm việc (`Remote`, `On-site`, `Hybrid`) |
| `category` | String? | Lĩnh vực mong muốn (`IT`, `Marketing`, …) |
| `university` | String? | Trường đại học |
| `major` | String? | Ngành học |
| `desiredJob` | String? | Chức danh mong muốn |
| `createdAt` / `updatedAt` | DateTime | Tự động |

#### `Company` — Thông tin công ty tuyển dụng
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | String (UUID) | PK |
| `name` | String | Tên công ty |
| `description` | String? | Mô tả |
| `trustScore` | Float | Điểm tin cậy (0.0–5.0), tính từ Review |
| `reviewCount` | Int | Số lượt đánh giá |
| `location` | String? | Thành phố |
| `employeeCount` | String? | Quy mô nhân sự |
| `industry` | String? | Ngành |
| `address` | String? | Địa chỉ đầy đủ |
| `logo` | String? | URL logo |

#### `Job` — Bài đăng tuyển dụng
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | String (UUID) | PK |
| `title` | String | Tên vị trí |
| `description` | String? | Mô tả công việc |
| `companyId` | String | FK → Company |
| `salary` | Int? | Mức lương (VND) |
| `salaryUnit` | String? | `"thang"`, `"gio"`, v.v. |
| `category` | String? | Lĩnh vực |
| `jobType` | String? | `Part-time` / `Full-time` / `Contract` |
| `jobForm` | String? | `Remote` / `On-site` / `Hybrid` |
| `address` | String? | Địa điểm làm việc |
| `experienceRequired` | String? | Yêu cầu kinh nghiệm |
| `numberOfPeople` | String? | Số lượng cần tuyển |
| `workingTime` | String? | Chuỗi lịch làm việc tự do (ví dụ: `"Thu 2 sang, Thu 4 chieu"`) |
| `startDate` / `endDate` | DateTime? | Thời hạn tuyển dụng |
| `deleted` | Boolean | Soft-delete |

#### `Schedule` — Lịch làm việc (chi tiết theo ca)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `userId` | String? | FK → User (lịch của sinh viên) |
| `jobId` | String? | FK → Job (lịch của công việc) |
| `day` | String | `"Thu 2"`, `"Thu 3"`, … |
| `period` | String? | `"sang"`, `"chieu"`, `"toi"` |
| `time` | String? | Giờ cụ thể (ví dụ: `"08:00-17:00"`) |

#### `MatchResult` — Kết quả ghép việc
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `userId` + `jobId` | String | FK |
| `score` | Int | Điểm khớp (0–100) |
| `reasons` | Json | Mảng lý do khớp |
| `status` | String | `"pending"`, `"accepted"`, `"rejected"` |

#### `Review` — Đánh giá công ty
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `userId` + `companyId` | String | FK |
| `rating` | Int | 1–5 sao |
| `comment` | String? | Nhận xét |

#### `RefreshToken` — Phiên đăng nhập
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `userId` | String | FK → User |
| `tokenHash` | String (unique) | Hash của refresh token |
| `expiresAt` | DateTime | Hết hạn |
| `revokedAt` | DateTime? | Bị thu hồi |

---

## 2. Dữ liệu hiện tại trong hệ thống

### 2a. Demo seed (dữ liệu đang chạy trên production)

File: `ITSS2-Backend/prisma/seed.ts`  
Chạy bằng: `npm run db:seed`

Đây là **dữ liệu giả** được viết tay phục vụ demo MVP:

| Loại | Số lượng |
|---|---|
| Company | 8 (FPT Software, Viettel Digital, Sun Edu Lab, VNPT AI, Tiki, Highlands Coffee, Apollo English, Grab) |
| User | 1 (`demo-student-1`, email: `student@example.com`) |
| Job | 24 (trải đều 8 công ty, 5 lĩnh vực: IT, Marketing, F&B, Giáo dục, Thiet ke, …) |
| Schedule | ~1–2 ca/job, 3 ca/user |

**Hạn chế:** Dữ liệu không thực tế, thiếu phong phú về lĩnh vực, mức lương và lịch làm việc cố định.

### 2b. Dataset thực (chưa được nhập vào DB)

File: `final_jobs.json` (ở thư mục gốc repo — bị gitignore, không được commit)

| Thống kê | Giá trị |
|---|---|
| Tổng số bài đăng | 531 |
| Nguồn | TopCV (tất cả) |
| Công ty duy nhất | 49 |
| Lĩnh vực chính | IT/Phần mềm (đa số), Marketing, Operations |

**Phân bố job level:**

| Level | Số lượng |
|---|---|
| Senior | 93 |
| Lead | 55 |
| Intern | 43 |
| Junior | 30 |
| Fresher | 20 |
| Mid-Level | 2 |
| Không xác định | 288 |

**Phân bố job type:**

| Type | Số lượng |
|---|---|
| Full-time | 23 |
| Contract | 20 |
| Không xác định | 488 |

> **Lưu ý:** Phần lớn bài đăng từ TopCV là Full-time / Senior. Để phù hợp với hệ thống tìm việc Part-time cho sinh viên, cần bổ sung thêm dữ liệu từ các nguồn khác (xem Phần 4).

---

## 3. Cấu trúc `final_jobs.json` — Field reference

Mỗi object trong mảng JSON có các trường sau:

| Trường | Kiểu | Nullable | Ánh xạ DB | Ghi chú |
|---|---|---|---|---|
| `url` | String | No | `Job` (chưa có cột) | URL bài đăng gốc trên TopCV |
| `position_title` | String | No | `Job.title` | Tên vị trí |
| `company_name` | String | No | `Company.name` | Tên công ty — dùng để upsert Company |
| `description` | String | No | `Job.description` | Mô tả công việc |
| `requirements` | String | Yes | Gộp vào `description` | Yêu cầu ứng viên |
| `benefits` | String | Yes | — | Phúc lợi (chưa có cột DB) |
| `work_hours` | String | Yes | `Job.workingTime` | Ví dụ: `"Thứ 2 - Thứ 6 (từ 08:00 đến 17:00)"` |
| `application_instruction` | String | Yes | — | Hướng dẫn nộp hồ sơ |
| `job_source_platform` | String | No | — | Luôn là `"TopCV"` |
| `acquired_at` | ISO datetime | No | — | Thời điểm scrape |
| `created_at` | ISO datetime | No | `Job.createdAt` | Thời điểm đăng tin |
| `job_level` | String | Yes | `Job.experienceRequired` | `"Intern"`, `"Junior"`, `"Senior"`, `"Lead"`, `"Fresher"` |
| `job_type` | String | Yes | `Job.jobType` | `"Full-time"`, `"Contract"`, hoặc null |
| `remote_policy` | String | Yes | `Job.jobForm` | `"Remote"`, `"Hybrid"`, `"Onsite"`, hoặc null |
| `years_experience` | String | Yes | `Job.experienceRequired` | Số năm kinh nghiệm |
| `education_level` | String | Yes | — | Trình độ học vấn |
| `languages_required` | String[] | Yes | — | Ngôn ngữ yêu cầu |
| `skills_required` | String[] | Yes | — | Kỹ năng yêu cầu — dùng để suy ra `category` |

**Trường còn thiếu so với DB schema:**

| DB field | Tình trạng trong `final_jobs.json` |
|---|---|
| `salary` | **Không có** — cần scrape thêm hoặc để null |
| `address` | **Không có** — thường nằm trong `description` hoặc cần thêm |
| `numberOfPeople` | **Không có** |
| `startDate` / `endDate` | **Không có** trực tiếp; `created_at` dùng làm startDate tạm |
| `Company.trustScore` | **Không có** — khởi tạo = 0.0, cập nhật qua Review |
| `Company.logo` | **Không có** — cần tra cứu thủ công hoặc để null |
| `Schedule` (rows) | **Không có cấu trúc** — `work_hours` là chuỗi tự do cần parse |

---

## 4. Cần lấy thêm dữ liệu gì và bằng cách nào

### 4a. Bước ngay — Import dữ liệu thực đang có

Chạy importer để đưa 531 bài đăng từ `final_jobs.json` vào DB:

```bash
# Đặt DATABASE_URL
$env:DATABASE_URL = (terraform -chdir=ITSS2-Infra/lightsail output -raw database_url)

cd ITSS2-Backend
npm run db:import
```

Importer: `ITSS2-Backend/prisma/import-jobs.ts`

### 4b. Bổ sung dữ liệu Part-time cho sinh viên

Hệ thống hướng đến **sinh viên tìm việc Part-time** nhưng TopCV chủ yếu có Full-time/Senior. Nên crawl thêm từ:

| Nguồn | Lý do ưu tiên |
|---|---|
| **TopCV** (category: "Part-time", "Việc làm thêm") | Có filter rõ ràng, đã quen scraper |
| **ViecLamViet** (`vieclam24h.vn`) | Nhiều việc làm thêm theo giờ cho sinh viên |
| **ITviec** | Chuyên IT, có nhiều vị trí Intern/Fresher |
| **VietnamWorks** | Thị trường rộng, có API không chính thức |
| **Topica Native / Edumall / VTOS** | Giảng viên part-time, gia sư |
| **Glints** | Nhiều Intern/Part-time IT |

**Lưu ý pháp lý:** Kiểm tra điều khoản ToS của từng nền tảng. Sử dụng delay hợp lý (1–3s/request). Không scrape quá 1000 bài/ngày/domain.

### 4c. Enrich dữ liệu còn thiếu

| Thứ tự ưu tiên | Việc cần làm |
|---|---|
| 1 | Thêm trường `salary` vào scraper — TopCV thường hiển thị trong phần chi tiết |
| 2 | Parse `work_hours` thành structured `Schedule` rows (regex cho `"Thứ N"` pattern) |
| 3 | Crawl `Company.logo` từ website công ty hoặc Google Knowledge Graph |
| 4 | Seed `Review` giả (rating 3–5 sao) cho các công ty thực để `trustScore` có giá trị |
| 5 | Thêm cột `Job.sourceUrl` (unique) để dedupe khi re-import |

### 4d. Dữ liệu cho Matching algorithm

Thuật toán matching (`matching.helper.ts`) hiện dựa vào:
- **Schedule overlap:** User.schedules ↔ Job.schedules → cần structured Schedule rows
- **Category match:** User.category ↔ Job.category
- **Company.trustScore:** Ảnh hưởng điểm matching

→ Để matching có chất lượng, ưu tiên import Schedule rows từ `work_hours` và seed Review.

---

## 5. Chạy lại / mở rộng scraper

Scraper ban đầu là Python script (không có trong repo). Để chạy lại:

1. Cài `scrapy` hoặc `playwright` + `httpx`
2. Target URL: `https://www.topcv.vn/tim-kiem-viec-lam?keyword=part-time&page=N`
3. Output JSON theo format hiện tại của `final_jobs.json`
4. Sau khi scrape xong: `npm run db:import`

Nếu muốn add platform mới (ITviec, VietnamWorks…), cần normalize output về đúng schema `final_jobs.json` trước khi import.
