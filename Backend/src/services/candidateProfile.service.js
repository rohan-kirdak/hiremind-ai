const { z } = require("zod");

const CandidateProfileSchema = z.object({
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  designation: z.string().nullable(),
    currentLocation: z.string().nullable().default(null),
  country: z.string().nullable().default(null),
  workModePreference: z.string().nullable().default(null),
  preferredLocations: z.array(z.string()).default([]),
  workAuthorizationCountries: z.array(z.string()).default([]),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string().nullable(),
      duration: z.string().nullable(),
      description: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string().nullable(),
      duration: z.string().nullable(),
      cgpa: z.string().nullable(),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      technologies: z.array(z.string()),
      description: z.array(z.string()),
    }),
  ),
});

const SKILL_LIST = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "SQL",
  "Node.js",
  "Express.js",
  "React.js",
  "HTML5",
  "CSS3",
  "Tailwind CSS",
  "REST APIs",
  "WebSockets",
  "Socket.IO",
  "JWT",
  "MongoDB",
  "MySQL",
  "Redis",
  "OpenAI API",
  "Prompt Engineering",
  "Docker",
  "Git",
  "GitHub Actions",
  "Postman",
  "Vitest",
  "BullMQ",
  "MERN",
];

function cleanLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function findSection(lines, headings) {
  const start = lines.findIndex((line) =>
    headings.some((heading) => {
      const normalized = line.replace(/[:]/g, "").trim().toLowerCase();
      return normalized === heading.toLowerCase();
    }),
  );

  if (start === -1) return [];

  const endHeadings = [
    "professional summary",
    "technical skills",
    "experience",
    "projects",
    "education",
    "publications, leadership & achievements",
    "publications",
    "achievements",
  ];

  const result = [];

  for (let i = start + 1; i < lines.length; i++) {
    const current = lines[i].replace(/[:]/g, "").trim().toLowerCase();

    if (endHeadings.includes(current)) break;

    result.push(lines[i]);
  }

  return result;
}
function extractCurrentLocation(lines) {
  for (const line of lines.slice(0, 15)) {
    const labeled = line.match(
      /^(?:current\s+)?(?:location|address)\s*[:|-]\s*(.+)$/i
    );

    const basedIn = line.match(/^based\s+in\s+(.+)$/i);
    const location = labeled?.[1] || basedIn?.[1];

    if (location && location.trim().length <= 100) {
      return location.trim();
    }
  }

  return null;
}

function extractCountry(lines) {
  const location = extractCurrentLocation(lines);
  if (!location) return null;

  const countries = [
    "India",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Singapore",
    "United Arab Emirates",
  ];

  return countries.find((country) => {
    const escaped = country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(location);
  }) || null;
}

function extractCandidateProfile(text) {
  const lines = cleanLines(text);

  const firstLine = lines[0] || null;

  const email =
    text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] || null;

  const phone = text.match(/(?:\+?\d{1,3}[- ]?)?\d{10}\b/)?.[0] || null;

  const skillsSection = findSection(lines, ["TECHNICAL SKILLS"]);
  const skillsText = skillsSection.join(" ");

  const skills = SKILL_LIST.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(skillsText);
  });

  const summarySection = findSection(lines, ["PROFESSIONAL SUMMARY"]);
  const designationLine = lines.find(
    (line) =>
      /developer|engineer|designer|analyst|intern/i.test(line) &&
      line.includes("|"),
  );

  // Experience parsing: headings and bullet descriptions are heuristic.
  const experienceLines = findSection(lines, ["EXPERIENCE"]);
  const experience = [];

  for (let i = 0; i < experienceLines.length; i++) {
    const line = experienceLines[i];

    if (
      /intern|developer|engineer|manager|analyst/i.test(line) &&
      !/developed|built|worked|implemented|debugged/i.test(line)
    ) {
      const role = line
        .replace(
          /\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b.*$/i,
          "",
        )
        .trim();

      const durationMatch = line.match(
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}\s*[–-]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+)?(?:\d{4}|Present)/i,
      );

      const description = [];
      let company = null;

      if (
        experienceLines[i + 1] &&
        !/developed|built|worked|implemented|debugged/i.test(
          experienceLines[i + 1],
        )
      ) {
        company = experienceLines[i + 1];
      }

      let j = i + 1;

      while (
        j < experienceLines.length &&
        /^(Developed|Built|Worked|Implemented|Debugged|Created|Designed|Integrated|Maintained)/i.test(
          experienceLines[j],
        )
      ) {
        description.push(experienceLines[j]);
        j++;
      }

      experience.push({
        role,
        company,
        duration: durationMatch?.[0] || null,
        description,
      });
    }
  }

  const educationLines = findSection(lines, ["EDUCATION"]);
  const education = [];

  const degreePattern =
    /\b(?:B\s*\.?\s*E\s*\.?|B\s*\.?\s*Tech|M\s*\.?\s*E\s*\.?|M\s*\.?\s*Tech|Bachelor|Master|Diploma|Ph\s*\.?\s*D)\b/i;

  const institutionPattern = /\b(?:college|university|institute)\b/i;

  for (const line of educationLines) {
    const durationMatch = line.match(
      /\b20\d{2}\s*[–-]\s*(?:20\d{2}|Present)\b/i,
    );

    const cgpaMatch = line.match(
      /\bCGPA\s*:?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)/i,
    );

    const duration = durationMatch?.[0] || null;
    const cgpa = cgpaMatch?.[1]?.replace(/\s+/g, " ") || null;

    if (degreePattern.test(line)) {
      // Degree, duration ani CGPA ekach line madhun extract kara.
      const degree = line
        .replace(durationMatch?.[0] || "", "")
        .replace(/\bCGPA\s*:?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?/i, "")
        .replace(/[(),|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      education.push({
        degree,
        institution: institutionPattern.test(line) ? line : null,
        duration,
        cgpa,
      });
    } else if (institutionPattern.test(line)) {
      // College name previous degree sobat attach kara.
      if (education.length > 0) {
        const lastEducation = education[education.length - 1];

        if (!lastEducation.institution) {
          lastEducation.institution = line;
        }
      }
    }
  }

  const projectLines = findSection(lines, ["PROJECTS"]);
  const projects = [];

  for (let i = 0; i < projectLines.length; i++) {
    const line = projectLines[i];

    if (
      /[–-]/.test(line) &&
      !/^(Built|Developed|Implemented|Integrated|Created|Deployed|Designed)\b/i.test(
        line,
      )
    ) {
      const parts = line.split(/[–-]/);
      const name = parts[0].trim();

      if (!name || name.length > 100) continue;

      const techLine = parts.slice(1).join("-").trim();

      projects.push({
        name,
        technologies: SKILL_LIST.filter((skill) => {
          const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`\\b${escaped}\\b`, "i").test(techLine);
        }),
        description: [],
      });
    } else if (
      /^(Built|Developed|Implemented|Integrated|Created|Deployed|Designed)/i.test(
        line,
      ) &&
      projects.length > 0
    ) {
      projects[projects.length - 1].description.push(line);
    }
  }

  return CandidateProfileSchema.parse({
    name:
      firstLine && !/resume|curriculum vitae/i.test(firstLine)
        ? firstLine
        : null,
    email,
    phone,
    designation: designationLine || summarySection[0] || null,
    skills,
    experience,
    education,
    projects,
    currentLocation: extractCurrentLocation(lines),
country: extractCountry(lines),
workModePreference: null,
preferredLocations: [],
workAuthorizationCountries: [],
  });
}

module.exports = {
  CandidateProfileSchema,
  extractCandidateProfile,
};
