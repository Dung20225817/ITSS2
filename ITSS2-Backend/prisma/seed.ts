import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const companies = [
  {
    name: "FPT Software Academy",
    description: "Training and software outsourcing unit for student internships.",
    trustScore: 4.8,
    reviewCount: 42,
    location: "Ha Noi",
    employeeCount: "1000+ nhan vien",
    industry: "Cong nghe thong tin",
    address: "17 Duy Tan, Cau Giay, Ha Noi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/FPT_Software_logo.svg/960px-FPT_Software_logo.svg.png",
  },
  {
    name: "Viettel Digital",
    description: "Digital product team with flexible part-time roles.",
    trustScore: 4.7,
    reviewCount: 36,
    location: "Ha Noi",
    employeeCount: "500+ nhan vien",
    industry: "Vien thong va cong nghe",
    address: "Keangnam, Pham Hung, Nam Tu Liem, Ha Noi",
    logo: "https://static.wikia.nocookie.net/logos/images/a/a9/Viettel_Digital.png/revision/latest/scale-to-width-down/985?cb=20221216044840&path-prefix=vi",
  },
  {
    name: "Sun Edu Lab",
    description: "Education technology company focused on coding courses.",
    trustScore: 4.6,
    reviewCount: 28,
    location: "Da Nang",
    employeeCount: "200 nhan vien",
    industry: "Giao duc",
    address: "Hai Chau, Da Nang",
    logo: "https://via.placeholder.com/150?text=Sun",
  },
  {
    name: "VNPT AI Center",
    description: "AI and data team hiring interns for research support.",
    trustScore: 4.5,
    reviewCount: 31,
    location: "Ha Noi",
    employeeCount: "300 nhan vien",
    industry: "Tri tue nhan tao",
    address: "57 Huynh Thuc Khang, Dong Da, Ha Noi",
    logo: "https://vnptai.io/img/logoVNPT.png",
  },
  {
    name: "Tiki Operations",
    description: "E-commerce operations and customer experience team.",
    trustScore: 4.3,
    reviewCount: 24,
    location: "TP Ho Chi Minh",
    employeeCount: "800 nhan vien",
    industry: "Thuong mai dien tu",
    address: "Tan Binh, TP Ho Chi Minh",
    logo: "https://via.placeholder.com/150?text=Tiki",
  },
  {
    name: "Highlands Coffee Student Hub",
    description: "Flexible shift jobs for students in store operations.",
    trustScore: 4.2,
    reviewCount: 58,
    location: "Ha Noi",
    employeeCount: "1000+ nhan vien",
    industry: "Dich vu F&B",
    address: "Hoan Kiem, Ha Noi",
    logo: "https://via.placeholder.com/150?text=Highlands",
  },
  {
    name: "Apollo English",
    description: "English center with teaching assistant positions.",
    trustScore: 4.4,
    reviewCount: 47,
    location: "Ha Noi",
    employeeCount: "500 nhan vien",
    industry: "Giao duc",
    address: "Ba Dinh, Ha Noi",
    logo: "https://via.placeholder.com/150?text=Apollo",
  },
  {
    name: "Grab Support Vietnam",
    description: "Customer support and business operations roles.",
    trustScore: 4.1,
    reviewCount: 19,
    location: "TP Ho Chi Minh",
    employeeCount: "400 nhan vien",
    industry: "Van tai cong nghe",
    address: "Quan 7, TP Ho Chi Minh",
    logo: "https://via.placeholder.com/150?text=Grab",
  },
];

const schedulePool = [
  [
    { day: "Thu 2", period: "sang" },
    { day: "Thu 4", period: "chieu" },
  ],
  [
    { day: "Thu 3", period: "chieu" },
    { day: "Thu 5", period: "toi" },
  ],
  [
    { day: "Thu 6", period: "sang" },
    { day: "Thu 7", period: "chieu" },
  ],
  [
    { day: "Thu 2", period: "toi" },
    { day: "Thu 5", period: "sang" },
  ],
];

const jobs = [
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

async function main() {
  await prisma.matchResult.deleteMany();
  await prisma.review.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const createdCompanies = await Promise.all(
    companies.map((company) => prisma.company.create({ data: company }))
  );

  const user = await prisma.user.create({
    data: {
      id: "demo-student-1",
      name: "Nguyen Van A",
      email: "student@example.com",
      role: "student",
      address: "Ha Noi",
      phone: "0123456789",
      jobType: "Part-time",
      jobForm: "Remote",
      category: "IT",
      university: "Dai hoc Bach Khoa Ha Noi",
      major: "Cong nghe thong tin",
      desiredJob: "Frontend Developer",
      schedules: {
        create: [
          { day: "Thu 2", period: "sang" },
          { day: "Thu 4", period: "chieu" },
          { day: "Thu 5", period: "toi" },
        ],
      },
    },
  });

  const baseStartDate = new Date("2026-06-10T00:00:00.000Z");
  const createdJobs = [];

  for (let index = 0; index < jobs.length; index += 1) {
    const [
      title,
      category,
      jobType,
      jobForm,
      salary,
      description,
      companyIndex,
      address,
    ] = jobs[index];
    const startDate = new Date(baseStartDate);
    startDate.setDate(baseStartDate.getDate() + index);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 30 + (index % 10));

    const job = await prisma.job.create({
      data: {
        title,
        description,
        salary,
        salaryUnit: "thang",
        category,
        jobType,
        jobForm,
        companyId: createdCompanies[companyIndex].id,
        address,
        experienceRequired: index % 3 === 0 ? "Khong yeu cau kinh nghiem" : "Co kien thuc co ban",
        numberOfPeople: `${(index % 4) + 1} nguoi`,
        workingTime: schedulePool[index % schedulePool.length]
          .map((item) => `${item.day} ${item.period}`)
          .join(", "),
        startDate,
        endDate,
        schedules: {
          create: schedulePool[index % schedulePool.length],
        },
      },
    });

    createdJobs.push(job);
  }

  console.log("Seed data created:");
  console.log("Companies:", createdCompanies.length);
  console.log("User:", user.id);
  console.log("Jobs:", createdJobs.length);
  console.log("Schedules:", await prisma.schedule.count());
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
