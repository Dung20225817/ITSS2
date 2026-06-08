import { User, Job, Schedule } from "@prisma/client";

type UserWithRelations = User & { schedules: Schedule[] };
type JobWithRelations = Job & { schedules: Schedule[] };

export const calculateMatchScore = (user: UserWithRelations, job: JobWithRelations) => {
  let score = 0;
  const reasons: string[] = [];

  // 1. Schedule match
  const userSchedules = user.schedules || [];
  const jobSchedules = job.schedules || [];
  
  const matchingSchedules = userSchedules.filter((uSlot) =>
    jobSchedules.some((jSlot) => jSlot.day === uSlot.day && jSlot.period === uSlot.period)
  );

  if (matchingSchedules.length > 0) {
    score += 60; // Base score for schedule match
    reasons.push(`Trùng ${matchingSchedules.length} ca làm việc`);
  }

  // 2. jobType match
  if (user.jobType && job.jobType && user.jobType === job.jobType) {
    score += 15;
    reasons.push(`Phù hợp loại hình công việc (${job.jobType})`);
  }

  // 3. jobForm match
  if (user.jobForm && job.jobForm && user.jobForm === job.jobForm) {
    score += 10;
    reasons.push(`Phù hợp hình thức làm việc (${job.jobForm})`);
  }

  // 4. category match
  if (user.category && job.category && user.category === job.category) {
    score += 10;
    reasons.push(`Phù hợp lĩnh vực (${job.category})`);
  }

  // 5. desiredJob title match
  if (user.desiredJob && job.title.toLowerCase().includes(user.desiredJob.toLowerCase())) {
    score += 5;
    reasons.push(`Khớp với công việc mong muốn`);
  }

  return { score, reasons };
};
