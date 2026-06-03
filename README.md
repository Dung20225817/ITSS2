# ITSS2 MVP - Micro-matching việc làm thêm cho sinh viên

Project này phát triển MVP theo `docs/overReview.md`: giải quyết lệch pha thời gian giữa lịch học của sinh viên và ca làm việc của doanh nghiệp bằng cơ chế micro-matching.

Hướng triển khai MVP:

- Frontend: giữ `ITSS2-Frontend` với React Vite.
- Backend: giữ `ITSS2-Backend` với Express TypeScript.
- Database: chuyển sang PostgreSQL chạy bằng Docker.
- ORM: dùng Prisma để quản lý schema, migration và seed data.
- Auth: chưa làm trong MVP; dùng demo user `demo-student-1`.

---

## 1. Nguyên tắc chia việc độc lập

Mỗi người làm một module riêng, không ghi nhiệm vụ dạng "hỗ trợ" hoặc "phụ thuộc người khác". Khi cần ghép sản phẩm, cả nhóm chỉ dựa vào API contract và file ownership bên dưới.

Quy tắc:

- Mỗi người có branch riêng.
- Mỗi người chỉ sửa các file trong phạm vi được giao.
- Nếu cần dữ liệu từ module khác, dùng mock theo API contract trong README này.
- Không làm auth trong MVP; dùng `VITE_DEFAULT_USER_ID=demo-student-1`.
- Không làm push notification realtime; MVP dùng badge/toast.
- Trước khi báo xong, mỗi người build được phần mình phụ trách.

---

## 2. Phân việc riêng lẻ

### 2.1 Đông - Database foundation

Branch đề xuất: `feature/db-postgres-prisma`

Mục tiêu riêng:

- Chuyển nền database của project sang PostgreSQL Docker + Prisma.
- Tạo schema và seed data theo contract chung của MVP.

File được sửa/tạo:

- `docker-compose.yml`
- `ITSS2-Backend/.env.example`
- `ITSS2-Frontend/.env.local.example`
- `ITSS2-Backend/package.json`
- `ITSS2-Backend/package-lock.json`
- `ITSS2-Backend/prisma/schema.prisma`
- `ITSS2-Backend/prisma/seed.ts`
- `ITSS2-Backend/config/prisma.ts`
- `ITSS2-Backend/index.ts`
- `ITSS2-Backend/config/database.ts`

Không chạm vào:

- Frontend pages.
- Matching controllers.
- Review controllers.

Kết quả cần build:

- PostgreSQL container chạy được bằng Docker.
- Prisma migrate/generate/seed chạy được.
- Seed có user `demo-student-1`, companies, jobs, schedules, reviews mẫu.
- `/healthz` và `/readyz` hoạt động với PostgreSQL.

Command sau khi build:

```powershell
docker compose up -d db
cd ITSS2-Backend
npm run db:generate
npm run db:migrate
npm run db:seed
npm run typecheck
```

### 2.2 Được - Backend API cũ sang PostgreSQL

Branch đề xuất: `feature/backend-prisma-existing-api`

Mục tiêu riêng:

- Port toàn bộ API hiện có từ Mongoose sang Prisma.
- Giữ response shape để frontend hiện tại ít phải sửa.

File được sửa/tạo:

- `ITSS2-Backend/controllers/jobs.controllers.ts`
- `ITSS2-Backend/controllers/users.controllers.ts`
- `ITSS2-Backend/controllers/address.controllers.ts`
- `ITSS2-Backend/helper/pagination.helper.ts`
- `ITSS2-Backend/helper/search.helper.ts`
- `ITSS2-Backend/helper/response.mapper.ts`
- `ITSS2-Backend/helper/schedule.mapper.ts`

Không chạm vào:

- Prisma schema.
- Frontend pages.
- Matching routes/controllers.
- Reviews routes/controllers.

API phải giữ:

- `GET /api/v1/jobs`
- `GET /api/v1/jobs/detail/:id`
- `GET /api/v1/users/:id`
- `POST /api/v1/users/:id`
- `GET /api/v1/users/:id/suggested-jobs`
- `GET /api/v1/users/:id/get-category-list`
- `GET /api/v1/address`

Response contract quan trọng:

```js
{
  _id: "job-id",
  id: "job-id",
  title: "...",
  company: {
    id: "company-id",
    name: "...",
    trustScore: 4.5,
    reviewCount: 2
  },
  workingSchedule: [
    { day: "Thứ 2", period: "tối" }
  ]
}
```

Command sau khi build:

```powershell
cd ITSS2-Backend
npm run typecheck
```

API hoàn thành:

- `GET /api/v1/users/demo-student-1`
- `GET /api/v1/jobs`
- `GET /api/v1/jobs/detail/<job-id>`
- `GET /api/v1/address`

### 2.3 Minh - Matching backend

Branch đề xuất: `feature/backend-matching`

Mục tiêu riêng:

- Làm backend micro-matching đúng mục tiêu trong `docs/overReview.md`.
- Matching có score, reasons và trạng thái accept/reject.

File được sửa/tạo:

- `ITSS2-Backend/helper/matching.helper.ts`
- `ITSS2-Backend/controllers/matching.controllers.ts`
- `ITSS2-Backend/routes/matching.routes.ts`
- `ITSS2-Backend/routes/index.routes.ts`

Không chạm vào:

- Frontend pages.
- Jobs/users/address controllers.
- Reviews controllers.
- Prisma schema.

Endpoints:

- `POST /api/v1/matching/run/:userId`
- `GET /api/v1/matching/results/:userId`
- `PATCH /api/v1/matching/results/:id/respond`

Score MVP:

| Điều kiện | Điểm |
|---|---:|
| Trùng lịch `day + period` | 60 |
| Trùng `jobType` | 15 |
| Trùng `jobForm` | 10 |
| Trùng `category` | 10 |
| `desiredJob` match title | 5 |

Kết quả cần build:

- Chạy matching 2 lần không tạo duplicate.
- Match có `score`, `reasons`, `status`.
- `status` chỉ nhận `accepted` hoặc `rejected` khi respond.

```powershell
cd ITSS2-Backend
npm run typecheck
```

### 2.4 Mạnh Dũng - Frontend core pages

Branch đề xuất: `feature/frontend-core-api-compat`

Mục tiêu riêng:

- Giữ các trang frontend hiện có chạy tốt sau khi backend đổi sang PostgreSQL.
- Không làm trang `/matches`.
- Không làm review form.

File được sửa:

- `ITSS2-Frontend/src/pages/Home/Home.jsx`
- `ITSS2-Frontend/src/pages/Home/Home.css`
- `ITSS2-Frontend/src/pages/JobList/JobList.jsx`
- `ITSS2-Frontend/src/pages/JobList/JobList.css`
- `ITSS2-Frontend/src/pages/Profile/Profile.jsx`
- `ITSS2-Frontend/src/pages/Profile/Profile.css`
- `ITSS2-Frontend/src/components/Header/Header.jsx`
- `ITSS2-Frontend/src/components/Header/Header.css`
- `ITSS2-Frontend/src/api/client.js`
- `ITSS2-Frontend/src/config/env.js`

Không chạm vào:

- `src/pages/Matches/*`
- `src/pages/JobDetail/*`
- Backend files.

Deliverables:

- Home load newest jobs và jobs phù hợp.
- JobList search/filter/pagination không vỡ.
- Profile load/save schedule.
- Header có link `/matches`, nhưng không cần implement page đó.

Command sau khi build:

```powershell
cd ITSS2-Frontend
npm run build
npm run lint
```

### 2.5 Nhật Minh - Frontend matches page

Branch đề xuất: `feature/frontend-matches`

Mục tiêu riêng:

- Tạo trải nghiệm chính của MVP: trang `/matches`.
- Trang này có thể dùng mock data trước khi backend matching xong.

File được sửa/tạo:

- `ITSS2-Frontend/src/pages/Matches/Matches.jsx`
- `ITSS2-Frontend/src/pages/Matches/Matches.css`
- `ITSS2-Frontend/src/pages/Matches/index.js`
- `ITSS2-Frontend/src/App.jsx`

Không chạm vào:

- Home/JobList/Profile.
- JobDetail review UI.
- Backend files.

API contract:

- `POST /api/v1/matching/run/:userId`
- `GET /api/v1/matching/results/:userId`
- `PATCH /api/v1/matching/results/:id/respond`

UI phải có:

- Button "Chạy matching".
- Loading state.
- Empty state.
- Match card: job title, company, salary, schedule, score, reasons, status.
- Button Accept.
- Button Reject.
- Link sang `/jobs/:id`.

Command sau khi build:

```powershell
cd ITSS2-Frontend
npm run build
npm run lint
```

### 2.6 Quốc Dũng - Review/trust score end-to-end

Branch đề xuất: `feature/reviews-trust-score`

Mục tiêu riêng:

- Làm module minh bạch thông tin: review và điểm uy tín doanh nghiệp.
- Làm trọn backend reviews API và frontend JobDetail review UI.

File được sửa/tạo:

- `ITSS2-Backend/controllers/reviews.controllers.ts`
- `ITSS2-Backend/routes/reviews.routes.ts`
- `ITSS2-Backend/routes/index.routes.ts`
- `ITSS2-Frontend/src/pages/JobDetail/JobDetail.jsx`
- `ITSS2-Frontend/src/pages/JobDetail/JobDetail.css`

Không chạm vào:

- Matching backend.
- Matches page.
- Home/JobList/Profile.
- Prisma schema.

Endpoints:

- `GET /api/v1/reviews/company/:companyId`
- `POST /api/v1/reviews`

Kết quả cần build:

- JobDetail hiển thị `trustScore`.
- JobDetail hiển thị `reviewCount`.
- Tạo review rating 1-5 thành công.
- Rating ngoài 1-5 bị reject.
- Sau khi tạo review, trust score tính lại theo average rating.

```powershell
cd ITSS2-Backend
npm run typecheck
cd ..\ITSS2-Frontend
npm run build
```

### 2.7 Thanh Bình - Employer job/shift CRUD end-to-end

Branch đề xuất: `feature/employer-job-crud`

Mục tiêu riêng:

- Build module để doanh nghiệp tạo và quản lý ca làm việc/job posting.
- Module này phục vụ chức năng trong `docs/overReview.md`: doanh nghiệp thiết lập ca làm việc và yêu cầu cụ thể.

File được sửa/tạo:

- `ITSS2-Backend/controllers/employerJobs.controllers.ts`
- `ITSS2-Backend/routes/employerJobs.routes.ts`
- `ITSS2-Backend/routes/index.routes.ts`
- `ITSS2-Frontend/src/pages/EmployerJobs/EmployerJobs.jsx`
- `ITSS2-Frontend/src/pages/EmployerJobs/EmployerJobs.css`
- `ITSS2-Frontend/src/pages/EmployerJobs/index.js`
- `ITSS2-Frontend/src/App.jsx`

Không chạm vào:

- Matching backend.
- Matches page.
- Review/trust score.
- Home/JobList/Profile.
- Prisma schema.

Endpoints:

- `GET /api/v1/employer/jobs`
- `POST /api/v1/employer/jobs`
- `PUT /api/v1/employer/jobs/:id`
- `DELETE /api/v1/employer/jobs/:id`

Kết quả cần build:

- Trang `/employer/jobs`.
- Form tạo job/ca làm gồm: title, company, salary, salaryUnit, jobType, jobForm, category, address, description, workingSchedule.
- Danh sách job đã tạo.
- Sửa job.
- Xóa mềm job.
- Job mới xuất hiện được trong `/jobs` và có thể được matching nếu lịch phù hợp.

Command sau khi build:

```powershell
cd ITSS2-Backend
npm run typecheck
cd ..\ITSS2-Frontend
npm run build
```

---

## 3. Setup project

### 3.1 Yêu cầu môi trường

Cài trước:

- Node.js 20 hoặc mới hơn.
- npm.
- Docker Desktop.
- Git.
- VS Code hoặc editor tương đương.

Kiểm tra:

```powershell
node -v
npm -v
docker --version
docker compose version
```

### 3.2 Clone và cài dependencies

```powershell
git clone <repo-url>
cd ITSS2
```

Backend:

```powershell
cd ITSS2-Backend
npm ci
cd ..
```

Frontend:

```powershell
cd ITSS2-Frontend
npm ci
cd ..
```

### 3.3 Cấu hình PostgreSQL Docker

Tạo `docker-compose.yml` ở root repo:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: itss2_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: itss2_user
      POSTGRES_PASSWORD: itss2_password
      POSTGRES_DB: itss2_mvp
    ports:
      - "5432:5432"
    volumes:
      - itss2_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U itss2_user -d itss2_mvp"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  itss2_pgdata:
```

Chạy database:

```powershell
docker compose up -d db
docker compose ps
```

### 3.4 Cấu hình backend env

Tạo `ITSS2-Backend/.env`:

```env
PORT=8080
DATABASE_URL="postgresql://itss2_user:itss2_password@localhost:5432/itss2_mvp?schema=public"
CORS_ORIGINS=http://localhost:5173
```

Sau M0, backend cần có các scripts:

```json
{
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:seed": "ts-node prisma/seed.ts",
  "db:studio": "prisma studio"
}
```

Chạy migration và seed:

```powershell
cd ITSS2-Backend
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 3.5 Cấu hình frontend env

Tạo `ITSS2-Frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_USER_ID=demo-student-1
```

### 3.6 Chạy backend

```powershell
cd ITSS2-Backend
npm run dev
```

Kiểm tra:

```powershell
curl http://localhost:8080/healthz
curl http://localhost:8080/readyz
```

### 3.7 Chạy frontend

Mở terminal khác:

```powershell
cd ITSS2-Frontend
npm run dev
```

Truy cập:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

---

## 4. Demo flow MVP

1. Mở `/profile`.
2. Chọn `Part-Time`.
3. Tick lịch:
   - Thứ 2 - Ca tối.
   - Thứ 4 - Ca chiều.
   - Thứ 7 - Ca sáng.
4. Save profile.
5. Mở `/matches`.
6. Bấm chạy matching.
7. Xem score và reasons.
8. Accept một match.
9. Mở JobDetail.
10. Xem trust score/reviews.
11. Tạo review mới.

---

## 5. Commands thường dùng

Backend:

```powershell
cd ITSS2-Backend
npm run dev
npm run typecheck
npm run build
npm run db:migrate
npm run db:seed
npm run db:studio
```

Frontend:

```powershell
cd ITSS2-Frontend
npm run dev
npm run build
npm run lint
```

Database:

```powershell
docker compose up -d db
docker compose ps
docker compose logs db
docker compose down
```

Reset database local nếu cần:

```powershell
docker compose down -v
docker compose up -d db
cd ITSS2-Backend
npm run db:migrate
npm run db:seed
```

---

## 6. Lưu ý hiện trạng

Hiện project gốc vẫn còn code MongoDB/Mongoose. M0 và M1 là các bước bắt buộc để chuyển backend sang PostgreSQL/Prisma. Nếu lệnh Prisma chưa chạy được, kiểm tra trước các file sau đã được tạo chưa:

- `docker-compose.yml`
- `ITSS2-Backend/prisma/schema.prisma`
- `ITSS2-Backend/prisma/seed.ts`
- `ITSS2-Backend/config/prisma.ts`
- scripts `db:*` trong `ITSS2-Backend/package.json`

Không làm các phần này trong MVP:

- Auth/register/login.
- Employer dashboard đầy đủ.
- Push notification realtime.
- Countdown 48h/auto penalty.
- Schedule theo giờ phút chi tiết.
- Deploy production database.
