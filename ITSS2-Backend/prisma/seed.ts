import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import {
  RawJob,
  SCHEDULE_POOL,
  deriveCategory,
  normalizeJobForm,
  normalizeJobType,
  normalizeExperience,
  parseWorkHours,
  resolveSchedule,
  synthesizeSalary,
} from "./lib/transform";

const prisma = new PrismaClient();

// ─── Curated companies (8 demo, full metadata) ────────────────────────────────

const CURATED_COMPANIES = [
  {
    name: "FPT Software Academy",
    description: "Training and software outsourcing unit for student internships.",
    location: "Ha Noi",
    employeeCount: "1000+ nhan vien",
    industry: "IT",
    address: "17 Duy Tan, Cau Giay, Ha Noi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/FPT_Software_logo.svg/960px-FPT_Software_logo.svg.png",
  },
  {
    name: "Viettel Digital",
    description: "Digital product team with flexible part-time roles.",
    location: "Ha Noi",
    employeeCount: "500+ nhan vien",
    industry: "IT",
    address: "Keangnam, Pham Hung, Nam Tu Liem, Ha Noi",
    logo: "https://static.wikia.nocookie.net/logos/images/a/a9/Viettel_Digital.png/revision/latest/scale-to-width-down/985?cb=20221216044840&path-prefix=vi",
  },
  {
    name: "Sun Edu Lab",
    description: "Education technology company focused on coding courses.",
    location: "Da Nang",
    employeeCount: "200 nhan vien",
    industry: "Giao duc",
    address: "Hai Chau, Da Nang",
    logo: "https://via.placeholder.com/150?text=Sun",
  },
  {
    name: "VNPT AI Center",
    description: "AI and data team hiring interns for research support.",
    location: "Ha Noi",
    employeeCount: "300 nhan vien",
    industry: "IT",
    address: "57 Huynh Thuc Khang, Dong Da, Ha Noi",
    logo: "https://vnptai.io/img/logoVNPT.png",
  },
  {
    name: "Tiki Operations",
    description: "E-commerce operations and customer experience team.",
    location: "TP Ho Chi Minh",
    employeeCount: "800 nhan vien",
    industry: "Van hanh",
    address: "Tan Binh, TP Ho Chi Minh",
    logo: "https://via.placeholder.com/150?text=Tiki",
  },
  {
    name: "Highlands Coffee Student Hub",
    description: "Flexible shift jobs for students in store operations.",
    location: "Ha Noi",
    employeeCount: "1000+ nhan vien",
    industry: "F&B",
    address: "Hoan Kiem, Ha Noi",
    logo: "https://via.placeholder.com/150?text=Highlands",
  },
  {
    name: "Apollo English",
    description: "English center with teaching assistant positions.",
    location: "Ha Noi",
    employeeCount: "500 nhan vien",
    industry: "Giao duc",
    address: "Ba Dinh, Ha Noi",
    logo: "https://via.placeholder.com/150?text=Apollo",
  },
  {
    name: "Grab Support Vietnam",
    description: "Customer support and business operations roles.",
    location: "TP Ho Chi Minh",
    employeeCount: "400 nhan vien",
    industry: "Cham soc khach hang",
    address: "Quan 7, TP Ho Chi Minh",
    logo: "https://via.placeholder.com/150?text=Grab",
  },
];

// ─── Curated jobs (24 clean part-time demo jobs) ──────────────────────────────
// [title, category, jobType, jobForm, salary, description, companyIdx, address]

const CURATED_JOBS = [
  ["Frontend Developer Intern", "IT", "Part-time", "Remote", 5000000, "React, TypeScript, CSS", 0, "Ha Noi"],
  ["Backend Node.js Intern", "IT", "Part-time", "Hybrid", 5500000, "Express, Prisma, PostgreSQL", 0, "Ha Noi"],
  ["QA Tester Part-time", "IT", "Part-time", "On-site", 4200000, "Manual testing and bug reports", 0, "Ha Noi"],
  ["Data Labeling Collaborator", "IT", "Part-time", "Remote", 3500000, "Label text data for AI models", 3, "Ha Noi"],
  ["AI Research Assistant", "IT", "Part-time", "Hybrid", 6000000, "Support data experiments and reports", 3, "Ha Noi"],
  ["Digital Marketing Intern", "Marketing", "Part-time", "Hybrid", 4500000, "Content planning and campaign support", 1, "Ha Noi"],
  ["Social Media Content Creator", "Marketing", "Part-time", "Remote", 4000000, "Create short posts and manage fanpage", 2, "Da Nang"],
  ["E-commerce Operations Assistant", "Van hanh", "Part-time", "On-site", 3800000, "Order tracking and seller support", 4, "TP Ho Chi Minh"],
  ["Customer Support Agent", "Cham soc khach hang", "Part-time", "Remote", 4200000, "Handle customer requests via chat", 7, "TP Ho Chi Minh"],
  ["Teaching Assistant - English", "Giao duc", "Part-time", "On-site", 3600000, "Support English classes for kids", 6, "Ha Noi"],
  ["Math Tutor Grade 8", "Giao duc", "Part-time", "On-site", 3000000, "Tutor middle school students", 6, "Ha Noi"],
  ["Coding Class Assistant", "Giao duc", "Part-time", "Hybrid", 4200000, "Support programming classes", 2, "Da Nang"],
  ["Barista Part-time", "F&B", "Part-time", "On-site", 3200000, "Serve drinks and support store operations", 5, "Ha Noi"],
  ["Store Cashier", "F&B", "Part-time", "On-site", 3000000, "Cashier and customer service", 5, "Ha Noi"],
  ["Recruitment Intern", "Nhan su", "Part-time", "Hybrid", 4000000, "CV screening and interview scheduling", 1, "Ha Noi"],
  ["Business Analyst Intern", "IT", "Part-time", "Hybrid", 5200000, "Collect requirements and write user stories", 1, "Ha Noi"],
  ["UI/UX Design Intern", "Thiet ke", "Part-time", "Remote", 4800000, "Design wireframes and prototypes", 0, "Ha Noi"],
  ["Graphic Designer Part-time", "Thiet ke", "Part-time", "Remote", 4300000, "Create banners and social visuals", 4, "TP Ho Chi Minh"],
  ["Sales Support Collaborator", "Kinh doanh", "Part-time", "On-site", 3500000, "Prepare leads and support sales team", 7, "TP Ho Chi Minh"],
  ["Logistics Coordinator Assistant", "Van hanh", "Part-time", "On-site", 3700000, "Track delivery status and update reports", 4, "TP Ho Chi Minh"],
  ["DevOps Intern", "IT", "Part-time", "Hybrid", 6500000, "Support CI/CD and cloud monitoring", 3, "Ha Noi"],
  ["Mobile App Intern", "IT", "Part-time", "Remote", 5600000, "Build React Native features", 0, "Ha Noi"],
  ["SEO Content Writer", "Marketing", "Part-time", "Remote", 3900000, "Write SEO articles and optimize content", 2, "Da Nang"],
  ["Community Event Assistant", "Su kien", "Part-time", "On-site", 3400000, "Support student workshops and check-in", 6, "Ha Noi"],
] as const;

// ─── Review templates ─────────────────────────────────────────────────────────

const REVIEW_COMMENTS = [
  "Moi truong lam viec than thien, duoc huong dan nhiet tinh.",
  "Co nhieu co hoi hoc hoi, duoc lam viec voi cong nghe moi.",
  "Luong hop ly, cong viec thu vi va phu hop voi sinh vien.",
  "Lich lam viec linh hoat, phu hop voi lich hoc tren truong.",
  "Co nhieu task thuc te, giao vien huong dan nhiet tinh.",
  "Nhan vien than thien, van phong sach se va thoai mai.",
  "Duoc tang kien thuc thuc te, qua trinh lam viec rat hay.",
  "Bo sung nhieu ky nang mem, rat xung dang de trai nghiem.",
  "Ho tro sinh vien rat tot, thu nhap on dinh hang thang.",
  "Cong ty co van hoa lanh manh, phu hop voi nguoi moi bat dau.",
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Starting seed...\n");

  // ── 0. Wipe existing data (order respects FK constraints) ─────────────────
  await prisma.matchResult.deleteMany();
  await prisma.review.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const demoPasswordHash = await bcrypt.hash("Password123", 10);

  // ── 1. Load real jobs from committed dataset ───────────────────────────────
  const dataPath = path.join(__dirname, "data", "jobs.json");
  const rawJobs: RawJob[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  const logoMapPath = path.join(__dirname, "data", "company-logos.json");
  const logoMap: Record<string, string> = JSON.parse(fs.readFileSync(logoMapPath, "utf-8"));

  // ── 2. Companies ──────────────────────────────────────────────────────────
  // Build a unique set of company names from the real dataset
  const realCompanyNames = [...new Set(rawJobs.map((j) => j.company_name))].filter(
    (name) => !CURATED_COMPANIES.find((c) => c.name === name)
  );

  // Create curated companies first (they have logos + full metadata)
  const createdCurated = await Promise.all(
    CURATED_COMPANIES.map((c) =>
      prisma.company.create({
        data: { ...c, trustScore: 0, reviewCount: 0 },
      })
    )
  );

  // Create real companies (minimal metadata; logo/location derived as placeholders)
  const createdReal = await Promise.all(
    realCompanyNames.map((name, i) => {
      // Pick a representative raw job for this company to derive industry
      const sample = rawJobs.find((j) => j.company_name === name)!;
      const industry = deriveCategory(sample.skills_required ?? null, sample.position_title);
      return prisma.company.create({
        data: {
          name,
          description: null,
          trustScore: 0,
          reviewCount: 0,
          location: null,
          industry,
          address: null,
          logo: logoMap[name] ?? `https://via.placeholder.com/150?text=${encodeURIComponent(name.slice(0, 10))}`,
        },
      });
    })
  );

  // Build name → id map for both curated and real companies
  const companyMap = new Map<string, string>();
  createdCurated.forEach((c) => companyMap.set(c.name, c.id));
  createdReal.forEach((c) => companyMap.set(c.name, c.id));

  const totalCompanies = createdCurated.length + createdReal.length;
  console.log(`  ✓ Companies: ${totalCompanies} (${createdCurated.length} curated + ${createdReal.length} real)`);

  // ── 3. Users ───────────────────────────────────────────────────────────────
  const demoUsers = [
    {
      id: "demo-student-1",
      name: "Nguyen Van A",
      email: "student@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "Ha Noi",
      phone: "0123456789",
      jobType: "Part-time",
      jobForm: "Remote",
      category: "IT",
      university: "Dai hoc Bach Khoa Ha Noi",
      major: "Cong nghe thong tin",
      desiredJob: "Frontend Developer",
      schedules: [
        { day: "Thu 2", period: "sang" },
        { day: "Thu 4", period: "chieu" },
        { day: "Thu 5", period: "toi" },
      ],
    },
    {
      id: "demo-student-2",
      name: "Tran Thi B",
      email: "student2@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "TP Ho Chi Minh",
      phone: "0987654321",
      jobType: "Part-time",
      jobForm: "On-site",
      category: "Marketing",
      university: "Dai hoc Kinh te TP.HCM",
      major: "Marketing",
      desiredJob: "Digital Marketing Intern",
      schedules: [
        { day: "Thu 3", period: "chieu" },
        { day: "Thu 6", period: "sang" },
      ],
    },
    {
      id: "demo-student-3",
      name: "Le Van C",
      email: "student3@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "Da Nang",
      phone: "0911223344",
      jobType: "Part-time",
      jobForm: "Hybrid",
      category: "Thiet ke",
      university: "Dai hoc Da Nang",
      major: "Thiet ke do hoa",
      desiredJob: "UI/UX Design Intern",
      schedules: [
        { day: "Thu 2", period: "toi" },
        { day: "Thu 7", period: "chieu" },
      ],
    },
    {
      id: "demo-student-4",
      name: "Pham Thi D",
      email: "student4@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "Ha Noi",
      phone: "0977889900",
      jobType: "Part-time",
      jobForm: "Remote",
      category: "Giao duc",
      university: "Dai hoc Su pham Ha Noi",
      major: "Su pham Tieng Anh",
      desiredJob: "Teaching Assistant - English",
      schedules: [
        { day: "Thu 3", period: "sang" },
        { day: "Thu 5", period: "chieu" },
      ],
    },
    {
      id: "demo-student-5",
      name: "Hoang Van E",
      email: "student5@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "Ha Noi",
      phone: "0922334455",
      jobType: "Part-time",
      jobForm: "Hybrid",
      category: "Tai chinh",
      university: "Hoc vien Tai chinh",
      major: "Ke toan",
      desiredJob: "Finance Intern",
      schedules: [
        { day: "Thu 4", period: "sang" },
        { day: "Thu 6", period: "toi" },
      ],
    },
  ];

  const createdUsers = await Promise.all(
    demoUsers.map(({ schedules, ...userData }) =>
      prisma.user.create({
        data: {
          ...userData,
          schedules: { create: schedules },
        },
      })
    )
  );
  console.log(`  ✓ Users: ${createdUsers.length}`);

  // ── 4. Curated jobs (24 clean part-time backbone) ─────────────────────────
  const baseStartDate = new Date("2026-06-10T00:00:00.000Z");
  const createdCuratedJobs = [];

  for (let i = 0; i < CURATED_JOBS.length; i++) {
    const [title, category, jobType, jobForm, salary, description, companyIdx, address] = CURATED_JOBS[i]!;
    const startDate = new Date(baseStartDate);
    startDate.setDate(baseStartDate.getDate() + i);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 30 + (i % 10));
    const slots = SCHEDULE_POOL[i % SCHEDULE_POOL.length]!;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        salary,
        salaryUnit: "thang",
        category,
        jobType,
        jobForm,
        companyId: createdCurated[companyIdx]!.id,
        address,
        experienceRequired: i % 3 === 0 ? "Khong yeu cau kinh nghiem" : "Co kien thuc co ban",
        numberOfPeople: `${(i % 4) + 1} nguoi`,
        workingTime: slots.map((s) => `${s.day} ${s.period}`).join(", "),
        startDate,
        endDate,
        schedules: { create: slots },
      },
    });
    createdCuratedJobs.push(job);
  }
  console.log(`  ✓ Curated jobs: ${createdCuratedJobs.length}`);

  // ── 5. Real jobs from TopCV dataset ───────────────────────────────────────
  let realJobCount = 0;
  let realScheduleCount = 0;

  for (let i = 0; i < rawJobs.length; i++) {
    const raw = rawJobs[i]!;
    const companyId = companyMap.get(raw.company_name);
    if (!companyId) continue; // should not happen — all companies were created above

    const category = deriveCategory(raw.skills_required ?? null, raw.position_title);
    const jobType = normalizeJobType(raw.job_type, "Part-time");
    const jobForm = normalizeJobForm(raw.remote_policy) ?? ["Remote", "Hybrid", "On-site"][i % 3]!;
    const experience = normalizeExperience(raw.job_level, raw.years_experience);
    const salary = synthesizeSalary(category, raw.job_level, i);

    const parsedSlots = parseWorkHours(raw.work_hours);
    const scheduleSlots = resolveSchedule(i, parsedSlots);
    const workingTime = scheduleSlots.map((s) => `${s.day} ${s.period}`).join(", ");

    const fullDesc = [raw.description, raw.requirements]
      .filter(Boolean)
      .join("\n\n---\n\nYeu cau:\n")
      .trim();

    const startDate = raw.created_at ? new Date(raw.created_at) : baseStartDate;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 30 + (i % 15));

    await prisma.job.create({
      data: {
        title: raw.position_title,
        description: fullDesc || null,
        salary,
        salaryUnit: "thang",
        category,
        jobType,
        jobForm,
        companyId,
        address: null,
        experienceRequired: experience,
        numberOfPeople: `${(i % 4) + 1} nguoi`,
        workingTime,
        startDate,
        endDate,
        schedules: { create: scheduleSlots },
      },
    });

    realJobCount++;
    realScheduleCount += scheduleSlots.length;
  }

  console.log(`  ✓ Real jobs: ${realJobCount} (${realScheduleCount} schedule rows)`);

  // ── 6. Reviews → trustScore recompute ─────────────────────────────────────
  const allCompanyIds = [...createdCurated, ...createdReal].map((c) => c.id);
  let totalReviews = 0;

  for (let ci = 0; ci < allCompanyIds.length; ci++) {
    const companyId = allCompanyIds[ci]!;
    const reviewCount = 3 + (ci % 6); // 3–8 reviews per company

    const reviewsData = Array.from({ length: reviewCount }, (_, ri) => {
      const authorIdx = (ci + ri) % demoUsers.length;
      const rating = 3 + ((ci + ri * 2) % 3); // 3, 4, or 5
      return {
        userId: createdUsers[authorIdx]!.id,
        companyId,
        rating,
        comment: REVIEW_COMMENTS[(ci + ri) % REVIEW_COMMENTS.length]!,
      };
    });

    await prisma.review.createMany({ data: reviewsData });

    // Recompute trustScore (mirrors reviews.controllers.ts transaction logic)
    const totalRating = reviewsData.reduce((sum, r) => sum + r.rating, 0);
    const trustScore = Number((totalRating / reviewCount).toFixed(1));

    await prisma.company.update({
      where: { id: companyId },
      data: { trustScore, reviewCount },
    });

    totalReviews += reviewCount;
  }

  console.log(`  ✓ Reviews: ${totalReviews} (trustScore computed for all companies)`);

  // ── 7. Summary ────────────────────────────────────────────────────────────
  const [totalJobs, totalSchedules] = await Promise.all([
    prisma.job.count(),
    prisma.schedule.count(),
  ]);

  console.log("\n📊  Seed summary:");
  console.log(`   Companies : ${totalCompanies}`);
  console.log(`   Users     : ${createdUsers.length}`);
  console.log(`   Jobs      : ${totalJobs} (${createdCuratedJobs.length} curated + ${realJobCount} real)`);
  console.log(`   Schedules : ${totalSchedules}`);
  console.log(`   Reviews   : ${totalReviews}`);
  console.log("\n✅  Seed complete.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
