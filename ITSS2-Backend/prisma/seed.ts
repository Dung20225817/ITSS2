import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create Demo Company
  const company = await prisma.company.create({
    data: {
      name: 'Tech Corp',
      description: 'A leading tech company',
      trustScore: 4.5,
      reviewCount: 1,
      location: 'Hà Nội',
      employeeCount: '100 nhân viên',
      industry: 'Giảng dạy',
      address: '74 ngõ Xã Đàn 2, Nam Đồng, Đống Đa, Hà Nội',
      logo: 'https://via.placeholder.com/150',
    },
  });

  // Create Demo User
  const user = await prisma.user.upsert({
    where: { id: 'demo-student-1' },
    update: {},
    create: {
      id: 'demo-student-1',
      name: 'Nguyen Van A',
      email: 'student@example.com',
      role: 'student',
      address: 'Hà Nội',
      phone: '0123456789',
      jobType: 'Part-Time',
      jobForm: 'Remote',
      category: 'IT',
      university: 'Đại học Bách Khoa Hà Nội',
      major: 'Công nghệ thông tin',
      desiredJob: 'Frontend Developer',
      schedules: {
        create: [
          { day: 'Thứ 2', period: 'sáng' },
          { day: 'Thứ 4', period: 'chiều' },
        ],
      },
    },
  });

  // Create Demo Job
  const job = await prisma.job.create({
    data: {
      title: 'Frontend Developer Intern',
      description: 'React, TypeScript, CSS',
      salary: 5000000,
      salaryUnit: 'tháng',
      category: 'IT',
      jobType: 'Part-time',
      jobForm: 'Remote',
      companyId: company.id,
      address: 'Hà Nội',
      experienceRequired: 'Không yêu cầu kinh nghiệm',
      numberOfPeople: '1 người',
      workingTime: 'Thứ 2, Thứ 4: 8h00 - 12h00',
      schedules: {
        create: [
          { day: 'Thứ 2', period: 'sáng' },
          { day: 'Thứ 4', period: 'chiều' },
        ],
      },
    },
  });

  console.log('Seed data created:');
  console.log('Company:', company.id);
  console.log('User:', user.id);
  console.log('Job:', job.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
