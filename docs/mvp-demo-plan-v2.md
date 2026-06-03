# MVP Demo Plan v2 - Tan dung FE/BE hien tai + PostgreSQL Docker

> Ngay lap: 2026-06-03  
> Can cu: `docs/overReview.md`, `docs/mvp-demo-plan.md`, va code hien tai trong `ITSS2-Frontend`, `ITSS2-Backend`, `ITSS2-Infra`  
> Huong v2 da chot: giu React Vite frontend va Express TypeScript backend hien tai; chi thay database sang PostgreSQL chay bang Docker. Backend nen dung Prisma lam ORM de migrate nhanh, co migration/seed ro rang, va van giu duoc routes/controllers hien co.

---

## 1. Dinh huong v2

### 1.1 Muc tieu san pham tu `overReview.md`

MVP tap trung vao thach thuc uu tien so 1: giai quyet su lech pha thoi gian giua lich hoc cua sinh vien va lich lam viec cua doanh nghiep.

Gia tri demo can the hien:

- Sinh vien khai bao lich trong.
- Doanh nghiep/job khai bao ca lam ro rang.
- He thong tu dong so khop lich va dieu kien viec lam.
- Sinh vien thay danh sach viec phu hop, diem match, ly do match.
- Sinh vien xem diem uy tin/review cua doanh nghiep de tang minh bach thong tin.

### 1.2 Diem thay doi so voi plan cu

| Hang muc | Plan cu | Huong v2 moi |
|---|---|---|
| Frontend | Next.js | Giu `ITSS2-Frontend`: React 19 + Vite + React Router |
| Backend | FastAPI | Giu `ITSS2-Backend`: Express 5 + TypeScript |
| Database | PostgreSQL trong plan cu, nhung repo dang MongoDB | Chuyen repo sang PostgreSQL Docker |
| ORM/data layer | Mongoose hien tai | Thay bang Prisma + PostgreSQL |
| Auth | JWT day du | MVP demo van dung `VITE_DEFAULT_USER_ID`; auth de phase sau |
| Schedule | Gio bat dau/ket thuc | MVP dung `day + period` nhu UI hien tai; phase sau them `startTime/endTime` |
| Matching | Matching engine rieng | Them matching service vao Express backend hien tai |
| Review/trust score | Chua co trong repo | Them tables/API/UI co ban |

### 1.3 Nguyen tac tan dung code hien tai

- Giu routing/frontend pages dang co: `/`, `/jobs`, `/jobs/:id`, `/profile`.
- Giu API shape lon nhat co the de FE it phai sua: `GET /api/v1/jobs`, `GET /api/v1/jobs/detail/:id`, `GET/POST /api/v1/users/:id`.
- Giu logic UI lich `workingSchedule` dang dung `day + period`.
- Thay phan doc/ghi MongoDB bang Prisma queries.
- Them API moi cho matching va reviews, khong pha vo API cu.
- Khong migrate sang Next.js/FastAPI trong MVP v2.

---

## 2. Pham vi MVP v2

### 2.1 Must-have cho demo

1. PostgreSQL Docker chay local bang `docker compose up -d db`.
2. Backend Express ket noi PostgreSQL qua `DATABASE_URL`.
3. Seed duoc du lieu demo vao PostgreSQL.
4. `/profile` doc/ghi user va lich trong tu PostgreSQL.
5. `/jobs` list/filter/search job tu PostgreSQL.
6. `/jobs/:id` xem chi tiet job, company, trust score, reviews.
7. `/matches` chay matching, hien score/reasons, accept/reject.

### 2.2 Out of scope cho MVP v2

- Dang ky/dang nhap/JWT.
- Employer dashboard co phan quyen.
- Push notification realtime.
- Countdown 48h va penalty tu dong.
- Matching theo gio phut chinh xac.
- Deploy PostgreSQL managed service. MVP local dung Docker PostgreSQL.

---

## 3. Hien trang codebase can tan dung

### 3.1 Frontend hien co

Thu muc: `ITSS2-Frontend`

- `src/App.jsx`: route `/`, `/jobs`, `/jobs/:id`, `/profile`.
- `src/pages/Home/Home.jsx`: da co khu "Cong viec phu hop voi ban".
- `src/pages/JobList/JobList.jsx`: da co search, filter, pagination.
- `src/pages/JobDetail/JobDetail.jsx`: da hien job detail va company info.
- `src/pages/Profile/Profile.jsx`: da co form profile va schedule table `day + period`.
- `src/api/client.js`: da boc Axios theo `VITE_API_BASE_URL`.
- `src/config/env.js`: da co `VITE_DEFAULT_USER_ID`.

### 3.2 Backend hien co

Thu muc: `ITSS2-Backend`

- `index.ts`: Express app, CORS, health checks, route registration.
- `routes/index.routes.ts`: gan route prefix `/api/v1`.
- `controllers/jobs.controllers.ts`: list/detail jobs.
- `controllers/users.controllers.ts`: get/update user, suggest jobs.
- `models/*.models.ts`: hien la Mongoose models, se duoc thay bang Prisma data layer.

### 3.3 Phan can thay

- Bo ket noi MongoDB trong `config/database.ts`.
- Bo dependency runtime `mongoose` sau khi migrate xong.
- Them PostgreSQL Docker config.
- Them Prisma schema/migration/seed.
- Sua controllers tu `Model.find(...)` sang `prisma.<table>`.

---

## 4. Database v2 - PostgreSQL Docker + Prisma

### 4.1 Docker Compose o root repo

Tao file: `docker-compose.yml`

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

Backend `.env`:

```env
PORT=8080
DATABASE_URL="postgresql://itss2_user:itss2_password@localhost:5432/itss2_mvp?schema=public"
CORS_ORIGINS=http://localhost:5173
```

Frontend `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_USER_ID=demo-student-1
```

### 4.2 Prisma setup

Trong `ITSS2-Backend`:

```powershell
npm install @prisma/client
npm install -D prisma
npx prisma init
```

Them scripts vao `ITSS2-Backend/package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

Tao Prisma client:

`ITSS2-Backend/config/prisma.ts`

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

### 4.3 Prisma schema de xuat

File: `ITSS2-Backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  student
  employer
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

enum WorkPeriod {
  morning
  afternoon
  evening
}

enum JobStatus {
  open
  filled
  expired
  cancelled
}

enum MatchStatus {
  pending
  accepted
  rejected
  expired
}

model User {
  id              String         @id
  name            String
  email           String?        @unique
  address         String?
  phone           String?
  role            UserRole       @default(student)
  jobType         String?
  jobForm         String?
  category        String?
  university      String?
  major           String?
  desiredJob      String?
  skills          String[]       @default([])
  schedules       UserSchedule[]
  matchResults    MatchResult[]
  reviews         Review[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model Company {
  id                  String   @id @default(cuid())
  name                String   @unique
  location            String?
  employeeCount       String?
  industry            String?
  address             String?
  logo                String?
  trustScore          Float    @default(5)
  reviewCount         Int      @default(0)
  successfulHireCount Int      @default(0)
  jobs                Job[]
  reviews             Review[]
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Job {
  id                 String        @id @default(cuid())
  title              String
  jobType            String?
  category           String?
  jobForm            String?
  address            String?
  salary             Int?
  salaryUnit         String?
  experienceRequired String?
  numberOfPeople     String?
  workingTime        String?
  startDate          DateTime?
  endDate            DateTime?
  recruitStartDate   DateTime?
  recruitEndDate     DateTime?
  description        String?
  status             JobStatus     @default(open)
  requiredSkills     String[]      @default([])
  deleted            Boolean       @default(false)
  deletedAt          DateTime?
  companyId          String
  company            Company       @relation(fields: [companyId], references: [id])
  schedules          JobSchedule[]
  matchResults       MatchResult[]
  reviews            Review[]
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([deleted, status])
  @@index([jobType])
  @@index([category])
  @@index([jobForm])
}

model UserSchedule {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  day       DayOfWeek
  period    WorkPeriod

  @@unique([userId, day, period])
}

model JobSchedule {
  id        String     @id @default(cuid())
  jobId     String
  job       Job        @relation(fields: [jobId], references: [id], onDelete: Cascade)
  day       DayOfWeek
  period    WorkPeriod

  @@unique([jobId, day, period])
}

model MatchResult {
  id              String      @id @default(cuid())
  userId          String
  jobId           String
  score           Int
  status          MatchStatus @default(pending)
  reasons         String[]    @default([])
  matchedSchedule Json
  respondedAt     DateTime?
  expiresAt       DateTime?
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  job             Job         @relation(fields: [jobId], references: [id], onDelete: Cascade)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@unique([userId, jobId])
  @@index([userId, status])
}

model Review {
  id        String   @id @default(cuid())
  userId    String
  jobId     String
  companyId String
  rating    Int
  comment   String?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([companyId])
  @@index([jobId])
}
```

### 4.4 Mapping Vietnamese schedule

UI hien tai dung tieng Viet:

- Ngay: `Thu 2`, `Thu 3`, `Thu 4`, `Thu 5`, `Thu 6`, `Thu 7`, `Chu nhat`.
- Ca: `sang`, `chieu`, `toi`.

Database nen dung enum tieng Anh de on dinh:

| UI | DB |
|---|---|
| Thu 2 | MONDAY |
| Thu 3 | TUESDAY |
| Thu 4 | WEDNESDAY |
| Thu 5 | THURSDAY |
| Thu 6 | FRIDAY |
| Thu 7 | SATURDAY |
| Chu nhat | SUNDAY |
| sang | morning |
| chieu | afternoon |
| toi | evening |

Can tao helper:

`ITSS2-Backend/helper/schedule.mapper.ts`

Nhiem vu:

- Convert request tu FE sang enum DB.
- Convert response tu DB ve shape FE dang dung: `{ day: "Thu 2", period: "toi" }`.

---

## 5. Backend API v2

### 5.1 Giu API cu de FE it phai sua

| Method | Endpoint | Trang dang dung | Viec can lam voi PostgreSQL |
|---|---|---|---|
| GET | `/api/v1/jobs` | Home, JobList | Query Prisma, filter/search/pagination |
| GET | `/api/v1/jobs/detail/:id` | JobDetail | Query Prisma include company/schedules |
| GET | `/api/v1/users/:id` | Profile, Home | Query Prisma include schedules |
| POST | `/api/v1/users/:id` | Profile | Upsert user + replace schedules |
| GET | `/api/v1/users/:id/suggested-jobs` | Co san backend | Dung matching score moi |
| GET | `/api/v1/users/:id/get-category-list` | Profile | Prisma distinct category |
| GET | `/api/v1/address` | JobList | Prisma distinct address |

### 5.2 Them API matching

Route prefix: `/api/v1/matching`

| Method | Endpoint | Muc dich |
|---|---|---|
| POST | `/api/v1/matching/run/:userId` | Chay matching cho user demo va upsert `match_results` |
| GET | `/api/v1/matching/results/:userId` | Lay match list, include job/company/schedules |
| PATCH | `/api/v1/matching/results/:id/respond` | Cap nhat `accepted` hoac `rejected` |

Request respond:

```json
{ "status": "accepted" }
```

### 5.3 Them API reviews

Route prefix: `/api/v1/reviews`

| Method | Endpoint | Muc dich |
|---|---|---|
| GET | `/api/v1/reviews/company/:companyId` | Lay review theo company |
| POST | `/api/v1/reviews` | Tao review |

Body tao review:

```json
{
  "userId": "demo-student-1",
  "jobId": "job-coffee-evening",
  "companyId": "company-coffee-abc",
  "rating": 5,
  "comment": "Thong tin ro rang, ca lam phu hop."
}
```

Sau khi tao review:

- Tinh lai `Company.trustScore = avg(rating)`.
- Cap nhat `Company.reviewCount = count(review)`.
- Job detail lay trust score tu relation `job.company`.

### 5.4 Response compatibility cho frontend

Frontend hien tai dang expect job co object `company` va array `workingSchedule`.

Backend can map Prisma entity ve shape cu:

```ts
{
  _id: job.id,
  id: job.id,
  title: job.title,
  company: {
    id: job.company.id,
    name: job.company.name,
    location: job.company.location,
    employeeCount: job.company.employeeCount,
    industry: job.company.industry,
    address: job.company.address,
    logo: job.company.logo,
    trustScore: job.company.trustScore,
    reviewCount: job.company.reviewCount
  },
  workingSchedule: job.schedules.map(toFrontendSchedule)
}
```

Ly do giu `_id`: cac component hien tai dang dung `_id` khi navigate/render key.

---

## 6. Matching logic

### 6.1 Score MVP

Tong diem 100:

| Thanh phan | Diem | Dieu kien |
|---|---:|---|
| Trung lich `day + period` | 60 | Co it nhat 1 ca trung giua user va job |
| Trung `jobType` | 15 | User va job cung jobType |
| Trung `jobForm` | 10 | User va job cung jobForm |
| Trung `category` | 10 | User va job cung category |
| Trung `desiredJob` voi title | 5 | Title chua tu khoa mong muon |

Threshold:

- `score >= 60`: tao/update match.
- `score < 60`: khong hien trong match list.

### 6.2 Reasons tra ve FE

Vi du:

- `Trung lich: Thu 2 - toi`
- `Dung loai viec Part-Time`
- `Dung hinh thuc Lam them`
- `Dung nganh nghe Phuc vu`
- `Tieu de phu hop mong muon cua ban`

### 6.3 File can them

- `ITSS2-Backend/helper/schedule.mapper.ts`
- `ITSS2-Backend/helper/matching.helper.ts`
- `ITSS2-Backend/controllers/matching.controllers.ts`
- `ITSS2-Backend/routes/matching.routes.ts`

---

## 7. Frontend plan

### 7.1 Giu trang hien co

- `/profile`: giu form va schedule table, chi can dam bao call API PostgreSQL-compatible.
- `/jobs`: giu search/filter/pagination.
- `/jobs/:id`: giu detail layout, them trust score/reviews.
- `/`: giu Home, them CTA vao `/matches`.

### 7.2 Them route `/matches`

Tao:

- `ITSS2-Frontend/src/pages/Matches/Matches.jsx`
- `ITSS2-Frontend/src/pages/Matches/Matches.css`
- `ITSS2-Frontend/src/pages/Matches/index.js`

Sua:

- `ITSS2-Frontend/src/App.jsx`
- `ITSS2-Frontend/src/components/Header/Header.jsx`

Chuc nang `/matches`:

- Nut "Chay matching" goi `POST /api/v1/matching/run/:userId`.
- Load match list tu `GET /api/v1/matching/results/:userId`.
- Hien job title, company, salary, schedule, score, reasons, status.
- Button Accept/Reject goi `PATCH /api/v1/matching/results/:id/respond`.
- Link den `/jobs/:id`.

### 7.3 JobDetail reviews

Sua `ITSS2-Frontend/src/pages/JobDetail/JobDetail.jsx`:

- Hien `job.company.trustScore`.
- Hien `job.company.reviewCount`.
- Goi `GET /api/v1/reviews/company/:companyId`.
- Form tao review: rating 1-5, comment.
- Submit `POST /api/v1/reviews`.

---

## 8. Backend implementation checklist

### 8.1 PostgreSQL/Prisma foundation

- [ ] Tao root `docker-compose.yml` cho PostgreSQL.
- [ ] Doi `.env` backend tu `MONGO_URL` sang `DATABASE_URL`.
- [ ] Cai `@prisma/client` va `prisma`.
- [ ] Tao `ITSS2-Backend/prisma/schema.prisma`.
- [ ] Tao `ITSS2-Backend/config/prisma.ts`.
- [ ] Sua `ITSS2-Backend/index.ts`:
  - [ ] Khong require `MONGO_URL`.
  - [ ] Require `DATABASE_URL`.
  - [ ] Ready check test Prisma query nhe.
- [ ] Chay `npx prisma migrate dev --name init`.
- [ ] Chay `npx prisma generate`.

### 8.2 Replace Mongoose access

- [ ] Sua `controllers/jobs.controllers.ts` sang Prisma.
- [ ] Sua `controllers/users.controllers.ts` sang Prisma.
- [ ] Sua `controllers/address.controllers.ts` sang Prisma distinct address.
- [ ] Xoa hoac khong dung `models/*.models.ts` Mongoose.
- [ ] Sau khi migrate xong, remove dependency `mongoose`.

### 8.3 Matching/reviews

- [ ] Them `helper/schedule.mapper.ts`.
- [ ] Them `helper/matching.helper.ts`.
- [ ] Them `controllers/matching.controllers.ts`.
- [ ] Them `routes/matching.routes.ts`.
- [ ] Them `controllers/reviews.controllers.ts`.
- [ ] Them `routes/reviews.routes.ts`.
- [ ] Dang ky routes trong `routes/index.routes.ts`.

### 8.4 Seed data

Tao file: `ITSS2-Backend/prisma/seed.ts`

Seed toi thieu:

- User `demo-student-1`.
- Company `company-coffee-abc`.
- Company `company-konbini`.
- Job `job-coffee-evening`: match manh Thu 2 toi.
- Job `job-konbini-afternoon`: match mot phan Thu 4 chieu.
- Job `job-office-morning`: khong match lich.
- 2 reviews ban dau cho company demo.

Lenh:

```powershell
docker compose up -d db
cd ITSS2-Backend
npx prisma migrate dev
npm run db:seed
```

---

## 9. Demo script

### Buoc 0 - Chuan bi

```powershell
docker compose up -d db
cd ITSS2-Backend
npm run db:migrate
npm run db:seed
npm run dev
```

Terminal khac:

```powershell
cd ITSS2-Frontend
npm run dev
```

URL:

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`
- Demo user: `demo-student-1`

### Buoc 1 - Sinh vien cap nhat lich

1. Mo `/profile`.
2. Chon `Part-Time`.
3. Tick:
   - Thu 2 - Ca toi.
   - Thu 4 - Ca chieu.
   - Thu 7 - Ca sang.
4. Bam Cap nhat.

Expected:

- API `POST /api/v1/users/demo-student-1` thanh cong.
- PostgreSQL table `user_schedules` co 3 rows.

### Buoc 2 - Xem viec phu hop nhanh

1. Mo `/`.
2. Xem khu "Cong viec phu hop voi ban".
3. Bam "Xem tat ca".

Expected:

- `/jobs` hien job trung lich/tieu chi.

### Buoc 3 - Chay matching

1. Mo `/matches`.
2. Bam "Chay matching".
3. Xem list match.

Expected:

- Job trung lich co score >= 60.
- Moi match co reasons.
- Job khong trung lich khong hien.

### Buoc 4 - Accept/Reject

1. Accept match dau tien.
2. Reject match khac.

Expected:

- PostgreSQL table `match_results.status` cap nhat.
- UI cap nhat status badge.

### Buoc 5 - Review doanh nghiep

1. Tu match, vao chi tiet job.
2. Xem trust score/review count.
3. Tao review moi.

Expected:

- Table `reviews` co row moi.
- `companies.trustScore` va `companies.reviewCount` cap nhat.

---

## 10. Acceptance criteria

- [ ] `docker compose up -d db` tao PostgreSQL container thanh cong.
- [ ] `npm run db:migrate` tao schema thanh cong.
- [ ] `npm run db:seed` seed du lieu demo thanh cong.
- [ ] `npm run typecheck` trong `ITSS2-Backend` pass.
- [ ] `npm run build` trong `ITSS2-Frontend` pass.
- [ ] `/profile` doc/ghi user tu PostgreSQL.
- [ ] `/jobs` list/filter/search/pagination tu PostgreSQL.
- [ ] `/matches` chay matching va hien score/reasons.
- [ ] Accept/Reject match update PostgreSQL.
- [ ] `/jobs/:id` hien trust score/reviews.
- [ ] Tao review moi cap nhat trust score.

---

## 11. Thu tu trien khai de it rui ro

### Phase A - Database foundation

1. Them Docker PostgreSQL.
2. Them Prisma schema.
3. Tao migration init.
4. Tao seed demo.
5. Sua backend health/ready check sang PostgreSQL.

### Phase B - Port API cu sang PostgreSQL

1. Port `users.controllers.ts`.
2. Port `jobs.controllers.ts`.
3. Port `address.controllers.ts`.
4. Giu response shape tuong thich voi frontend.
5. Chay FE hien co de dam bao `/`, `/jobs`, `/profile`, `/jobs/:id` van hoat dong.

### Phase C - Micro-matching

1. Them matching helper/service.
2. Them matching routes/controllers.
3. Them frontend `/matches`.
4. Test run/accept/reject.

### Phase D - Reviews/trust score

1. Them reviews API.
2. Them trust score vao JobDetail.
3. Them review form.
4. Test tao review va tinh lai trust score.

---

## 12. Rui ro va cach xu ly

| Rui ro | Anh huong | Cach xu ly |
|---|---|---|
| Chuyen MongoDB sang PostgreSQL lam vo API cu | FE loi nhieu | Giu response mapper co `_id`, `company`, `workingSchedule` nhu cu |
| Prisma enum khac text tieng Viet UI | Schedule khong match | Dung `schedule.mapper.ts` de convert 2 chieu |
| `DEFAULT_USER_ID` cu la Mongo ObjectId | Demo user khong ton tai | Doi env sang `demo-student-1` va seed dung id nay |
| Query filter PostgreSQL phuc tap hon Mongoose | Jobs page sai count/pagination | Build where object truoc, count va find dung cung dieu kien |
| Review theo company name de trung | Du lieu sai | Dung `companyId` trong PostgreSQL |
| Chua co auth | Demo chua phan vai that | Ghi ro demo mode; auth de phase sau |

---

## 13. Backlog phase sau

- Auth register/login/JWT.
- Employer dashboard tao/sua/xoa job shift.
- Schedule theo `startTime/endTime` va overlap ratio.
- Notification realtime hoac polling.
- Countdown 48h va penalty trust score.
- Apply flow day du: student apply, employer approve, hire history.
- Test cho matching helper/controller.
- E2E demo flow voi Playwright.
- Docker compose day du cho `db + backend + frontend` neu can demo bang mot lenh.

