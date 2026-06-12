/**
 * import-jobs.ts
 *
 * Imports real job postings from final_jobs.json into the PostgreSQL database.
 * Run from ITSS2-Backend/:  npm run db:import
 *
 * The file path defaults to <repo-root>/final_jobs.json but can be overridden:
 *   DB_IMPORT_FILE=/path/to/jobs.json npm run db:import
 *
 * Idempotent: companies are upserted by name; jobs are upserted by
 * (companyId + title). Re-running the script will not create duplicates.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────────────────────────

interface RawJob {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive a category from skills and title.
 * Mirrors the categories used in seed.ts.
 */
function deriveCategory(skills: string[] | null, title: string): string {
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
 * Normalise remote_policy from scraper to the values used in the DB.
 * Scraper: "Onsite" | "Remote" | "Hybrid" | null
 * DB jobForm: "On-site" | "Remote" | "Hybrid" | null
 */
function normalizeJobForm(policy: string | null | undefined): string | null {
  if (!policy) return null;
  if (policy.toLowerCase() === "onsite") return "On-site";
  return policy; // "Remote" and "Hybrid" match already
}

/**
 * Normalise job_type → jobType DB values.
 * Scraper: "Full-time" | "Contract" | null
 * DB: "Part-time" | "Full-time" | "Contract"
 */
function normalizeJobType(jobType: string | null | undefined): string | null {
  if (!jobType) return null;
  return jobType;
}

/**
 * Map job_level to a human-readable experienceRequired string.
 */
function normalizeExperience(
  level: string | null | undefined,
  years: string | null | undefined
): string | null {
  if (years) return `${years} năm kinh nghiệm`;
  if (!level) return null;
  const map: Record<string, string> = {
    Intern: "Không yêu cầu kinh nghiệm",
    Fresher: "Không yêu cầu kinh nghiệm",
    Junior: "Dưới 1 năm kinh nghiệm",
    "Mid-Level": "1–3 năm kinh nghiệm",
    Senior: "Trên 3 năm kinh nghiệm",
    Lead: "Trên 5 năm kinh nghiệm",
  };
  return map[level] ?? level;
}

/**
 * Parse a Vietnamese work_hours string into a (workingTime, Schedule[]) pair.
 *
 * Patterns handled:
 *   "Thứ 2 - Thứ 6 (từ 08:00 đến 17:00)"  → Mon–Fri morning/afternoon slots
 *   "Thứ 7, Chủ nhật"                       → Sat/Sun
 *   null / unrecognised                      → empty array
 */
function parseWorkHours(
  raw: string | null | undefined
): { schedules: Array<{ day: string; period: string; time?: string }>; workingTime: string } {
  const empty = { schedules: [], workingTime: raw ?? "" };
  if (!raw) return empty;

  const dayMap: Record<string, string> = {
    "thứ 2": "Thu 2",
    "thứ hai": "Thu 2",
    "thứ 3": "Thu 3",
    "thứ ba": "Thu 3",
    "thứ 4": "Thu 4",
    "thứ tư": "Thu 4",
    "thứ 5": "Thu 5",
    "thứ năm": "Thu 5",
    "thứ 6": "Thu 6",
    "thứ sáu": "Thu 6",
    "thứ 7": "Thu 7",
    "thứ bảy": "Thu 7",
    "chủ nhật": "CN",
    "cn": "CN",
  };

  const lower = raw.toLowerCase();
  const schedules: Array<{ day: string; period: string; time?: string }> = [];

  // Extract time range if present: "08:00" / "17:00"
  const timeMatch = lower.match(/(\d{1,2}:\d{2})\s*[-–đến]+\s*(\d{1,2}:\d{2})/);
  const timeStr = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : undefined;

  // Determine period from time
  const period = (time?: string): string => {
    if (!time) return "sang";
    const hour = parseInt(time.split(":")[0], 10);
    if (hour < 12) return "sang";
    if (hour < 18) return "chieu";
    return "toi";
  };

  // Range pattern: "Thứ 2 - Thứ 6"
  const rangeMatch = lower.match(
    /(thứ\s*\d|thứ\s+\w+|chủ nhật|cn)\s*[-–]\s*(thứ\s*\d|thứ\s+\w+|chủ nhật|cn)/
  );
  if (rangeMatch) {
    const startDay = dayMap[rangeMatch[1].trim()];
    const endDay = dayMap[rangeMatch[2].trim()];
    const allDays = ["Thu 2", "Thu 3", "Thu 4", "Thu 5", "Thu 6", "Thu 7", "CN"];
    const si = allDays.indexOf(startDay);
    const ei = allDays.indexOf(endDay);
    if (si !== -1 && ei !== -1 && si <= ei) {
      for (let i = si; i <= ei; i++) {
        schedules.push({ day: allDays[i], period: period(timeStr), ...(timeStr ? { time: timeStr } : {}) });
      }
      return { schedules, workingTime: raw };
    }
  }

  // List pattern: match individual days
  for (const [key, val] of Object.entries(dayMap)) {
    if (lower.includes(key)) {
      if (!schedules.find((s) => s.day === val)) {
        schedules.push({ day: val, period: period(timeStr), ...(timeStr ? { time: timeStr } : {}) });
      }
    }
  }

  return { schedules, workingTime: raw };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Resolve data file path
  const defaultPath = path.resolve(__dirname, "../../final_jobs.json");
  const filePath = process.env.DB_IMPORT_FILE ?? defaultPath;

  if (!fs.existsSync(filePath)) {
    console.error(`\n❌  File not found: ${filePath}`);
    console.error(`   Place final_jobs.json at the repo root, or set DB_IMPORT_FILE env var.\n`);
    process.exit(1);
  }

  console.log(`\nReading: ${filePath}`);
  const raw: RawJob[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`Found ${raw.length} records\n`);

  let companiesCreated = 0;
  let companiesUpdated = 0;
  let jobsCreated = 0;
  let jobsUpdated = 0;
  let schedulesCreated = 0;
  let errors = 0;

  // ── Process each job ───────────────────────────────────────────────────────
  for (const item of raw) {
    try {
      // 1. Upsert Company (keyed by name)
      const existing = await prisma.company.findFirst({
        where: { name: item.company_name },
      });

      let company;
      if (existing) {
        company = existing;
        companiesUpdated++;
      } else {
        company = await prisma.company.create({
          data: {
            name: item.company_name,
            description: null,
            trustScore: 0.0,
            reviewCount: 0,
            location: null,
            industry: deriveCategory(item.skills_required ?? null, item.position_title),
          },
        });
        companiesCreated++;
      }

      // 2. Build job description (merge description + requirements)
      const fullDesc = [item.description, item.requirements]
        .filter(Boolean)
        .join("\n\n---\n\n**Yêu cầu:**\n")
        .trim();

      // 3. Parse schedule
      const { schedules, workingTime } = parseWorkHours(item.work_hours);

      // 4. Upsert Job (keyed by companyId + title)
      const existingJob = await prisma.job.findFirst({
        where: {
          companyId: company.id,
          title: item.position_title,
        },
      });

      let job;
      if (existingJob) {
        job = await prisma.job.update({
          where: { id: existingJob.id },
          data: {
            description: fullDesc || undefined,
            category: deriveCategory(item.skills_required ?? null, item.position_title),
            jobType: normalizeJobType(item.job_type),
            jobForm: normalizeJobForm(item.remote_policy),
            workingTime: workingTime || undefined,
            experienceRequired: normalizeExperience(item.job_level, item.years_experience),
            startDate: item.created_at ? new Date(item.created_at) : undefined,
          },
        });
        jobsUpdated++;
      } else {
        job = await prisma.job.create({
          data: {
            title: item.position_title,
            description: fullDesc || undefined,
            companyId: company.id,
            salary: null, // TopCV scraper doesn't capture salary
            category: deriveCategory(item.skills_required ?? null, item.position_title),
            jobType: normalizeJobType(item.job_type),
            jobForm: normalizeJobForm(item.remote_policy),
            workingTime: workingTime || undefined,
            experienceRequired: normalizeExperience(item.job_level, item.years_experience),
            startDate: item.created_at ? new Date(item.created_at) : null,
            endDate: null,
            address: null,
            salaryUnit: null,
            numberOfPeople: null,
          },
        });
        jobsCreated++;

        // 5. Create Schedule rows for the new job
        if (schedules.length > 0) {
          await prisma.schedule.createMany({
            data: schedules.map((s) => ({
              jobId: job.id,
              day: s.day,
              period: s.period,
              time: s.time ?? null,
            })),
          });
          schedulesCreated += schedules.length;
        }
      }
    } catch (err) {
      errors++;
      console.error(`  ✗  Error on "${item.position_title}" @ "${item.company_name}":`, err);
    }
  }

  console.log("\n✅  Import complete");
  console.log(`   Companies  created: ${companiesCreated}  (already existed: ${companiesUpdated})`);
  console.log(`   Jobs       created: ${jobsCreated}  (updated: ${jobsUpdated})`);
  console.log(`   Schedules  created: ${schedulesCreated}`);
  if (errors > 0) console.warn(`   ⚠  Errors: ${errors}`);
  console.log();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
