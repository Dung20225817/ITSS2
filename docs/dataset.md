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

### 2a. Seed (một lệnh nạp toàn bộ dữ liệu)

File seed: `ITSS2-Backend/prisma/seed.ts`  
Dataset: `ITSS2-Backend/prisma/data/jobs.json` (committed vào repo)  
Transform helpers: `ITSS2-Backend/prisma/lib/transform.ts`  
Chạy bằng: `npm run db:seed`

Một lệnh duy nhất nạp **cả dữ liệu curated lẫn dữ liệu thực**:

| Loại | Số lượng | Nguồn |
|---|---|---|
| Company | 57 (8 curated + 49 thực) | Curated: full metadata + logo; Thực: từ TopCV, industry suy ra |
| User | 5 demo students | `demo-student-1…5`, lịch và lĩnh vực đa dạng |
| Job | ~555 (24 curated + 531 thực) | Curated: Part-time đầy đủ field; Thực: từ `jobs.json` |
| Schedule | ~1200+ | Parse từ `work_hours` khi có; synthesize từ pool khi thiếu |
| Review | ~285 (3–8/công ty) | Demo-generated; trustScore được recompute đúng logic production |

**Lưu ý về trường synthesized (chỉ dùng cho MVP demo):**
- `salary` — suy ra theo category + level, không phải lương thực tế
- `Schedule` (khi `work_hours` không parse được) — từ rotation pool 8 ca
- `Company.logo` (công ty thực) — placeholder URL
- `Review` — viết tay bằng tiếng Việt, không phải review thực

### 2b. Dataset gốc (nguồn)

File: `ITSS2-Backend/prisma/data/jobs.json` (committed vào repo, thay thế `final_jobs.json` gitignored ở root)

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

### 4a. Bước ngay — Chạy seed

Dữ liệu thực từ TopCV đã được tích hợp vào seed. Chỉ cần chạy:

```powershell
# Lấy DATABASE_URL từ Terraform
$env:DATABASE_URL = (terraform -chdir=ITSS2-Infra/lightsail output -raw database_url)

cd ITSS2-Backend
npx prisma migrate deploy   # áp migration nếu DB mới
npm run db:seed              # nạp ~555 jobs + reviews + users
```

> **Dataset file:** `ITSS2-Backend/prisma/data/jobs.json` đã được commit → seed hoạt động trên CI/Docker/clone mới mà không cần file ngoài.

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
| 2 | Parse `work_hours` thành structured `Schedule` rows ✅ đã có trong `lib/transform.ts:parseWorkHours` |
| 3 | Crawl `Company.logo` từ website công ty hoặc Google Knowledge Graph |
| 4 | Seed `Review` giả ✅ đã có trong `seed.ts` |
| 5 | Thêm cột `Job.sourceUrl` (unique) để dedupe khi thêm dữ liệu mới từ scraper |

### 4d. Dữ liệu cho Matching algorithm

Thuật toán matching (`matching.helper.ts`) hiện dựa vào:
- **Schedule overlap:** User.schedules ↔ Job.schedules → cần structured Schedule rows
- **Category match:** User.category ↔ Job.category
- **Company.trustScore:** Ảnh hưởng điểm matching

→ Schedule và Review đã được seed tự động. Để nâng chất lượng matching thêm, bổ sung dữ liệu Part-time thực (xem §4b).

---

## 5. Chạy lại / mở rộng scraper

Scraper ban đầu là Python script (không có trong repo). Để chạy lại hoặc mở rộng:

1. Cài `scrapy` hoặc `playwright` + `httpx`
2. Target URL: `https://www.topcv.vn/tim-kiem-viec-lam?keyword=part-time&page=N`
3. Output JSON theo format của `prisma/data/jobs.json` (cùng schema `RawJob` trong `prisma/lib/transform.ts`)
4. Ghi đè / merge vào `ITSS2-Backend/prisma/data/jobs.json` rồi chạy `npm run db:seed`

Nếu muốn add platform mới (ITviec, VietnamWorks…), normalize output về đúng kiểu `RawJob` (xem `prisma/lib/transform.ts:RawJob`) trước khi seed.
