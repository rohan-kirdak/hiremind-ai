import "dotenv/config";
import fs from "node:fs/promises";

const API_URL = "https://himalayas.app/jobs/api";
const API_KEY = process.env.HIMALAYAS_API_KEY;
const TARGET = Number(process.env.TARGET_JOBS || 1500);
const OUTPUT = new URL("./jobs.json", import.meta.url);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const KNOWN_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "HTML",
  "CSS",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "Git",
  "REST API",
  "Machine Learning",
  "Data Analysis",
  "Next.js",
  "Angular",
  "Vue.js",
  "Flutter",
  "Express.js",
  "Spring Boot",
];

// Extract known skills from job title and description.
function extractSkills(text = "") {
  return KNOWN_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, "i");

    return regex.test(text);
  });
}

// Convert API job data into our required JSON format.
function normalizeJob(job) {
  const description = job.description || "";
  const excerpt = job.excerpt || "";

  const text = [job.title || "", excerpt, description].join(" ");
  const seniority = Array.isArray(job.seniority)
    ? job.seniority.join(", ")
    : job.seniority || "Not specified";

  const rawId = String(job.guid || "");

  const idPart = rawId.startsWith("http")
    ? new URL(rawId).pathname.split("/").filter(Boolean).pop()
    : rawId;

  return {
    jobId: `himalayas_${idPart}`,
    title: job.title || "",
    company: job.companyName || "",

    location: job.locationRestrictions?.length
      ? job.locationRestrictions.join(", ")
      : "Worldwide",

    workMode: "Remote",

    experienceRequired: seniority,

    skills: extractSkills(text),

    description,

    source: "Himalayas",

    sourceLink: job.applicationLink || "",

    employmentType: job.employmentType || "Not specified",

    categories: job.categories || [],

    salary: {
      min: job.minSalary ?? null,
      max: job.maxSalary ?? null,
      currency: job.currency || null,
      period: job.salaryPeriod || null,
    },

    publishedAt: job.pubDate
      ? new Date(job.pubDate * 1000).toISOString()
      : null,

    expiresAt: job.expiryDate
      ? new Date(job.expiryDate * 1000).toISOString()
      : null,
  };
}

// Validate required job fields.
function isValidJob(job) {
  return Boolean(
    job.jobId &&
    job.title.trim() &&
    job.company.trim() &&
    job.location.trim() &&
    job.experienceRequired.trim() &&
    Array.isArray(job.skills) &&
    job.description.trim() &&
    job.sourceLink.trim(),
  );
}

// Fetch one page from the Himalayas API.
async function fetchPage(cursor) {
  const url = new URL(API_URL);

  url.searchParams.set("limit", "20");

  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  for (let attempt = 1; attempt <= 5; attempt++) {
    const headers = {
      Accept: "application/json",
    };

    if (API_KEY) {
      headers.Authorization = `Bearer ${API_KEY}`;
    }

    let response;

    try {
      response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30000),
      });
    } catch (error) {
      if (attempt === 5) {
        throw error;
      }

      console.log(`Network error. Retry ${attempt}/5...`);

      await sleep(attempt * 2000);
      continue;
    }

    if (response.status === 429) {
      if (attempt === 5) {
        throw new Error("API rate limit reached. Try again later.");
      }

      const retryAfter = Number(response.headers.get("Retry-After") || 60);

      console.log("Rate limit reached. Waiting...");

      await sleep(Math.max(1, retryAfter) * 1000);
      continue;
    }

    if (response.status >= 500 && attempt < 5) {
      await sleep(attempt * 2000);
      continue;
    }

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    return response.json();
  }

  throw new Error("Could not fetch API page.");
}

// Save jobs to jobs.json.
async function saveJobs(jobs) {
  await fs.writeFile(OUTPUT, JSON.stringify(jobs, null, 2), "utf8");
}

// Main scraping process.
async function main() {
  if (!Number.isInteger(TARGET) || TARGET < 1) {
    throw new Error("TARGET_JOBS must be a positive integer.");
  }

  // Load existing jobs, if available.
  let existing = [];

  try {
    const fileContent = await fs.readFile(OUTPUT, "utf8");

    existing = JSON.parse(fileContent);

    if (!Array.isArray(existing)) {
      throw new Error("jobs.json must contain a JSON array.");
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  // Keep existing valid-looking records by job ID.
  const jobsById = new Map(
    existing.filter((job) => job.jobId).map((job) => [job.jobId, job]),
  );

  let cursor = null;
  let page = 0;

  console.log(`Starting scraper. Existing jobs: ${jobsById.size}`);

  while (jobsById.size < TARGET) {
    const data = await fetchPage(cursor);

    page++;

    if (!Array.isArray(data.jobs)) {
      throw new Error("Unexpected API response: jobs array missing.");
    }

    let added = 0;
    let skipped = 0;

    for (const rawJob of data.jobs) {
      if (!rawJob.guid || !rawJob.title || !rawJob.companyName) {
        skipped++;
        continue;
      }

      const job = normalizeJob(rawJob);

      // Reject jobs missing required fields.
      if (!isValidJob(job)) {
        skipped++;
        continue;
      }

      // Prevent duplicate job IDs.
      if (jobsById.has(job.jobId)) {
        skipped++;
        continue;
      }

      jobsById.set(job.jobId, job);
      added++;

      if (jobsById.size >= TARGET) {
        break;
      }
    }

    // Save after every page in case the process stops.
    await saveJobs([...jobsById.values()]);

    console.log(
      `Page ${page}: received ${data.jobs.length}, ` +
        `added ${added}, skipped ${skipped}, ` +
        `total ${jobsById.size}, ` +
        `API total ${data.totalCount ?? "unknown"}`,
    );

    cursor = data.nextCursor || null;

    if (!cursor || data.jobs.length === 0) {
      console.log("Reached the end of the available feed.");
      break;
    }

    // Avoid aggressive requests.
    await sleep(1000);
  }

  console.log(`Finished. Saved ${jobsById.size} jobs to jobs.json`);

  if (jobsById.size < TARGET) {
    console.log(
      "The API did not provide enough eligible unique jobs. " +
        "No fake jobs were generated.",
    );
  }
}

main().catch((error) => {
  console.error("Scraper failed:", error.message);
  process.exitCode = 1;
});
