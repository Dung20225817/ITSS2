// seed-version: 2
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
  parseLocation,
  resolveSchedule,
  synthesizeSalary,
} from "./lib/transform";

const prisma = new PrismaClient();

// ─── Curated companies (8 demo, full metadata) ────────────────────────────────

const CURATED_COMPANIES = [
  {
    name: "FPT Software Academy",
    description: "Đơn vị đào tạo và gia công phần mềm, chuyên tuyển sinh viên thực tập.",
    location: "Hà Nội",
    employeeCount: "1000+ nhân viên",
    industry: "IT",
    address: "17 Duy Tân, Cầu Giấy, Hà Nội",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/FPT_Software_logo.svg/960px-FPT_Software_logo.svg.png",
  },
  {
    name: "Viettel Digital",
    description: "Đội ngũ sản phẩm số với nhiều vị trí bán thời gian linh hoạt.",
    location: "Hà Nội",
    employeeCount: "500+ nhân viên",
    industry: "IT",
    address: "Keangnam, Phạm Hùng, Nam Từ Liêm, Hà Nội",
    logo: "https://static.wikia.nocookie.net/logos/images/a/a9/Viettel_Digital.png/revision/latest/scale-to-width-down/985?cb=20221216044840&path-prefix=vi",
  },
  {
    name: "Sun Edu Lab",
    description: "Công ty công nghệ giáo dục chuyên về các khóa học lập trình.",
    location: "Đà Nẵng",
    employeeCount: "200 nhân viên",
    industry: "Giáo dục",
    address: "Hải Châu, Đà Nẵng",
    logo: "https://via.placeholder.com/150?text=Sun",
  },
  {
    name: "VNPT AI Center",
    description: "Đội ngũ AI và dữ liệu tuyển thực tập sinh hỗ trợ nghiên cứu.",
    location: "Hà Nội",
    employeeCount: "300 nhân viên",
    industry: "IT",
    address: "57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội",
    logo: "https://vnptai.io/img/logoVNPT.png",
  },
  {
    name: "Tiki Operations",
    description: "Đội ngũ vận hành thương mại điện tử và trải nghiệm khách hàng.",
    location: "TP Hồ Chí Minh",
    employeeCount: "800 nhân viên",
    industry: "Vận hành",
    address: "Tân Bình, TP Hồ Chí Minh",
    logo: "https://via.placeholder.com/150?text=Tiki",
  },
  {
    name: "Highlands Coffee Student Hub",
    description: "Việc làm theo ca linh hoạt cho sinh viên tại các cửa hàng.",
    location: "Hà Nội",
    employeeCount: "1000+ nhân viên",
    industry: "F&B",
    address: "Hoàn Kiếm, Hà Nội",
    logo: "https://via.placeholder.com/150?text=Highlands",
  },
  {
    name: "Apollo English",
    description: "Trung tâm tiếng Anh với vị trí trợ giảng bán thời gian.",
    location: "Hà Nội",
    employeeCount: "500 nhân viên",
    industry: "Giáo dục",
    address: "Ba Đình, Hà Nội",
    logo: "https://via.placeholder.com/150?text=Apollo",
  },
  {
    name: "Grab Support Vietnam",
    description: "Hỗ trợ khách hàng và vận hành kinh doanh.",
    location: "TP Hồ Chí Minh",
    employeeCount: "400 nhân viên",
    industry: "Chăm sóc khách hàng",
    address: "Quận 7, TP Hồ Chí Minh",
    logo: "https://via.placeholder.com/150?text=Grab",
  },
];

// ─── Curated jobs (24 clean part-time demo jobs) ──────────────────────────────
// [title, category, jobType, jobForm, salary, description, companyIdx, address]

const CURATED_JOBS = [
  ["Frontend Developer Intern", "IT", "Part-time", "Remote", 5000000, "Làm việc với React, TypeScript, CSS để xây dựng giao diện web.", 0, "Hà Nội"],
  ["Backend Node.js Intern", "IT", "Part-time", "Hybrid", 5500000, "Phát triển API với Express, Prisma và PostgreSQL.", 0, "Hà Nội"],
  ["QA Tester Part-time", "IT", "Part-time", "On-site", 4200000, "Kiểm thử thủ công và báo cáo lỗi phần mềm.", 0, "Hà Nội"],
  ["Data Labeling Collaborator", "IT", "Part-time", "Remote", 3500000, "Gán nhãn dữ liệu văn bản cho các mô hình AI.", 3, "Hà Nội"],
  ["AI Research Assistant", "IT", "Part-time", "Hybrid", 6000000, "Hỗ trợ thí nghiệm dữ liệu và viết báo cáo nghiên cứu.", 3, "Hà Nội"],
  ["Digital Marketing Intern", "Marketing", "Part-time", "Hybrid", 4500000, "Lập kế hoạch nội dung và hỗ trợ chiến dịch marketing.", 1, "Hà Nội"],
  ["Social Media Content Creator", "Marketing", "Part-time", "Remote", 4000000, "Tạo bài đăng và quản lý fanpage mạng xã hội.", 2, "Đà Nẵng"],
  ["E-commerce Operations Assistant", "Vận hành", "Part-time", "On-site", 3800000, "Theo dõi đơn hàng và hỗ trợ người bán hàng.", 4, "TP Hồ Chí Minh"],
  ["Customer Support Agent", "Chăm sóc khách hàng", "Part-time", "Remote", 4200000, "Xử lý yêu cầu khách hàng qua chat.", 7, "TP Hồ Chí Minh"],
  ["Teaching Assistant - English", "Giáo dục", "Part-time", "On-site", 3600000, "Hỗ trợ lớp học tiếng Anh cho trẻ em.", 6, "Hà Nội"],
  ["Math Tutor Grade 8", "Giáo dục", "Part-time", "On-site", 3000000, "Gia sư toán cho học sinh cấp 2.", 6, "Hà Nội"],
  ["Coding Class Assistant", "Giáo dục", "Part-time", "Hybrid", 4200000, "Hỗ trợ giảng dạy các lớp lập trình.", 2, "Đà Nẵng"],
  ["Barista Part-time", "F&B", "Part-time", "On-site", 3200000, "Pha chế đồ uống và hỗ trợ vận hành cửa hàng.", 5, "Hà Nội"],
  ["Store Cashier", "F&B", "Part-time", "On-site", 3000000, "Thu ngân và phục vụ khách hàng tại quầy.", 5, "Hà Nội"],
  ["Recruitment Intern", "Nhân sự", "Part-time", "Hybrid", 4000000, "Sàng lọc CV và lên lịch phỏng vấn ứng viên.", 1, "Hà Nội"],
  ["Business Analyst Intern", "IT", "Part-time", "Hybrid", 5200000, "Thu thập yêu cầu và viết user story cho sản phẩm.", 1, "Hà Nội"],
  ["UI/UX Design Intern", "Thiết kế", "Part-time", "Remote", 4800000, "Thiết kế wireframe và prototype giao diện.", 0, "Hà Nội"],
  ["Graphic Designer Part-time", "Thiết kế", "Part-time", "Remote", 4300000, "Tạo banner và hình ảnh cho mạng xã hội.", 4, "TP Hồ Chí Minh"],
  ["Sales Support Collaborator", "Kinh doanh", "Part-time", "On-site", 3500000, "Chuẩn bị danh sách khách hàng tiềm năng và hỗ trợ đội kinh doanh.", 7, "TP Hồ Chí Minh"],
  ["Logistics Coordinator Assistant", "Vận hành", "Part-time", "On-site", 3700000, "Theo dõi trạng thái giao hàng và cập nhật báo cáo.", 4, "TP Hồ Chí Minh"],
  ["DevOps Intern", "IT", "Part-time", "Hybrid", 6500000, "Hỗ trợ CI/CD và giám sát hạ tầng đám mây.", 3, "Hà Nội"],
  ["Mobile App Intern", "IT", "Part-time", "Remote", 5600000, "Xây dựng tính năng ứng dụng bằng React Native.", 0, "Hà Nội"],
  ["SEO Content Writer", "Marketing", "Part-time", "Remote", 3900000, "Viết bài chuẩn SEO và tối ưu nội dung website.", 2, "Đà Nẵng"],
  ["Community Event Assistant", "Sự kiện", "Part-time", "On-site", 3400000, "Hỗ trợ tổ chức hội thảo sinh viên và đón tiếp.", 6, "Hà Nội"],
] as const;

// ─── Review templates ─────────────────────────────────────────────────────────

const REVIEW_COMMENTS = [
  "Môi trường làm việc thân thiện, được hướng dẫn nhiệt tình.",
  "Có nhiều cơ hội học hỏi, được làm việc với công nghệ mới.",
  "Lương hợp lý, công việc thú vị và phù hợp với sinh viên.",
  "Lịch làm việc linh hoạt, phù hợp với lịch học trên trường.",
  "Có nhiều task thực tế, người hướng dẫn nhiệt tình.",
  "Nhân viên thân thiện, văn phòng sạch sẽ và thoải mái.",
  "Được tăng kiến thức thực tế, quá trình làm việc rất hay.",
  "Bổ sung nhiều kỹ năng mềm, rất xứng đáng để trải nghiệm.",
  "Hỗ trợ sinh viên rất tốt, thu nhập ổn định hàng tháng.",
  "Công ty có văn hóa lành mạnh, phù hợp với người mới bắt đầu.",
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
      name: "Nguyễn Văn A",
      email: "student@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "Hà Nội",
      phone: "0123456789",
      jobType: "Part-time",
      jobForm: "Remote",
      category: "IT",
      university: "Đại học Bách Khoa Hà Nội",
      major: "Công nghệ thông tin",
      desiredJob: "Frontend Developer",
      schedules: [
        { day: "Thứ 2", period: "sáng" },
        { day: "Thứ 4", period: "chiều" },
        { day: "Thứ 5", period: "tối" },
      ],
    },
    {
      id: "demo-student-2",
      name: "Trần Thị B",
      email: "student2@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "TP Hồ Chí Minh",
      phone: "0987654321",
      jobType: "Part-time",
      jobForm: "On-site",
      category: "Marketing",
      university: "Đại học Kinh tế TP.HCM",
      major: "Marketing",
      desiredJob: "Digital Marketing Intern",
      schedules: [
        { day: "Thứ 3", period: "chiều" },
        { day: "Thứ 6", period: "sáng" },
      ],
    },
    {
      id: "demo-student-3",
      name: "Lê Văn C",
      email: "student3@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "Đà Nẵng",
      phone: "0911223344",
      jobType: "Part-time",
      jobForm: "Hybrid",
      category: "Thiết kế",
      university: "Đại học Đà Nẵng",
      major: "Thiết kế đồ họa",
      desiredJob: "UI/UX Design Intern",
      schedules: [
        { day: "Thứ 2", period: "tối" },
        { day: "Thứ 7", period: "chiều" },
      ],
    },
    {
      id: "demo-student-4",
      name: "Phạm Thị D",
      email: "student4@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "Hà Nội",
      phone: "0977889900",
      jobType: "Part-time",
      jobForm: "Remote",
      category: "Giáo dục",
      university: "Đại học Sư phạm Hà Nội",
      major: "Sư phạm Tiếng Anh",
      desiredJob: "Teaching Assistant - English",
      schedules: [
        { day: "Thứ 3", period: "sáng" },
        { day: "Thứ 5", period: "chiều" },
      ],
    },
    {
      id: "demo-student-5",
      name: "Hoàng Văn E",
      email: "student5@example.com",
      passwordHash: demoPasswordHash,
      role: "student",
      address: "Hà Nội",
      phone: "0922334455",
      jobType: "Part-time",
      jobForm: "Hybrid",
      category: "Tài chính",
      university: "Học viện Tài chính",
      major: "Kế toán",
      desiredJob: "Finance Intern",
      schedules: [
        { day: "Thứ 4", period: "sáng" },
        { day: "Thứ 6", period: "tối" },
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
        experienceRequired: i % 3 === 0 ? "Không yêu cầu kinh nghiệm" : "Có kiến thức cơ bản",
        numberOfPeople: `${(i % 4) + 1} người`,
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
        address: parseLocation(raw.location),
        experienceRequired: experience,
        numberOfPeople: `${(i % 4) + 1} người`,
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
