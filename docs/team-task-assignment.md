# Team Task Assignment - MVP Micro-matching

> Ngay lap: 2026-06-03  
> Muc tieu: dua project hien tai thanh MVP bam `docs/overReview.md`  
> Team size: 7 nguoi  
> Huong ky thuat: tan dung FE React Vite + BE Express TypeScript hien tai, thay DB sang PostgreSQL Docker + Prisma.

---

## 1. Can lam gi nua de dat MVP

Theo `docs/overReview.md`, san pham can chung minh gia tri cot loi: giai quyet lech pha thoi gian giua sinh vien va viec lam them bang co che micro-matching. Project hien tai da co nen tang tim viec, profile va schedule co ban, nhung chua du MVP.

### 1.1 Da co trong project

- FE co cac trang: Home, JobList, JobDetail, Profile.
- BE co API list/detail jobs, get/update user, suggested jobs.
- Profile FE da co schedule table theo `day + period`.
- Job model hien tai da co `workingSchedule`, company info, salary, category, jobType, jobForm.
- Home/JobList da co loc job theo lich trong o muc don gian.

### 1.2 Con thieu de dung voi `overReview.md`

| Hang muc | Trang thai hien tai | Viec can lam |
|---|---|---|
| Database | Dang dung MongoDB/Mongoose | Chuyen sang PostgreSQL Docker + Prisma |
| Schema MVP | Chua co DB schema chuan cho matching/review | Tao users, companies, jobs, schedules, match_results, reviews |
| Student schedule | UI da co, BE dang MongoDB | Port sang PostgreSQL, giu response shape cu |
| Employer shift/job | Dang coi Job la job posting | Chuan hoa Job thanh ca/viec co schedule va dieu kien ro |
| Auto-matching | Moi co suggest score don gian | Them matching engine, score, reasons, match status |
| Notification | Chua co | MVP dung UI badge/toast, khong lam push realtime |
| Trust score/review | Chua co | Them review API, trust score, hien o JobDetail |
| Demo data | Chua co seed PostgreSQL | Tao seed demo chay bang `npm run db:seed` |
| QA/demo flow | Chua co script end-to-end | Tao checklist demo va test build/typecheck |

### 1.3 Definition of MVP done

MVP duoc coi la dat khi demo duoc 5 buoc:

1. Sinh vien cap nhat lich trong tai `/profile`.
2. He thong hien job phu hop tai Home/JobList.
3. Sinh vien vao `/matches`, chay matching va thay score/reasons.
4. Sinh vien accept/reject match.
5. Sinh vien xem JobDetail co trust score/reviews va tao review moi.

---

## 2. Phan vai 7 nguoi

Dat ten tam thoi de chia viec. Khi nhom co ten that, thay `P1..P7` bang ten thanh vien.

| Thanh vien | Vai tro chinh | Trach nhiem |
|---|---|---|
| P1 | DB/Backend Lead | PostgreSQL Docker, Prisma schema, migration, seed, ready check |
| P2 | Backend API | Port API cu tu Mongoose sang Prisma: jobs, users, address |
| P3 | Matching Backend | Matching helper/service, matching routes/controllers, scoring |
| P4 | Frontend Core | Giu Home/JobList/Profile chay sau khi backend doi DB |
| P5 | Frontend Feature | Tao `/matches`, accept/reject UI, JobDetail review/trust score |
| P6 | QA/Seed/Demo | Seed data, test cases, demo script, bug verification |
| P7 | PM/Docs/Integration | Theo milestone, ghep PR, cap nhat docs, chuan bi thuyet trinh/demo |

Quy tac lam viec:

- Moi milestone phai co acceptance criteria ro.
- API cu phai giu response shape de FE it vo nhat: `_id`, `company`, `workingSchedule`.
- Khong lam auth trong MVP; dung `VITE_DEFAULT_USER_ID=demo-student-1`.
- Khong lam realtime push notification; dung badge/toast.
- Moi nguoi push theo branch rieng va merge sau khi `typecheck/build` pass.

---

## 3. Milestone plan

### M0 - Huong dan cau hinh database

Thoi luong: 0.5-1 ngay  
Owner chinh: P1  
Ho tro: P2, P6, P7

Muc tieu: tat ca thanh vien co cung PostgreSQL local, Prisma schema va seed demo.

#### M0.1 Files can tao/sua

- Tao root `docker-compose.yml`.
- Tao `ITSS2-Backend/.env.example`.
- Tao `ITSS2-Backend/prisma/schema.prisma`.
- Tao `ITSS2-Backend/prisma/seed.ts`.
- Tao `ITSS2-Backend/config/prisma.ts`.
- Sua `ITSS2-Backend/package.json` them scripts Prisma.
- Cap nhat `ITSS2-Backend/README.md` phan local DB.

#### M0.2 Docker PostgreSQL

Root `docker-compose.yml`:

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

#### M0.3 Backend env

`ITSS2-Backend/.env.example`:

```env
PORT=8080
DATABASE_URL="postgresql://itss2_user:itss2_password@localhost:5432/itss2_mvp?schema=public"
CORS_ORIGINS=http://localhost:5173
```

`ITSS2-Frontend/.env.local.example`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_USER_ID=demo-student-1
```

#### M0.4 Commands cho ca nhom

Tu root repo:

```powershell
docker compose up -d db
```

Backend:

```powershell
cd ITSS2-Backend
npm ci
Copy-Item .env.example .env
npm install @prisma/client
npm install -D prisma
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Frontend:

```powershell
cd ITSS2-Frontend
npm ci
Copy-Item .env.local.example .env.local
npm run dev
```

#### M0.5 Acceptance criteria

- [ ] `docker compose ps` thay container `itss2_postgres` healthy.
- [ ] `npx prisma migrate dev` tao duoc tables.
- [ ] `npm run db:seed` tao user `demo-student-1` va job demo.
- [ ] `GET http://localhost:8080/healthz` tra ve ok.
- [ ] `GET http://localhost:8080/readyz` tra ve ok voi PostgreSQL.
- [ ] Ca nhom dung chung `VITE_DEFAULT_USER_ID=demo-student-1`.

#### M0.6 Phan cong chi tiet

| Nguoi | Viec |
|---|---|
| P1 | Tao Docker Compose, Prisma schema, Prisma client, migration init |
| P2 | Sua backend startup/ready check tu `MONGO_URL` sang `DATABASE_URL` |
| P6 | Tao seed data demo va verify bang Prisma Studio |
| P7 | Viet huong dan setup trong README/docs, gom loi thuong gap |
| P3/P4/P5 | Chay setup tren may ca nhan va bao loi integration |

---

### M1 - Port API cu sang PostgreSQL

Thoi luong: 1.5-2 ngay  
Owner chinh: P2  
Ho tro: P1, P4, P6

Muc tieu: FE hien co van chay duoc nhung data lay tu PostgreSQL.

#### Backend scope

- Port `controllers/users.controllers.ts`:
  - `GET /api/v1/users/:id`.
  - `POST /api/v1/users/:id`.
  - `GET /api/v1/users/:id/suggested-jobs`.
  - `GET /api/v1/users/:id/get-category-list`.
- Port `controllers/jobs.controllers.ts`:
  - `GET /api/v1/jobs`.
  - `GET /api/v1/jobs/detail/:id`.
  - Search/filter/sort/pagination.
- Port `controllers/address.controllers.ts`:
  - distinct address tu PostgreSQL.
- Tao mapper response:
  - Job Prisma -> FE shape co `_id`, `company`, `workingSchedule`.
  - User Prisma -> FE shape co `workingSchedule`.

#### Frontend scope

- P4 test Home, JobList, Profile, JobDetail voi API moi.
- Chi sua FE khi response mismatch, khong redesign.

#### Acceptance criteria

- [ ] `/profile` load duoc user demo.
- [ ] `/profile` save schedule thanh cong.
- [ ] `/` hien newest jobs va jobs phu hop.
- [ ] `/jobs` filter keyword/address/category/jobType/jobForm/salary/schedule.
- [ ] `/jobs/:id` hien detail job khong loi.
- [ ] Backend `npm run typecheck` pass.

#### Phan cong

| Nguoi | Viec |
|---|---|
| P1 | Ho tro Prisma query, index/schema neu query thieu |
| P2 | Port jobs/users/address controllers |
| P4 | Test va sua Home/JobList/Profile neu response mismatch |
| P6 | Viet checklist API parity va test case |
| P7 | Cap nhat docs API thay doi |

---

### M2 - Core micro-matching

Thoi luong: 1.5-2 ngay  
Owner chinh: P3  
Ho tro: P2, P5, P6

Muc tieu: co endpoint chay matching, luu match_results, hien score/reasons.

#### Backend scope

Them files:

- `ITSS2-Backend/helper/schedule.mapper.ts`
- `ITSS2-Backend/helper/matching.helper.ts`
- `ITSS2-Backend/controllers/matching.controllers.ts`
- `ITSS2-Backend/routes/matching.routes.ts`

Them endpoints:

| Method | Endpoint | Muc dich |
|---|---|---|
| POST | `/api/v1/matching/run/:userId` | Chay matching va upsert match_results |
| GET | `/api/v1/matching/results/:userId` | Lay match list |
| PATCH | `/api/v1/matching/results/:id/respond` | Accept/reject |

Score MVP:

| Dieu kien | Diem |
|---|---:|
| Trung lich `day + period` | 60 |
| Trung `jobType` | 15 |
| Trung `jobForm` | 10 |
| Trung `category` | 10 |
| `desiredJob` match title | 5 |

Threshold: `score >= 60`.

#### Frontend scope

P5 tao route/page `/matches`:

- Nut chay matching.
- List match cards.
- Score, reasons, status.
- Accept/Reject.
- Link den JobDetail.

#### Acceptance criteria

- [ ] `POST /matching/run/demo-student-1` tao match_results.
- [ ] Match co score va reasons ro.
- [ ] Job khong trung lich khong hien.
- [ ] `/matches` load duoc list.
- [ ] Accept/Reject cap nhat status.
- [ ] Backend typecheck pass, frontend build pass.

#### Phan cong

| Nguoi | Viec |
|---|---|
| P3 | Matching helper, controller, route, scoring |
| P2 | Review query Prisma va response shape |
| P5 | FE `/matches`, accept/reject UI |
| P6 | Test edge cases: no schedule, no job, duplicate run |
| P7 | Viet demo narrative cho micro-matching |

---

### M3 - Review/trust score va minh bach thong tin

Thoi luong: 1-1.5 ngay  
Owner chinh: P5  
Ho tro: P2, P6

Muc tieu: bo sung tinh nang duoc them trong `overReview.md`: xem diem uy tin va review doanh nghiep.

#### Backend scope

Them:

- `controllers/reviews.controllers.ts`
- `routes/reviews.routes.ts`

Endpoints:

| Method | Endpoint | Muc dich |
|---|---|---|
| GET | `/api/v1/reviews/company/:companyId` | Lay reviews |
| POST | `/api/v1/reviews` | Tao review |

Sau `POST /reviews`:

- Validate rating 1-5.
- Insert review.
- Recalculate `companies.trustScore`.
- Recalculate `companies.reviewCount`.

#### Frontend scope

Sua `JobDetail.jsx`:

- Hien trust score.
- Hien review count.
- Hien review list.
- Form tao review.

#### Acceptance criteria

- [ ] JobDetail hien trust score/review count.
- [ ] Tao review moi thanh cong.
- [ ] Review moi xuat hien khong can reload thu cong, hoac reload list sau submit.
- [ ] Trust score cap nhat dung average rating.

#### Phan cong

| Nguoi | Viec |
|---|---|
| P2 | Reviews API va trust score transaction |
| P5 | JobDetail review UI |
| P6 | Test rating invalid, missing job/company, average score |
| P7 | Cap nhat demo script buoc review |

---

### M4 - Demo polish va UX lien ket luong

Thoi luong: 1-1.5 ngay  
Owner chinh: P4  
Ho tro: P5, P7

Muc tieu: luong demo muot, nguoi xem thay duoc gia tri san pham ngay.

#### Scope

- Header them link `/matches`.
- Home them CTA "Xem viec phu hop" den `/matches`.
- Profile sau khi save co CTA/toast sang `/matches`.
- JobList neu co filter schedule thi hien label "Cong viec trung lich cua ban".
- Matches page co empty/loading/error states.
- JobDetail co link quay lai list/matches hop ly.
- Khong redesign lon, chi lam ro luong demo.

#### Acceptance criteria

- [ ] Demo di duoc `/profile -> /matches -> /jobs/:id -> review`.
- [ ] Khong co text bi tran nut/card o desktop co ban.
- [ ] Loading/error states khong lam trang trong.
- [ ] Frontend `npm run build` pass.

#### Phan cong

| Nguoi | Viec |
|---|---|
| P4 | Home/Profile/JobList UX glue |
| P5 | Matches/JobDetail polish |
| P6 | Smoke test UI |
| P7 | Chuan bi script thuyet trinh 5 buoc |

---

### M5 - QA, hardening, final demo

Thoi luong: 1-2 ngay  
Owner chinh: P6  
Ho tro: ca nhom

Muc tieu: san pham MVP on dinh de demo, khong phai sua DB thu cong giua chung.

#### Checklist ky thuat

- [ ] `docker compose up -d db` pass.
- [ ] `npm run db:migrate` pass.
- [ ] `npm run db:seed` pass.
- [ ] Backend `npm run typecheck` pass.
- [ ] Backend `npm run dev` chay.
- [ ] Frontend `npm run build` pass.
- [ ] Frontend `npm run dev` chay.
- [ ] Demo user `demo-student-1` ton tai.
- [ ] Demo jobs/reviews/matches seed du.

#### Test cases

| Case | Expected |
|---|---|
| User khong co schedule | Matching khong crash, hien empty state |
| User co Thu 2 toi | Match job Thu 2 toi score >= 60 |
| Chay matching 2 lan | Khong tao duplicate match |
| Accept match | Status thanh accepted |
| Reject match | Status thanh rejected |
| Review rating 6 | API reject |
| Tao review rating 5 | Trust score tinh lai |
| Filter JobList theo schedule | Count va pagination dung |

#### Final deliverables

- [ ] Code MVP.
- [ ] Seed data.
- [ ] Demo script.
- [ ] README setup database.
- [ ] Slide/narrative giai thich vi sao bam `overReview.md`.
- [ ] Known limitations/backlog.

#### Phan cong

| Nguoi | Viec |
|---|---|
| P1 | Verify DB reset/migrate/seed tu dau |
| P2 | Fix BE bugs tu QA |
| P3 | Fix matching bugs tu QA |
| P4 | Fix FE bugs Home/Profile/JobList |
| P5 | Fix FE bugs Matches/JobDetail |
| P6 | Chay full QA va ghi bug list |
| P7 | Demo script, docs, final checklist |

---

## 4. Timeline de xuat

Neu nhom lam song song, MVP co the hoan thanh trong 7-9 ngay lam viec.

| Ngay | Milestone | Output |
|---|---|---|
| Day 1 | M0 | PostgreSQL Docker + Prisma + seed base |
| Day 2-3 | M1 | API cu chay tren PostgreSQL |
| Day 4-5 | M2 | Matching API + `/matches` |
| Day 6 | M3 | Review/trust score |
| Day 7 | M4 | Demo UX polish |
| Day 8-9 | M5 | QA, fix bug, final demo |

---

## 5. Dependency map

- M1 phu thuoc M0.
- M2 backend phu thuoc M0 va mot phan M1 mapper jobs/users.
- M2 frontend co the lam mock truoc, nhung integration phu thuoc matching API.
- M3 phu thuoc schema companies/jobs/reviews tu M0.
- M4 phu thuoc M1-M3.
- M5 phu thuoc tat ca milestone truoc.

---

## 6. Scope guard

De giu MVP dung tien do, khong lam cac muc sau trong milestone nay:

- Auth/register/login/JWT.
- Employer dashboard day du.
- Push notification realtime.
- Countdown 48h/auto penalty.
- Schedule theo gio phut chi tiet.
- Deploy production PostgreSQL.
- Rewrite FE/BE sang framework khac.

Nhung van nen ghi trong backlog vi lien quan `overReview.md`, dac biet challenge 2 ve minh bach quy trinh.
