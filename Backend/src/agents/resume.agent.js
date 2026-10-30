'use strict';

/**
 * HireMind AI — Resume Agent
 *
 * Combines traditional text extraction (pdf-parse / mammoth) and deterministic
 * profile validation with Gemini AI extraction to understand resumes from all
 * professional domains (IT, Finance, Marketing, HR, Design, Operations, etc.).
 */

const { generateWithRetry, getModel } = require('../services/gemini.client');
const { extractResumeText } = require('../services/resumeParser.service');
const {
  extractCandidateProfile,
  CandidateProfileSchema,
} = require('../services/candidateProfile.service');
const { classifyJobDomain } = require('../utils/taxonomy');
const { uniqueSkills, displaySkill, extractSkills } = require('../utils/skillCatalog');

const RESUME_AGENT_SYSTEM_PROMPT = `
You are the Resume Analysis Agent for HireMind AI.
Your task is to analyze resume text from any professional domain (IT, Finance, Marketing, HR, Sales, Design, Operations, Healthcare, Legal, Education, etc.) and extract a clean, structured JSON profile.

Return ONLY a valid JSON object with the following fields:
{
  "name": string or null,
  "email": string or null,
  "phone": string or null,
  "designation": string or null (primary professional title, e.g. "Senior Accountant", "Frontend Developer", "HR Recruiter", "SEO Specialist"),
  "country": string or null,
  "currentLocation": string or null,
  "skills": array of strings (both technical and domain-specific skills, e.g. "Financial Analysis", "React.js", "QuickBooks", "SEO", "Recruiting"),
  "experience": array of objects [{ "role": string, "company": string or null, "duration": string or null, "description": array of strings }],
  "education": array of objects [{ "degree": string, "institution": string or null, "duration": string or null, "cgpa": string or null }],
  "projects": array of objects [{ "name": string, "technologies": array of strings, "description": array of strings }],
  "summary": string (1-2 sentence overview of candidate's professional domain and core experience)
}

Do not invent or assume information that is not in the resume text.
If a field is missing, set it to null or an empty array.
`;

/**
 * Analyzes resume text using Gemini AI with fallback to deterministic parser.
 *
 * @param {string} resumeText - Raw or parsed resume text
 * @returns {Promise<object>} Structured, validated candidate profile
 */
async function analyzeResumeText(resumeText) {
  if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
    throw new Error('Resume text is required for analysis.');
  }

  const cleanText = resumeText.trim();
  const baselineProfile = extractCandidateProfile(cleanText);

  let aiProfile = null;
  let summary = null;

  try {
    const response = await generateWithRetry({
      model: getModel(),
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Please analyze this resume text and extract the structured profile:\n\n${cleanText.slice(0, 10000)}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: RESUME_AGENT_SYSTEM_PROMPT,
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const rawJson = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      aiProfile = parsed;
      summary = parsed.summary || null;
    }
  } catch (error) {
    console.warn(`[resume.agent] AI extraction encountered an error (${error.message}). Falling back to deterministic parsing.`);
  }

  // Merge AI extraction with deterministic baseline
  const mergedName = aiProfile?.name || baselineProfile.name;
  const mergedEmail = aiProfile?.email || baselineProfile.email;
  const mergedPhone = aiProfile?.phone || baselineProfile.phone;
  const mergedDesignation = aiProfile?.designation || baselineProfile.designation;
  const mergedCountry = aiProfile?.country || baselineProfile.country;
  const mergedLocation = aiProfile?.currentLocation || baselineProfile.currentLocation;

  // Combine and normalize skills from both AI and deterministic extraction
  const rawSkills = [
    ...(Array.isArray(aiProfile?.skills) ? aiProfile.skills : []),
    ...(Array.isArray(baselineProfile.skills) ? baselineProfile.skills : []),
    ...extractSkills(cleanText, mergedDesignation || ''),
  ];
  const mergedSkills = uniqueSkills(rawSkills).map(displaySkill);

  const mergedExperience = Array.isArray(aiProfile?.experience) && aiProfile.experience.length > 0
    ? aiProfile.experience
    : baselineProfile.experience;

  const mergedEducation = Array.isArray(aiProfile?.education) && aiProfile.education.length > 0
    ? aiProfile.education
    : baselineProfile.education;

  const mergedProjects = Array.isArray(aiProfile?.projects) && aiProfile.projects.length > 0
    ? aiProfile.projects
    : baselineProfile.projects;

  // Validate strictly against CandidateProfileSchema
  const validated = CandidateProfileSchema.parse({
    name: mergedName,
    email: mergedEmail,
    phone: mergedPhone,
    designation: mergedDesignation,
    currentLocation: mergedLocation,
    country: mergedCountry,
    workModePreference: 'remote',
    preferredLocations: [],
    workAuthorizationCountries: mergedCountry ? [mergedCountry] : [],
    skills: mergedSkills,
    experience: mergedExperience.map((e) => ({
      role: e.role || 'Unspecified Role',
      company: e.company || null,
      duration: e.duration || null,
      description: Array.isArray(e.description) ? e.description : [],
    })),
    education: mergedEducation.map((ed) => ({
      degree: ed.degree || 'Unspecified Degree',
      institution: ed.institution || null,
      duration: ed.duration || null,
      cgpa: ed.cgpa || null,
    })),
    projects: mergedProjects.map((p) => ({
      name: p.name || 'Project',
      technologies: Array.isArray(p.technologies) ? p.technologies.map(displaySkill) : [],
      description: Array.isArray(p.description) ? p.description : [],
    })),
  });

  // Classify candidate's professional domain
  const domain = classifyJobDomain(validated.designation || '', cleanText);

  return {
    success: true,
    profile: validated,
    domain: {
      categoryId: domain.categoryId,
      categoryName: domain.categoryName,
      roleName: domain.roleName,
    },
    characterCount: cleanText.length,
    summary: summary || `Candidate in ${domain.categoryName} with expertise in ${validated.skills.slice(0, 5).join(', ') || 'their field'}.`,
  };
}

/**
 * Handle uploaded resume file (PDF or DOCX).
 *
 * @param {object} file - Express multer file object
 * @returns {Promise<object>}
 */
async function analyzeResumeFile(file) {
  if (!file) {
    throw new Error('A resume file (PDF or DOCX) is required.');
  }

  const text = await extractResumeText(file);
  return analyzeResumeText(text);
}

module.exports = {
  analyzeResumeText,
  analyzeResumeFile,
};

