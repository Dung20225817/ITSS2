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
  location?: string | null;
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
  [{ day: "Thứ 2", period: "sáng" }, { day: "Thứ 4", period: "chiều" }],
  [{ day: "Thứ 3", period: "chiều" }, { day: "Thứ 5", period: "tối" }],
  [{ day: "Thứ 6", period: "sáng" }, { day: "Thứ 7", period: "chiều" }],
  [{ day: "Thứ 2", period: "tối" }, { day: "Thứ 5", period: "sáng" }],
  [{ day: "Thứ 3", period: "sáng" }, { day: "Thứ 6", period: "tối" }],
  [{ day: "Thứ 4", period: "sáng" }, { day: "Thứ 7", period: "tối" }],
  [{ day: "Thứ 2", period: "chiều" }, { day: "Thứ 4", period: "tối" }],
  [{ day: "Thứ 3", period: "tối" }, { day: "Thứ 5", period: "chiều" }],
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
    return "Thiết kế";
  if (/sale|kinh doanh|business development|crm|account manager/.test(text))
    return "Kinh doanh";
  if (/hr|human resource|nhan su|recruitment|talent|c&b|payroll/.test(text))
    return "Nhân sự";
  if (/teacher|tutor|giao vien|lecture|education|english|ielts|toeic/.test(text))
    return "Giáo dục";
  if (/finance|ke toan|accountant|audit|tax|investment|banking/.test(text))
    return "Tài chính";
  if (/operation|logistics|supply chain|van hanh|warehouse|procurement/.test(text))
    return "Vận hành";
  if (/customer service|cham soc|support|helpdesk|call center/.test(text))
    return "Chăm sóc khách hàng";
  if (/f&b|food|barista|waiter|cashier|bep|nha hang|coffee/.test(text))
    return "F&B";
  return "Khác";
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
  if (years) return `${years} năm kinh nghiệm`;
  if (!level) return null;
  const map: Record<string, string> = {
    Intern: "Không yêu cầu kinh nghiệm",
    Fresher: "Không yêu cầu kinh nghiệm",
    Junior: "Dưới 1 năm kinh nghiệm",
    "Mid-Level": "1-3 năm kinh nghiệm",
    Senior: "Trên 3 năm kinh nghiệm",
    Lead: "Trên 5 năm kinh nghiệm",
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
    "Thiết kế": {
      Intern: [3_500_000, 5_000_000],
      Fresher: [5_000_000, 8_000_000],
      Senior: [10_000_000, 20_000_000],
      default: [5_000_000, 10_000_000],
    },
    "Giáo dục": { default: [3_000_000, 6_000_000] },
    "F&B": { default: [3_000_000, 5_000_000] },
    "Vận hành": { default: [4_000_000, 8_000_000] },
    "Chăm sóc khách hàng": { default: [4_000_000, 7_000_000] },
    "Tài chính": {
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
    "thu 2": "Thứ 2", "thu hai": "Thứ 2",
    "thu 3": "Thứ 3", "thu ba": "Thứ 3",
    "thu 4": "Thứ 4", "thu tu": "Thứ 4",
    "thu 5": "Thứ 5", "thu nam": "Thứ 5",
    "thu 6": "Thứ 6", "thu sau": "Thứ 6",
    "thu 7": "Thứ 7", "thu bay": "Thứ 7",
    "chu nhat": "Chủ nhật", "cn": "Chủ nhật",
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
    if (!time) return "sáng";
    const h = parseInt(time.split(":")[0], 10);
    if (h < 12) return "sáng";
    if (h < 18) return "chiều";
    return "tối";
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
    const allDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
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
 * Extract a clean address string from a raw TopCV location field.
 * Input example: "- Hà Nội: 38 Phan Đình Phùng, Phường Ba Đình (quận Ba Đình cũ) - Hà Nội: ..."
 * Output: "38 Phan Đình Phùng, Phường Ba Đình, Hà Nội"
 */
export function parseLocation(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Split on " - CityName:" pattern to get the first entry
  const entries = raw.trim().split(/\s*-\s*(?=[^\s-])/);
  const first = entries.find((e) => e.includes(":")) || entries[0];
  if (!first) return null;
  const colonIdx = first.indexOf(":");
  if (colonIdx === -1) return first.trim();
  const city = first.substring(0, colonIdx).trim();
  const address = first
    .substring(colonIdx + 1)
    .replace(/\([^)]*\)/g, "")
    .trim()
    .replace(/,\s*$/, "");
  return address ? `${address}, ${city}` : city;
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
