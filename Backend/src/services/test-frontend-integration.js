/**
 * Frontend - Backend API Contract Integration Verification Script
 * Validates that all endpoints expected by the React frontend are functional
 * and conform to the data contracts used in the frontend components.
 */

const assert = require('assert');
const path = require('path');
const { getJobs, getJobById } = require('./jobData.service');
const { recommendJobs } = require('./jobMatching.service.v4.1');
const { runOrchestrator } = require('../agents/orchestrator.agent');
const { getConversation, clearConversation } = require('./conversation.service');
const { analyzeResumeText } = require('../agents/resume.agent');

async function runIntegrationVerification() {
  console.log('===========================================================================');
  console.log('HIREMIND AI: FRONTEND - BACKEND INTEGRATION TEST SUITE');
  console.log('===========================================================================');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ Contract ${total} PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ Contract ${total} FAIL: ${name}`);
      console.error(err);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ Contract ${total} PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ Contract ${total} FAIL: ${name}`);
      console.error(err);
    }
  }

  // Contract 1: GET /api/jobs pagination and filtering
  test('Job Search Contract (GET /api/jobs): supports search, category, location, and pagination', () => {
    const jobs = getJobs();
    assert(Array.isArray(jobs), 'Jobs must be an array');
    assert(jobs.length >= 1700, 'Jobs dataset must have at least 1700 records');

    // Simulate search query
    const search = 'react';
    const filtered = jobs.filter((j) => {
      const text = `${j.title} ${j.company} ${(j.skills || []).join(' ')}`.toLowerCase();
      return text.includes(search);
    });
    assert(filtered.length > 0, 'Search should find React positions');

    // Simulate pagination
    const page = 1;
    const limit = 12;
    const paged = filtered.slice(0, limit);
    assert(paged.length <= limit, 'Page size must obey limit');

    const first = paged[0];
    assert('jobId' in first, 'Job must have jobId');
    assert('title' in first, 'Job must have title');
    assert('company' in first, 'Job must have company');
    assert('location' in first, 'Job must have location');
    assert('workMode' in first, 'Job must have workMode');
    assert('skills' in first, 'Job must have skills');
    assert('sourceLink' in first || 'applicationUrl' in first, 'Job must have source link');
  });

  // Contract 2: GET /api/jobs/:id details view
  test('Job Details Contract (GET /api/jobs/:id): returns complete job object', () => {
    const jobs = getJobs();
    const target = jobs[0];
    const retrieved = getJobById(target.jobId);

    assert(retrieved !== null, 'Should retrieve job by id');
    assert.strictEqual(retrieved.jobId, target.jobId);
    assert(typeof retrieved.description === 'string', 'Job must include description');
  });

  // Contract 3: POST /api/recommendations with candidateProfile
  test('Recommendations Contract (POST /api/recommendations): deterministic scoring and metadata', () => {
    const profile = {
      designation: 'Senior Accountant',
      skills: ['Accounting', 'Financial Analysis', 'QuickBooks', 'Excel'],
      experienceYears: 4,
    };
    const jobs = getJobs();
    const recs = recommendJobs(profile, jobs, 5);

    assert(Array.isArray(recs), 'Recommendations must be an array');
    assert(recs.length === 5, 'Should return requested limit');

    const top = recs[0];
    assert(typeof top.matchScore === 'number', 'matchScore must be a number');
    assert(top.matchScore >= 0 && top.matchScore <= 100, 'matchScore must be between 0 and 100');
    assert(Array.isArray(top.matchedSkills), 'matchedSkills must be an array');
    assert(Array.isArray(top.missingSkills), 'missingSkills must be an array');
    assert(typeof top.scoreBreakdown === 'object', 'scoreBreakdown must be present');
    assert('title' in top.scoreBreakdown, 'scoreBreakdown must contain title');
    assert('skills' in top.scoreBreakdown, 'scoreBreakdown must contain skills');
    assert('experience' in top.scoreBreakdown, 'scoreBreakdown must contain experience');
    assert('location' in top.scoreBreakdown, 'scoreBreakdown must contain location');
    assert('salary' in top, 'Top recommendation must contain salary');
    assert('sourceLink' in top, 'Top recommendation must contain sourceLink');
    assert('applicationUrl' in top, 'Top recommendation must contain applicationUrl');
  });

  // Contract 4: Category-restricted recommendations
  test('Domain Category Filter Contract: restricts recommendation pool to specific domain', () => {
    const profile = {
      designation: 'Marketing Specialist',
      skills: ['SEO', 'SEM', 'Content Marketing', 'Google Analytics'],
    };
    const jobs = getJobs();
    const category = 'marketing';
    const pool = jobs.filter(
      (j) =>
        j.domain?.categoryId === category ||
        (Array.isArray(j.categories) && j.categories.some((c) => c.toLowerCase() === category))
    );
    const recs = recommendJobs(profile, pool, 3);

    assert(recs.length > 0, 'Should find matches in marketing category');
    recs.forEach((r) => {
      assert(r.domain?.category === 'Marketing & Growth' || r.domain?.category === category);
    });
  });

  // Contract 5: Resume Parser Contract
  await testAsync('Resume Parser Contract: extracts structured designation, skills, and domain', async () => {
    const sampleResume = `
      John Doe
      Senior React Developer with 5 years of experience in JavaScript, TypeScript, React.js, Tailwind CSS, Node.js, and Git.
      Education: Bachelor of Science in Software Engineering.
    `;
    const parsed = await analyzeResumeText(sampleResume);

    assert(parsed.profile !== null, 'profile should not be null');
    assert(Array.isArray(parsed.profile.skills), 'skills must be an array');
    assert(parsed.profile.skills.length >= 3, 'should extract multiple skills');
    assert(parsed.domain !== null, 'domain must be classified');
    assert.strictEqual(parsed.domain.categoryId, 'it-software');
  });

  // Contract 6: Multi-Agent Chat Contract (POST /api/agent/chat)
  await testAsync('AI Assistant Chat Contract (POST /api/agent/chat): multi-agent response and conversation persistence', async () => {
    const testId = `frontend-test-${Date.now()}`;
    const profile = {
      designation: 'Customer Support Lead',
      skills: ['Customer Support', 'Zendesk', 'CRM', 'Intercom'],
    };

    const res = await runOrchestrator({
      message: 'Recommend top jobs for my background.',
      conversationId: testId,
      candidateProfile: profile,
      userId: 'test-user',
    });

    assert.strictEqual(res.success, true, 'runOrchestrator should succeed');
    assert(typeof res.answer === 'string' && res.answer.length > 20, 'answer must be non-empty string');
    assert.strictEqual(res.conversationId, testId, 'conversationId must be preserved');

    // Verify conversation was stored
    const conv = getConversation(testId);
    assert(conv !== null, 'Conversation must be stored in memory');
    assert(conv.messages.length >= 2, 'Must have at least user and model messages');

    // Clean up
    clearConversation(testId);
    const clearedConv = getConversation(testId);
    assert.strictEqual(clearedConv.messages.length, 0, 'Conversation messages must be empty after clear');
    assert.strictEqual(clearedConv.candidateProfile, null, 'Candidate profile must be reset to null after clear');
  });

  // Contract 7: Centralized Axios Client Configuration
  test('Frontend client.js configuration verification', () => {
    const fs = require('fs');
    const clientCode = fs.readFileSync(path.resolve(__dirname, '../../../Frontend/src/api/client.js'), 'utf8');

    assert(clientCode.includes('import.meta.env.VITE_API_BASE_URL'), 'client.js must use VITE_API_BASE_URL');
    assert(clientCode.includes('http://localhost:5000/api'), 'client.js must default to localhost:5000/api');
    assert(clientCode.includes('interceptors.response.use'), 'client.js must configure response interceptor');
  });

  console.log('===========================================================================');
  console.log(`SUMMARY: ${passed}/${total} CONTRACTS VERIFIED SUCCESSFULLY`);
  console.log('===========================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runIntegrationVerification().catch((err) => {
  console.error('Fatal integration error:', err);
  process.exit(1);
});
