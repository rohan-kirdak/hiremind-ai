'use strict';
const assert = require('node:assert/strict');
const { calculateJobMatch, recommendJobs, calculateLocationEligibility, getJobSkillEvidence } = require('./jobMatching.service.v4.1.js');

const profile = {
  designation: 'Software Developer | MERN Stack',
  country: 'India',
  skills: ['JavaScript', 'TypeScript', 'Node.js', 'React.js', 'Git'],
  experience: [
    { role: 'Junior Web Developer', duration: 'Feb 2025 – Mar 2025' },
    { role: 'Web Development Intern', duration: 'Jan 2025 – Feb 2025' },
  ],
  projects: [{ technologies: ['MongoDB', 'Express.js'] }],
};
const jobs = [
  { jobId: 'fullstack', title: 'Full Stack Developer', skills: ['JavaScript', 'Node.js', 'React.js'], experienceRequired: 'Entry-level', location: 'Worldwide', workMode: 'Remote' },
  { jobId: 'frontend', title: 'Frontend Software Engineer (Mid-Level)', skills: ['JavaScript','TypeScript','React.js','Postman','Workday'], experienceRequired: 'Mid-level', location: 'Worldwide', workMode: 'Remote' },
  { jobId: 'lead', title: 'Lead Full Stack Engineer', skills: ['TypeScript','React.js','Node.js','AWS'], experienceRequired: 'Senior', location: 'United States', workMode: 'Remote' },
  { jobId: 'android', title: 'Mid-Level Android Developer', skills: ['Git'], experienceRequired: 'Mid-level', location: 'Brazil', workMode: 'Remote' },
  { jobId: 'growth', title: 'AI-native Growth Hacker', skills: ['TypeScript'], experienceRequired: 'Mid-level', location: 'United States', workMode: 'Remote' },
  { jobId: 'sharepoint', title: 'SharePoint Developer', skills: ['JavaScript','React.js','Git'], experienceRequired: 'Mid-level', location: 'United States', workMode: 'Remote' },
  { jobId: 'manager', title: 'Engineering Manager', skills: ['JavaScript'], experienceRequired: 'Manager', location: 'United States', workMode: 'Remote' },
  { jobId: 'noskills', title: 'Software Developer', skills: [], description: '', experienceRequired: '' },
];
const ranked = recommendJobs(profile, jobs, 10);
const byId = Object.fromEntries(ranked.map((job) => [job.jobId, job]));

assert.equal(ranked.length, 8, 'returns every job up to limit');
assert.equal(ranked[0].jobId, 'fullstack', 'relevant entry-level full-stack job ranks first');
assert.ok(byId.android.matchScore <= 30, 'unrelated mobile job is capped');
assert.ok(byId.growth.matchScore <= 30, 'unrelated marketing job is capped');
assert.ok(byId.sharepoint.matchScore <= 30, 'unmatched enterprise platform job is capped');
assert.ok(byId.manager.matchScore <= 30, 'manager job is capped for short-experience profile');
assert.ok(byId.lead.matchScore <= 45, 'lead job receives seniority penalty');
assert.equal(byId.noskills.scoreBreakdown.skills, null, 'missing skill evidence remains unknown');
assert.equal(calculateJobMatch(null, jobs[0]).matchScore >= 0, true, 'null profile does not crash');
assert.equal(calculateJobMatch(profile, null).matchScore >= 0, true, 'null job does not crash');
assert.deepEqual(recommendJobs(profile, [], 10), [], 'empty dataset returns empty list');
assert.equal(recommendJobs(profile, jobs, 0).length, 8, 'invalid limit safely defaults');

const oneSkill = calculateJobMatch(profile, { jobId: 'one', title: 'Software Developer', skills: ['JavaScript'], experienceRequired: 'Mid-level' });
assert.equal(oneSkill.scoreBreakdown.skills, 100, 'one identified skill percentage remains mathematically accurate');
assert.equal(oneSkill.skillEvidence.level, 'limited', 'single-skill evidence is flagged as limited');
assert.ok(oneSkill.reasons.some((r) => r.includes('Limited skill evidence')), 'limited evidence warning is visible');

const inferred = getJobSkillEvidence({ skills: [], description: 'We use JavaScript and React.js in our stack.' });
assert.equal(inferred.source, 'description-inferred', 'description-inferred skills are labeled separately');
assert.equal(inferred.evidenceLevel, 'limited', 'description-inferred evidence is limited');
const structured = getJobSkillEvidence({ skills: ['JavaScript', 'React.js'], description: 'Optional: AWS, Kubernetes, Python.' });
assert.equal(structured.source, 'structured', 'structured skills are preferred over description mentions');
assert.deepEqual(structured.skills, ['javascript', 'react.js'], 'description does not inflate structured skill requirements');

const mixed = calculateJobMatch(profile, { jobId: 'mixed', title: 'Web Developer & Marketing Technology Specialist', skills: ['JavaScript'], experienceRequired: 'Senior' });
assert.ok(mixed.scoreBreakdown.title <= 60, 'mixed software-marketing title is not treated as a pure software role');
assert.ok(mixed.reasons.some((r) => r.includes('Limited skill evidence')), 'mixed role with one skill warns about limited evidence');

assert.equal(calculateLocationEligibility(profile, { location: 'United States' }).status, 'unknown', 'country label alone does not assume legal restriction');
assert.equal(calculateLocationEligibility(profile, { location: 'Worldwide' }).status, 'eligible', 'worldwide listing is eligible');
assert.equal(calculateLocationEligibility(profile, { location: 'Remote', restrictedCountries: ['India'] }).status, 'restricted', 'explicit country exclusion is respected');
assert.equal(calculateLocationEligibility(profile, { location: 'Remote', eligibleCountries: ['United States'] }).status, 'restricted', 'explicit eligible-country list is respected');
assert.equal(calculateLocationEligibility({ ...profile, country: '' }, { location: 'United States' }).status, 'unknown', 'missing candidate country remains unknown');

const tie = recommendJobs(profile, [
  { jobId: 'z', title: 'Full Stack Developer', skills: ['JavaScript'], experienceRequired: 'Entry-level' },
  { jobId: 'a', title: 'Full Stack Developer', skills: ['JavaScript'], experienceRequired: 'Entry-level' },
], 2);
assert.equal(tie[0].jobId, 'a', 'ties are deterministically sorted by title then stable id fallback');
console.log('PASS: 23 assertions');
console.log(JSON.stringify(ranked.map((j) => ({ id: j.jobId, score: j.matchScore, title: j.scoreBreakdown.title, experience: j.scoreBreakdown.experience, skills: j.scoreBreakdown.skills, evidence: j.skillEvidence.level, locationEligibility: j.locationEligibility.status })), null, 2));