const { z } = require("zod");
const { extractSkills, SKILL_CATALOG } = require("../utils/skillCatalog");

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

// SKILL_LIST reference maintained for backward compatibility; powered by centralized catalog
const SKILL_LIST = SKILL_CATALOG;

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
    "summary",
    "technical skills",
    "skills",
    "core competencies",
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "projects",
    "education",
    "certifications",
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

  const skillsSection = findSection(lines, [
    "TECHNICAL SKILLS",
    "SKILLS",
    "CORE COMPETENCIES",
    "TECHNICAL PROFICIENCIES",
    "AREAS OF EXPERTISE",
    "PROFESSIONAL SKILLS",
    "KEY SKILLS",
    "SKILLS & EXPERTISE",
    "CORE SKILLS",
  ]);
  const skillsText = skillsSection.length > 0 ? skillsSection.join(" ") : text;
  const skills = extractSkills(skillsText);

  const summarySection = findSection(lines, [
    "PROFESSIONAL SUMMARY",
    "SUMMARY",
    "EXECUTIVE SUMMARY",
    "CAREER SUMMARY",
    "PROFILE",
    "ABOUT ME",
  ]);

  const TITLE_REGEX =
    /\b(?:developer|engineer|designer|analyst|intern|accountant|auditor|bookkeeper|recruiter|specialist|executive|coordinator|officer|consultant|representative|architect|director|lead|teacher|instructor|counsel|attorney|nurse|physician|writer|marketer|administrator|associate|scientist|strategist|assistant|manager)\b/i;

  const pipeTitleLine = lines.find(
    (line) => TITLE_REGEX.test(line) && line.includes("|"),
  );

  const headerTitleLine = lines.slice(1, 8).find((line) => {
    if (
      line.includes("@") ||
      /(?:phone|tel|mobile|http|github|linkedin|\+?\d{10})/i.test(line)
    ) {
      return false;
    }
    if (line.length > 70) return false;
    return TITLE_REGEX.test(line);
  });

  // Experience parsing: headings and bullet descriptions are heuristic.
  const experienceLines = findSection(lines, [
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "WORK HISTORY",
  ]);
  const experience = [];

  const EXP_ROLE_REGEX =
    /\b(?:intern|developer|engineer|manager|analyst|accountant|auditor|bookkeeper|recruiter|specialist|executive|coordinator|officer|consultant|representative|designer|teacher|instructor|counsel|attorney|nurse|physician|writer|marketer|administrator|associate|scientist|strategist|assistant|lead|director|head|vp)\b/i;

  const NON_ROLE_VERB_REGEX =
    /^(?:developed|built|worked|implemented|debugged|managed|led|conducted|handled|audited|prepared|reconciled|recruited|executed|coordinated|supervised|analyzed|assisted|trained|optimized|resolved|negotiated)\b/i;

  const ACTION_VERB_REGEX =
    /^(?:[•\-\*–]\s*|(?:Developed|Built|Worked|Implemented|Debugged|Created|Designed|Integrated|Maintained|Managed|Led|Conducted|Handled|Audited|Prepared|Reconciled|Recruited|Executed|Coordinated|Supervised|Analyzed|Assisted|Trained|Optimized|Resolved|Negotiated|Generated|Authored|Wrote|Published|Monitored|Reviewed|Administered|Collaborated|Directed|Delivered|Ensured|Increased|Improved|Decreased|Reduced)\b)/i;

  for (let i = 0; i < experienceLines.length; i++) {
    const line = experienceLines[i];

    if (
      EXP_ROLE_REGEX.test(line) &&
      !NON_ROLE_VERB_REGEX.test(line)
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
        !ACTION_VERB_REGEX.test(experienceLines[i + 1]) &&
        !EXP_ROLE_REGEX.test(experienceLines[i + 1])
      ) {
        company = experienceLines[i + 1];
      }

      let j = i + (company ? 2 : 1);

      while (
        j < experienceLines.length &&
        ACTION_VERB_REGEX.test(experienceLines[j])
      ) {
        description.push(experienceLines[j].replace(/^[•\-\*–]\s*/, ""));
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

  const educationLines = findSection(lines, [
    "EDUCATION",
    "ACADEMIC BACKGROUND",
    "QUALIFICATIONS",
  ]);
  const education = [];

  const degreePattern =
    /\b(?:B\s*\.?\s*E\s*\.?|B\s*\.?\s*Tech|M\s*\.?\s*E\s*\.?|M\s*\.?\s*Tech|B\s*\.?\s*Com|M\s*\.?\s*Com|B\s*\.?\s*B\s*\.?\s*A|M\s*\.?\s*B\s*\.?\s*A|B\s*\.?\s*Sc|M\s*\.?\s*Sc|B\s*\.?\s*A\b|M\s*\.?\s*A\b|LL\s*\.?\s*B|LL\s*\.?\s*M|Bachelor|Master|Diploma|Ph\s*\.?\s*D|Doctorate|Associate|CPA|Chartered\s+Accountant|CA)\b/i;

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

    const separatorMatch = line.match(/\s+[–—-]\s+|[–—]/);

    if (
      separatorMatch &&
      !/^(Built|Developed|Implemented|Integrated|Created|Deployed|Designed)\b/i.test(
        line,
      )
    ) {
      const sepIndex = line.indexOf(separatorMatch[0]);
      const name = line.slice(0, sepIndex).trim();

      if (!name || name.length > 100) continue;

      const techLine = line.slice(sepIndex + separatorMatch[0].length).trim();

      projects.push({
        name,
        technologies: extractSkills(techLine),
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
    designation:
      pipeTitleLine ||
      headerTitleLine ||
      experience[0]?.role ||
      (summarySection[0] && summarySection[0].length <= 80
        ? summarySection[0]
        : null) ||
      null,
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
