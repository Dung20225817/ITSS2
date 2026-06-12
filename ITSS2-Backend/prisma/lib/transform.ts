/**
 * prisma/lib/transform.ts
 *
 * Shared helpers used by seed.ts to transform raw TopCV job records into
 * DB-ready values. Handles field normalisation and synthesis of missing data
 * (salary, schedule) so every seeded job is matchable and filterable.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawJob {
  url: string;
  position_title: string;
  company_name: string;
  description: string;
  requirements?: string | null;
  benefits?: string | null;
  work_hours?: string | null;
  application_instruction?: string | null;
  job_source_platform?: string | null;
  acquired_at?: string | null;
  created_at?: string | null;
  job_level?: string | null;
  job_type?: string | null;
  remote_policy?: string | null;
  years_experience?: string | null;
  education_level?: string | null;
  languages_required?: string[] | null;
  skills_required?: string[] | null;
}

export interface ScheduleSlot {
  day: string;
  period: string;
  time?: string;
}

// ─── Schedule pool (deterministic rotation used when work_hours is absent) ────

export const SCHEDULE_POOL: ScheduleSlot[][] = [
  [{ day: "Thu 2", period: "sang" }, { day: "Thu 4", period: "chieu" }],
  [{ day: "Thu 3", period: "chieu" }, { day: "Thu 5", period: "toi" }],
  [{ day: "Thu 6", period: "sang" }, { day: "Thu 7", period: "chieu" }],
  [{ day: "Thu 2", period: "toi" }, { day: "Thu 5", period: "sang" }],
  [{ day: "Thu 3", period: "sang" }, { day: "Thu 6", period: "toi" }],
  [{ day: "Thu 4", period: "sang" }, { day: "Thu 7", period: "toi" }],
  [{ day: "Thu 2", period: "chieu" }, { day: "Thu 4", period: "toi" }],
  [{ day: "Thu 3", period: "toi" }, { day: "Thu 5", period: "chieu" }],
];

// ─── Normalizers ──────────────────────────────────────────────────────────────

/**
 * Derive a category string from skills + title keywords.
 * Matches the category values used in seed.ts curated jobs.
 */
export function deriveCategory(skills: string[] | null, title: string): string {
  const text = `${title} ${(skills ?? []).join(" ")}`.toLowerCase();

  if (/python|java|\.net|node|react|vue|angular|typescript|javascript|php|ruby|go|rust|swift|kotlin|mobile|android|ios|devops|cloud|aws|gcp|azure|ci\/cd|backend|frontend|fullstack|web|software|developer|engineer|data|ai|ml|machine learning|nlp|opencv|sql|nosql|database/.test(text))
    return "IT";
  if (/marketing|seo|content|social media|digital|brand|campaign|ads|google ads|facebook ads/.test(text))
    return "Marketing";
  if (/design|ui|ux|figma|photoshop|illustrator|graphic|visual/.test(text))
    return "Thiet ke";
  if (/sale|kinh doanh|business development|crm|account manager/.test(text))
    return "Kinh doanh";
  if (/hr|human resource|nhan su|recruitment|talent|c&b|payroll/.test(text))
    return "Nhan su";
  if (/teacher|tutor|giao vien|lecture|education|english|ielts|toeic/.test(text))
    return "Giao duc";
  if (/finance|ke toan|accountant|audit|tax|investment|banking/.test(text))
    return "Tai chinh";
  if (/operation|logistics|supply chain|van hanh|warehouse|procurement/.test(text))
    return "Van hanh";
  if (/customer service|cham soc|support|helpdesk|call center/.test(text))
    return "Cham soc khach hang";
  if (/f&b|food|barista|waiter|cashier|bep|nha hang|coffee/.test(text))
    return "F&B";
  return "Khac";
}

/**
 * Normalise remote_policy → DB jobForm value.
 * Scraper: "Onsite" | "Remote" | "Hybrid" | null
 * DB:      "On-site" | "Remote" | "Hybrid"
 */
export function normalizeJobForm(policy: string | null | undefined): string | null {
  if (!policy) return null;
  if (policy.toLowerCase() === "onsite") return "On-site";
  return policy;
}

/**
 * Normalise job_type → DB jobType. Pass through; default to "Part-time" for
 * seeds that have no type so the filter can find them.
 */
export function normalizeJobType(
  jobType: string | null | undefined,
  defaultValue = "Part-time"
): string {
  return jobType ?? defaultValue;
}

/**
 * Map job_level + years_experience → human-readable experienceRequired string.
 */
export function normalizeExperience(
  level: string | null | undefined,
  years: string | null | undefined
): string | null {
  if (years) return `${years} nam kinh nghiem`;
  if (!level) return null;
  const map: Record<string, string> = {
    Intern: "Khong yeu cau kinh nghiem",
    Fresher: "Khong yeu cau kinh nghiem",
    Junior: "Duoi 1 nam kinh nghiem",
    "Mid-Level": "1-3 nam kinh nghiem",
    Senior: "Tren 3 nam kinh nghiem",
    Lead: "Tren 5 nam kinh nghiem",
  };
  return map[level] ?? level;
}

// ─── Synthesizers ─────────────────────────────────────────────────────────────

/**
 * Return a plausible monthly salary (VND) for demo purposes.
 * Uses deterministic ranges based on category and seniority level so the value
 * is consistent across seed re-runs.
 */
export function synthesizeSalary(
  category: string,
  level: string | null | undefined,
  index: number
): number {
  type Range = [number, number];
  const ranges: Record<string, Record<string, Range>> = {
    IT: {
      Intern: [3_000_000, 5_000_000],
      Fresher: [5_000_000, 8_000_000],
      Junior: [8_000_000, 14_000_000],
      "Mid-Level": [14_000_000, 20_000_000],
      Senior: [20_000_000, 35_000_000],
      Lead: [30_000_000, 50_000_000],
      default: [5_000_000, 10_000_000],
    },
    Marketing: {
      Intern: [3_000_000, 5_000_000],
      Fresher: [5_000_000, 7_000_000],
      Junior: [7_000_000, 12_000_000],
      Senior: [12_000_000, 20_000_000],
      default: [5_000_000, 9_000_000],
    },
    "Thiet ke": {
      Intern: [3_500_000, 5_000_000],
      Fresher: [5_000_000, 8_000_000],
      Senior: [10_000_000, 20_000_000],
      default: [5_000_000, 10_000_000],
    },
    "Giao duc": { default: [3_000_000, 6_000_000] },
    "F&B": { default: [3_000_000, 5_000_000] },
    "Van hanh": { default: [4_000_000, 8_000_000] },
    "Cham soc khach hang": { default: [4_000_000, 7_000_000] },
    "Tai chinh": {
      Intern: [4_000_000, 6_000_000],
      Senior: [15_000_000, 25_000_000],
      default: [7_000_000, 12_000_000],
    },
  };

  const catRanges = ranges[category] ?? {};
  const [lo, hi] =
    (level && catRanges[level]) ? catRanges[level]! :
    catRanges["default"] ? catRanges["default"]! :
    [4_000_000, 8_000_000];

  // Deterministic: pick a value in [lo, hi] using the index as seed.
  const step = Math.round((hi - lo) / 9);
  return lo + (index % 10) * step;
}

/**
 * Parse Vietnamese work_hours string into structured schedule slots.
 * Returns null when the string is missing/unrecognizable.
 */
export function parseWorkHours(
  raw: string | null | undefined
): ScheduleSlot[] | null {
  if (!raw) return null;

  const dayMap: Record<string, string> = {
    "thu 2": "Thu 2", "thu hai": "Thu 2",
    "thu 3": "Thu 3", "thu ba": "Thu 3",
    "thu 4": "Thu 4", "thu tu": "Thu 4",
    "thu 5": "Thu 5", "thu nam": "Thu 5",
    "thu 6": "Thu 6", "thu sau": "Thu 6",
    "thu 7": "Thu 7", "thu bay": "Thu 7",
    "chu nhat": "CN", "cn": "CN",
  };

  const lower = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d"); // đ → d

  // Extract time range if present
  const timeMatch = lower.match(/(\d{1,2}:\d{2})\s*[-–den]+\s*(\d{1,2}:\d{2})/);
  const timeStr = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : undefined;

  const toPeriod = (time?: string): string => {
    if (!time) return "sang";
    const h = parseInt(time.split(":")[0], 10);
    if (h < 12) return "sang";
    if (h < 18) return "chieu";
    return "toi";
  };

  const slots: ScheduleSlot[] = [];

  // Range: "Thứ 2 - Thứ 6"
  const rangeRe = /(thu\s*[2-7]|thu\s+\w+|chu\s*nhat|cn)\s*[-–]\s*(thu\s*[2-7]|thu\s+\w+|chu\s*nhat|cn)/;
  const rangeMatch = lower.match(rangeRe);
  if (rangeMatch) {
    const startKey = rangeMatch[1].replace(/\s+/g, " ").trim();
    const endKey = rangeMatch[2].replace(/\s+/g, " ").trim();
    const startDay = dayMap[startKey];
    const endDay = dayMap[endKey];
    const allDays = ["Thu 2", "Thu 3", "Thu 4", "Thu 5", "Thu 6", "Thu 7", "CN"];
    const si = allDays.indexOf(startDay);
    const ei = allDays.indexOf(endDay);
    if (si !== -1 && ei !== -1 && si <= ei) {
      for (let i = si; i <= ei; i++) {
        slots.push({ day: allDays[i]!, period: toPeriod(timeStr), ...(timeStr ? { time: timeStr } : {}) });
      }
      return slots.length > 0 ? slots : null;
    }
  }

  // Individual days
  for (const [key, val] of Object.entries(dayMap)) {
    if (lower.includes(key) && !slots.find((s) => s.day === val)) {
      slots.push({ day: val, period: toPeriod(timeStr), ...(timeStr ? { time: timeStr } : {}) });
    }
  }

  return slots.length > 0 ? slots : null;
}

/**
 * Return schedule slots for a job.
 * Uses parsed slots from work_hours when available; otherwise falls back to the
 * deterministic SCHEDULE_POOL (rotated by index) so every job has ≥1 schedule
 * row and can appear in matching results.
 */
export function resolveSchedule(index: number, parsedSlots: ScheduleSlot[] | null): ScheduleSlot[] {
  if (parsedSlots && parsedSlots.length > 0) return parsedSlots;
  return SCHEDULE_POOL[index % SCHEDULE_POOL.length]!;
}
