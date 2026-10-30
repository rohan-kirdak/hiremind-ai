'use strict';

// HireMind AI - job matching engine V4.1
// Deterministic ranking; matchScore is a ranking score, NOT probability of selection.

const {
  SKILL_CATALOG,
  SKILL_ALIASES,
  normalizeText,
  canonicalSkill,
  displaySkill,
  uniqueSkills,
  extractSkills,
} = require('../utils/skillCatalog');
const { classifyJobDomain } = require('../utils/taxonomy');

const WEIGHTS = { skills: 50, title: 25, experience: 15, location: 10 };

function extractSkillsFromDescription(description = '') {
  return uniqueSkills(extractSkills(description));
}
function getCandidateSkills(profile) {
  return uniqueSkills([
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    ...(Array.isArray(profile.projects) ? profile.projects.flatMap((p) => Array.isArray(p.technologies) ? p.technologies : []) : []),
  ]);
}

function getJobSkillEvidence(job) {
  // Keep declared skills separate from description-inferred skills. Never merge both:
  // long descriptions can contain optional, incidental, or unrelated technologies.
  const declared = uniqueSkills(Array.isArray(job.skills) ? job.skills : []);
  if (declared.length) {
    return { skills: declared, source: 'structured', evidenceLevel: declared.length === 1 ? 'limited' : 'structured' };
  }
  const inferred = uniqueSkills(extractSkillsFromDescription(job.description || ''));
  if (inferred.length) {
    return { skills: inferred, source: 'description-inferred', evidenceLevel: 'limited' };
  }
  return { skills: [], source: 'unavailable', evidenceLevel: 'none' };
}
function calculateSkillsMatch(candidateSkills, job) {
  const evidence = getJobSkillEvidence(job);
  const jobSkills = evidence.skills;
  if (!jobSkills.length) {
    return { available: false, score: null, matchedSkills: [], missingSkills: [], skillEvidence: evidence };
  }
  const matched = jobSkills.filter((s) => candidateSkills.includes(s));
  const missing = jobSkills.filter((s) => !candidateSkills.includes(s));
  return {
    available: true,
    score: (matched.length / jobSkills.length) * 100,
    matchedSkills: matched.map(displaySkill),
    missingSkills: missing.map(displaySkill),
    skillEvidence: evidence,
  };
}

function getSeniority(title) {
  const text = normalizeText(title);
  if (/\b(manager|management|director|head|vp|vice president|chief)\b/.test(text)) return 'manager';
  if (/\b(intern|internship|trainee)\b/.test(text)) return 'intern';
  if (/\b(junior|jr|entry level|entry-level|fresher|graduate|associate)\b/.test(text)) return 'junior';
  if (/\b(senior|sr|staff|principal|lead)\b/.test(text)) return 'senior';
  if (/\b(mid.level|mid level|intermediate)\b/.test(text)) return 'mid';
  return 'unspecified';
}

const ROLE_GROUPS = [
  // IT & Software
  { name: 'software', patterns: [/\bsoftware (engineer|developer)\b/, /\b(full stack|fullstack) (engineer|developer)\b/, /\b(frontend|front end|backend|back end|web) (engineer|developer)\b/, /\bapplication developer\b/, /\bprogrammer\b/] },
  { name: 'mobile', patterns: [/\b(android|ios|mobile) (developer|engineer)\b/, /\bflutter developer\b/, /\breact native developer\b/] },
  { name: 'machine-learning', patterns: [/\b(machine learning|ml|ai) (engineer|developer|researcher)\b/, /\bdata scientist\b/] },
  { name: 'data', patterns: [/\bdata (analyst|engineer|architect)\b/, /\banalytics engineer\b/, /\bbi developer\b/] },
  { name: 'devops', patterns: [/\bdevops\b/, /\bsite reliability\b/, /\bplatform engineer\b/, /\bcloud engineer\b/, /\binfrastructure engineer\b/] },
  { name: 'qa', patterns: [/\bqa engineer\b/, /\bquality assurance\b/, /\btest engineer\b/, /\bsoftware tester\b/, /\bautomation tester\b/] },
  { name: 'security', patterns: [/\bsecurity (engineer|analyst|specialist)\b/, /\bcybersecurity\b/] },
  { name: 'enterprise-platform', patterns: [/\b(salesforce|servicenow|workday|sap|sharepoint|shopify)\b/] },

  // Multi-Domain Role Groups
  { name: 'design', patterns: [/\b(ui|ux|product) designer\b/, /\bvisual designer\b/, /\bgraphic design(er)?\b/, /\bart director\b/, /\bcreative director\b/, /\billustrator\b/] },
  { name: 'finance', patterns: [/\b(accountant|accounting|finance|financial analyst|bookkeeper|auditor|payroll|controller|tax (specialist|analyst|manager))\b/] },
  { name: 'hr', patterns: [/\b(recruiter|recruiting|talent acquisition|human resources|hr |hr\b|people ops|people operations|hr generalist|hr manager)\b/] },
  { name: 'support', patterns: [/\b(technical support|it support|help desk|customer support|customer service|customer success|client support|client success)\b/] },
  { name: 'operations', patterns: [/\b(project manager|project coordinator|program manager|business analyst|operations manager|operations analyst|scrum master|agile coach)\b/] },
  { name: 'marketing', patterns: [/\b(marketing|seo|sem|growth marketer|growth hacker|content (marketing|strategist)|copywriter|paid media|ppc|social media)\b/] },
  { name: 'sales', patterns: [/\b(sales|account executive|business development|bdr|sdr|account manager|sales rep(resentative)?)\b/] },
  { name: 'healthcare', patterns: [/\b(clinical|nurse|medical|health|pharmacology|radiologist|physician|patient care)\b/] },
  { name: 'education', patterns: [/\b(teacher|tutor|instructor|faculty|professor|educator|lecturer)\b/] },
  { name: 'legal', patterns: [/\b(legal counsel|attorney|lawyer|compliance|regulatory|paralegal)\b/] },
  { name: 'engineering-nonsoftware', patterns: [/\b(mechanical|civil|electrical|hvac|structural|hardware) engineer\b/] },
  { name: 'logistics', patterns: [/\b(supply chain|logistics|procurement|inventory|warehouse)\b/] },
  { name: 'hospitality', patterns: [/\b(pilot|aviation|flight attendant|hospitality|hotel)\b/] },
  { name: 'sales-marketing', patterns: [/\b(growth hacker|growth marketer|marketing|seo|sales|account executive|business development)\b/] },
];
function getRoleFamily(title) {
  const text = normalizeText(title);
  const group = ROLE_GROUPS.find((g) => g.patterns.some((p) => p.test(text)));
  return group ? group.name : null;
}
function getCandidateTitles(profile) {
  return [profile.designation, ...(Array.isArray(profile.experience) ? profile.experience.map((e) => e && e.role) : [])]
    .filter((v) => typeof v === 'string' && v.trim());
}
function isMixedSoftwareMarketingRole(jobTitle, candidateTitle) {
  const job = normalizeText(jobTitle);
  const candidate = normalizeText(candidateTitle);
  const marketingSignals = /\b(marketing|growth|seo|google ads|meta ads|demand generation|campaign|marketing technology|martech)\b/;
  const softwareSignals = /\b(web developer|web engineer|software developer|software engineer|full stack|fullstack|frontend|front end|backend|back end)\b/;
  return softwareSignals.test(job) && marketingSignals.test(job) && !marketingSignals.test(candidate);
}
function calculateSingleTitleScore(candidateTitle, jobTitle) {
  const candidate = normalizeText(candidateTitle);
  const job = normalizeText(jobTitle);
  if (!candidate || !job) return 0;

  const platformTerms = ['salesforce', 'servicenow', 'workday', 'sap', 'sharepoint', 'shopify'];
  const jobPlatform = platformTerms.find((platform) => new RegExp(`\\b${platform}\\b`).test(job));
  if (jobPlatform && !new RegExp(`\\b${jobPlatform}\\b`).test(candidate)) return 5;

  const candidateFamily = getRoleFamily(candidate);
  const jobFamily = getRoleFamily(job);
  let score;
  if (candidateFamily && jobFamily) {
    score = candidateFamily === jobFamily ? 85 : 0;
  } else {
    const ignored = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'software', 'engineer', 'engineering', 'developer', 'development', 'specialist', 'role', 'level', 'senior', 'junior', 'intern', 'entry', 'mid', 'lead']);
    const cTokens = new Set(candidate.split(' ').filter((w) => w.length > 2 && !ignored.has(w)));
    const jTokens = job.split(' ').filter((w) => w.length > 2 && !ignored.has(w));
    const overlap = jTokens.filter((w) => cTokens.has(w)).length;
    score = jTokens.length ? (overlap / jTokens.length) * 60 : 0;
  }

  if (isMixedSoftwareMarketingRole(job, candidate)) score = Math.min(score, 60);

  const candidateSeniority = getSeniority(candidate);
  const jobSeniority = getSeniority(job);
  if (jobSeniority === 'manager' && candidateSeniority !== 'manager') score = Math.min(score, 20);
  else if (jobSeniority === 'senior' && ['intern', 'junior'].includes(candidateSeniority)) score = Math.min(score, 50);
  else if (jobSeniority === 'junior' && ['senior', 'manager'].includes(candidateSeniority)) score = Math.min(score, 70);
  return Math.round(Math.max(0, Math.min(100, score)));
}
function calculateTitleMatch(profile, job) {
  const candidateTitles = getCandidateTitles(profile);
  if (!job.title || !candidateTitles.length) return { available: false, score: null, candidateFamily: null, jobFamily: getRoleFamily(job.title) };
  const scores = candidateTitles.map((title) => calculateSingleTitleScore(title, job.title));
  const candidateFamily = getRoleFamily(profile.designation || candidateTitles[0]);
  return { available: true, score: Math.max(...scores), candidateFamily, jobFamily: getRoleFamily(job.title) };
}

function getExperienceMonths(profile) {
  const experiences = Array.isArray(profile.experience) ? profile.experience : [];
  const ranges = [];
  const months = { jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11 };
  function parseDate(value, isEnd) {
    const text = normalizeText(value);
    if (/^(present|current|now)$/.test(text)) { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); }
    const match = text.match(/\b(january|february|march|april|may|june|july|august|september|sept|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(20\d{2})\b/);
    if (match) return Number(match[2]) * 12 + months[match[1]];
    const year = text.match(/\b(20\d{2})\b/);
    if (year) return Number(year[1]) * 12 + (isEnd ? 11 : 0);
    return null;
  }
  for (const item of experiences) {
    if (!item || typeof item.duration !== 'string') continue;
    const parts = item.duration.split(/\s+[–—-]\s+/);
    if (parts.length < 2) continue;
    const start = parseDate(parts[0], false);
    const end = parseDate(parts.slice(1).join(' '), true);
    if (start !== null && end !== null && end >= start) ranges.push([start, end]);
  }
  if (!ranges.length) return null;
  ranges.sort((a, b) => a[0] - b[0]);
  let start = ranges[0][0], end = ranges[0][1], total = 0;
  for (const [nextStart, nextEnd] of ranges.slice(1)) {
    if (nextStart <= end) end = Math.max(end, nextEnd);
    else { total += end - start + 1; start = nextStart; end = nextEnd; }
  }
  total += end - start + 1;
  return Math.max(0, total);
}
function calculateExperienceMatch(profile, job) {
  const required = normalizeText(job.experienceRequired);
  if (!required) return { available: false, score: null, candidateMonths: getExperienceMonths(profile) };
  const candidateMonths = getExperienceMonths(profile);
  if (candidateMonths === null) return { available: false, score: null, candidateMonths: null };
  const years = candidateMonths / 12;
  if (/\b(manager|management|director|head|vice president|principal)\b/.test(required)) return { available: true, score: years >= 5 ? 100 : years >= 3 ? 35 : 0, candidateMonths };
  if (/\b(senior|lead|staff)\b/.test(required)) return { available: true, score: years >= 5 ? 100 : years >= 3 ? 60 : years >= 1 ? 35 : 10, candidateMonths };
  if (/\b(mid.level|mid level|intermediate)\b/.test(required)) return { available: true, score: years >= 2 ? 100 : years >= 1 ? 70 : 35, candidateMonths };
  if (/\b(intern|entry.level|entry level|junior|fresher|graduate)\b/.test(required)) return { available: true, score: years <= 2 ? 100 : years <= 4 ? 75 : 50, candidateMonths };
  const match = required.match(/(\d+)\s*\+?\s*years?/);
  if (match) { const minYears = Number(match[1]); return { available: true, score: years >= minYears ? 100 : Math.round((years / minYears) * 100), candidateMonths }; }
  return { available: false, score: null, candidateMonths };
}
function calculateLocationEligibility(profile, job) {
  const candidateCountry = normalizeText(profile.country || profile.currentCountry || profile.currentLocation || profile.location || '');
  const eligibleCountries = Array.isArray(job.eligibleCountries) ? job.eligibleCountries.map(normalizeText).filter(Boolean) : [];
  const restrictedCountries = Array.isArray(job.restrictedCountries) ? job.restrictedCountries.map(normalizeText).filter(Boolean) : [];
  const workAuthorizationCountries = Array.isArray(profile.workAuthorizationCountries) ? profile.workAuthorizationCountries.map(normalizeText).filter(Boolean) : [];
  const jobLocation = normalizeText(job.location || '');

  if (/\b(worldwide|anywhere|global)\b/.test(jobLocation)) {
    return { status: 'eligible', reason: 'Job location is listed as worldwide/global.' };
  }
  if (!candidateCountry) {
    return { status: 'unknown', reason: 'Candidate country is not specified in the profile.' };
  }
  if (restrictedCountries.includes(candidateCountry)) {
    return { status: 'restricted', reason: 'The job explicitly excludes the candidate country.' };
  }
  if (eligibleCountries.length && !eligibleCountries.includes(candidateCountry)) {
    return { status: 'restricted', reason: 'The candidate country is not in the job eligible-country list.' };
  }
  if (eligibleCountries.includes(candidateCountry)) {
    return { status: 'eligible', reason: 'The candidate country is explicitly listed as eligible.' };
  }
  // Do not infer legal/work eligibility from a country label such as "United States".
  // Work authorization can help only when the job supplies explicit country requirements.
  if (workAuthorizationCountries.includes(candidateCountry) && /\b(worldwide|anywhere|global)\b/.test(jobLocation)) {
    return { status: 'eligible', reason: 'Profile country/work authorization matches a worldwide listing.' };
  }
  return { status: 'unknown', reason: 'The listing does not provide explicit country-eligibility data.' };
}
function calculateLocationMatch(profile, job) {
  const mode = normalizeText(profile.workModePreference);
  const locations = Array.isArray(profile.preferredLocations) ? profile.preferredLocations.map(normalizeText).filter(Boolean) : [];
  if (!mode && !locations.length) return { available: false, score: null };
  const jobMode = normalizeText(job.workMode), jobLocation = normalizeText(job.location);
  const scores = [];
  if (mode) scores.push(mode === 'any' || mode === jobMode ? 100 : 0);
  if (locations.length) scores.push(locations.some((loc) => loc === 'any' || jobLocation.includes(loc) || (jobMode === 'remote' && loc === 'remote')) ? 100 : 0);
  return { available: true, score: scores.reduce((a, b) => a + b, 0) / scores.length };
}

function calculateJobMatch(profile, job) {
  // Keep the pure matching function safe for malformed/missing API input.
  profile = profile && typeof profile === 'object' ? profile : {};
  job = job && typeof job === 'object' ? job : {};
  const candidateSkills = getCandidateSkills(profile);
  const skills = calculateSkillsMatch(candidateSkills, job);
  const title = calculateTitleMatch(profile, job);
  const experience = calculateExperienceMatch(profile, job);
  const location = calculateLocationMatch(profile, job);
  const locationEligibility = calculateLocationEligibility(profile, job);
  const domain = classifyJobDomain(job.title, job.description, job.categories);
  const components = [
    { name: 'skills', result: skills, weight: WEIGHTS.skills },
    { name: 'title', result: title, weight: WEIGHTS.title },
    { name: 'experience', result: experience, weight: WEIGHTS.experience },
    { name: 'location', result: location, weight: WEIGHTS.location },
  ];
  const available = components.filter(({ result }) => result.available && Number.isFinite(result.score));
  let score = available.reduce((sum, item) => sum + (item.result.score * item.weight) / 100, 0);
  const penalties = [];

  // V4 ranking safeguards: a skill-only coincidence must not outrank a relevant role.
  if (title.available && title.score === 0) {
    score = Math.min(score, 30);
    penalties.push('Role title is not relevant to the candidate profile');
  } else if (title.available && title.score < 25) {
    score = Math.min(score, 25);
    penalties.push('Low role-title relevance capped the ranking score');
  }
  const seniority = getSeniority(job.title || job.experienceRequired || '');
  const months = experience.candidateMonths;
  if (months !== null && seniority === 'senior' && months < 24) {
    score = Math.min(score, 45);
    penalties.push('Senior/lead role requires more experience than the profile shows');
  }
  if (months !== null && seniority === 'manager' && months < 60) {
    score = Math.min(score, 30);
    penalties.push('Managerial role requires substantially more experience');
  }

  const reasons = [];
  if (skills.available) {
    reasons.push(`${skills.matchedSkills.length} of ${skills.matchedSkills.length + skills.missingSkills.length} identified job skills matched`);
    if (skills.skillEvidence.evidenceLevel === 'limited') reasons.push('Limited skill evidence: validate the full job description before treating this as a strong match');
    if (skills.skillEvidence.source === 'description-inferred') reasons.push('Skills were inferred from the description because structured job skills were unavailable');
  } else reasons.push('Job skills could not be reliably identified from the dataset');
  if (title.available) reasons.push(`Title relevance: ${Math.round(title.score)}%`);
  if (experience.available) reasons.push(`Experience relevance: ${Math.round(experience.score)}%`);
  if (location.available) reasons.push(`Location/work-mode relevance: ${Math.round(location.score)}%`);
  reasons.push(`Location eligibility: ${locationEligibility.status}`);
  reasons.push(...penalties);

  return {
    jobId: job.jobId,
    title: job.title,
    company: job.company,
    location: job.location,
    domain: {
      category: domain.categoryName,
      categoryId: domain.categoryId,
      role: domain.roleName,
    },
    workMode: job.workMode,
    experienceRequired: job.experienceRequired,
    sourceLink: job.sourceLink,
    applicationUrl: job.sourceLink || null,
    salary: job.salary || null,
    publishedAt: job.publishedAt,
    matchScore: Math.round(Math.max(0, Math.min(100, score))),
    matchedSkills: skills.matchedSkills, missingSkills: skills.missingSkills,
    skillEvidence: skills.skillEvidence ? { source: skills.skillEvidence.source, level: skills.skillEvidence.evidenceLevel, identifiedCount: skills.skillEvidence.skills.length } : { source: 'unavailable', level: 'none', identifiedCount: 0 },
    locationEligibility,
    scoreBreakdown: {
      skills: skills.score === null ? null : Math.round(skills.score),
      title: title.score === null ? null : Math.round(title.score),
      experience: experience.score === null ? null : Math.round(experience.score),
      location: location.score === null ? null : Math.round(location.score),
      weightsUsed: available.map((item) => item.name),
    },
    reasons,
  };
}
function recommendJobs(profile, jobs, limit = 10) {
  if (!profile || !Array.isArray(jobs)) return [];
  const safeLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  return jobs.filter((job) => job && typeof job === 'object')
    .map((job) => calculateJobMatch(profile, job))
    .sort((a, b) => b.matchScore - a.matchScore || (b.scoreBreakdown.title ?? -1) - (a.scoreBreakdown.title ?? -1) || String(a.title || '').localeCompare(String(b.title || '')) || String(a.jobId || '').localeCompare(String(b.jobId || '')))
    .slice(0, safeLimit);
}
module.exports = { calculateJobMatch, recommendJobs, calculateLocationEligibility, getJobSkillEvidence };