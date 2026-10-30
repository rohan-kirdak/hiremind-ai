'use strict';

const { recommendJobs } = require('./jobMatching.service.v4.1');
const { getJobs } = require('./jobData.service');

const jobs = getJobs({ reload: true });

console.log(`Loaded ${jobs.length} jobs from dataset for Multi-Domain Verification.\n`);

const testCandidates = [
  {
    name: '1. IT Candidate (Frontend Developer)',
    profile: {
      designation: 'Frontend Developer',
      country: 'India',
      workModePreference: 'remote',
      skills: ['JavaScript', 'TypeScript', 'React.js', 'HTML', 'CSS', 'Git', 'Tailwind CSS'],
      experience: [
        { role: 'Frontend Developer', duration: 'Jan 2022 – Present' },
      ],
      education: [{ degree: 'B.Tech in Computer Science' }],
    },
  },
  {
    name: '2. Finance Candidate (Accountant)',
    profile: {
      designation: 'Senior Accountant',
      country: 'United States',
      workModePreference: 'remote',
      skills: ['Accounting', 'Financial Analysis', 'QuickBooks', 'Auditing', 'Taxation', 'Excel', 'GAAP'],
      experience: [
        { role: 'Senior Accountant', duration: 'Jan 2020 – Present' },
      ],
      education: [{ degree: 'B.Com in Accounting', institution: 'City University' }],
    },
  },
  {
    name: '3. Marketing Candidate (SEO Executive)',
    profile: {
      designation: 'SEO Specialist',
      country: 'United Kingdom',
      workModePreference: 'remote',
      skills: ['SEO', 'SEM', 'Content Marketing', 'Google Analytics', 'PPC', 'Copywriting'],
      experience: [
        { role: 'SEO Specialist', duration: 'Mar 2021 – Present' },
      ],
      education: [{ degree: 'B.A in Marketing' }],
    },
  },
  {
    name: '4. Human Resources Candidate (HR Recruiter)',
    profile: {
      designation: 'Technical Recruiter',
      country: 'United States',
      workModePreference: 'remote',
      skills: ['Recruiting', 'Talent Acquisition', 'Onboarding', 'Employee Relations', 'HRIS', 'Applicant Tracking Systems'],
      experience: [
        { role: 'Technical Recruiter', duration: 'Jun 2021 – Present' },
      ],
      education: [{ degree: 'B.A in Human Resources Management' }],
    },
  },
  {
    name: '5. Creative Candidate (Graphic Designer)',
    profile: {
      designation: 'Graphic Designer',
      country: 'Worldwide',
      workModePreference: 'remote',
      skills: ['Graphic Design', 'UI/UX Design', 'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Prototyping'],
      experience: [
        { role: 'Graphic Designer', duration: 'Feb 2021 – Present' },
      ],
      education: [{ degree: 'Bachelor of Fine Arts (BFA)' }],
    },
  },
  {
    name: '6. Support Candidate (Customer Support Executive)',
    profile: {
      designation: 'Customer Support Specialist',
      country: 'India',
      workModePreference: 'remote',
      skills: ['Customer Support', 'Customer Success', 'Zendesk', 'Intercom', 'CRM', 'Help Scout'],
      experience: [
        { role: 'Customer Support Representative', duration: 'Aug 2021 – Present' },
      ],
      education: [{ degree: 'Bachelor of Arts' }],
    },
  },
  {
    name: '7. Non-Technical Candidate (Administrative / Operations Assistant - No Tech Skills)',
    profile: {
      designation: 'Operations Coordinator',
      country: 'United States',
      workModePreference: 'remote',
      skills: ['Project Management', 'Agile', 'Process Improvement', 'Stakeholder Management', 'Negotiation'],
      experience: [
        { role: 'Operations Coordinator', duration: 'Jan 2022 – Present' },
      ],
      education: [{ degree: 'Bachelor of Business Administration (BBA)' }],
    },
  },
];

for (const testCase of testCandidates) {
  console.log('='.repeat(75));
  console.log(`TEST PROFILE: ${testCase.name}`);
  console.log(`Designation : ${testCase.profile.designation}`);
  console.log(`Skills      : ${testCase.profile.skills.join(', ')}`);
  console.log('-'.repeat(75));

  const recommendations = recommendJobs(testCase.profile, jobs, 3);

  if (!recommendations.length) {
    console.log('  No matching jobs found in dataset.');
  } else {
    recommendations.forEach((rec, idx) => {
      console.log(`\n  [Match #${idx + 1}] Score: ${rec.matchScore}/100`);
      console.log(`  Job Title      : ${rec.title}`);
      console.log(`  Company        : ${rec.company}`);
      console.log(`  Domain         : ${rec.domain.category} (${rec.domain.role || 'General'})`);
      console.log(`  Breakdown      : Title: ${rec.scoreBreakdown.title}%, Skills: ${rec.scoreBreakdown.skills}%, Exp: ${rec.scoreBreakdown.experience}%, Loc: ${rec.scoreBreakdown.location}%`);
      console.log(`  Matched Skills : [${rec.matchedSkills.join(', ')}]`);
      console.log(`  Missing Skills : [${rec.missingSkills.join(', ')}]`);
      console.log(`  Skill Evidence : Source: ${rec.skillEvidence.source}, Level: ${rec.skillEvidence.level}, Total Job Skills: ${rec.skillEvidence.identifiedCount}`);
      console.log(`  Eligibility    : ${rec.locationEligibility.status} (${rec.locationEligibility.reason})`);
      console.log(`  Key Reasons    : ${rec.reasons.slice(0, 2).join(' | ')}`);
    });
  }
  console.log('\n');
}

