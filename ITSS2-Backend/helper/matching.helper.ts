import { User, Job, Schedule } from "@prisma/client";

type UserWithRelations = User & { schedules: Schedule[] };
type JobWithRelations = Job & { schedules: Schedule[] };

const normalizeText = (value?: string | null): string => {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeDay = (day?: string | null): string => {
  const normalized = normalizeText(day);

  if (normalized.includes("chu nhat") || normalized.includes("cn")) {
    return "sun";
  }

  const dayNumber = normalized.match(/[2-7]/)?.[0];
  return dayNumber ? `thu${dayNumber}` : normalized;
};

const periodFromTime = (time?: string | null): string => {
  if (!time) return "";

  const hour = Number(time.split(":")[0]);
  if (!Number.isFinite(hour)) return "";
  if (hour < 14) return "sang";
  if (hour < 18) return "chieu";
  return "toi";
};

const normalizePeriod = (slot: Schedule): string => {
  const period = normalizeText(slot.period).replace(/^ca /, "");
  return period || periodFromTime(slot.time);
};

const schedulesMatch = (userSlot: Schedule, jobSlot: Schedule): boolean => {
  if (normalizeDay(userSlot.day) !== normalizeDay(jobSlot.day)) {
    return false;
  }

  const userPeriod = normalizePeriod(userSlot);
  const jobPeriod = normalizePeriod(jobSlot);

  return Boolean(userPeriod && jobPeriod && userPeriod === jobPeriod);
};

export const calculateMatchScore = (
  user: UserWithRelations,
  job: JobWithRelations
) => {
  let score = 0;
  const reasons: string[] = [];

  const userSchedules = user.schedules || [];
  const jobSchedules = job.schedules || [];

  const matchingSchedules = userSchedules.filter((uSlot) =>
    jobSchedules.some((jSlot) => schedulesMatch(uSlot, jSlot))
  );

  if (matchingSchedules.length > 0) {
    score += 60;
    reasons.push(`Trùng ${matchingSchedules.length} ca làm việc`);
  }

  if (user.jobType && job.jobType && user.jobType === job.jobType) {
    score += 15;
    reasons.push(`Phù hợp loại hình công việc (${job.jobType})`);
  }

  if (user.jobForm && job.jobForm && user.jobForm === job.jobForm) {
    score += 10;
    reasons.push(`Phù hợp hình thức làm việc (${job.jobForm})`);
  }

  if (user.category && job.category && user.category === job.category) {
    score += 10;
    reasons.push(`Phù hợp lĩnh vực (${job.category})`);
  }

  if (
    user.desiredJob &&
    job.title.toLowerCase().includes(user.desiredJob.toLowerCase())
  ) {
    score += 5;
    reasons.push("Khớp với công việc mong muốn");
  }

  return { score, reasons };
};
