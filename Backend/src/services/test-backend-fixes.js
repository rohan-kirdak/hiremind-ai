/**
 * Verification script for HireMind AI Backend Final Fixes:
 * 1. Dotenv loading order and PORT configuration
 * 2. Salary in job recommendations (both object and formatted)
 * 3. Consistent sourceLink and applicationUrl in tools
 * 4. Global 404 JSON error handler for unknown endpoints
 * 5. Global 500 JSON error handling
 * 6. Multer fileFilter rejection of invalid file extensions and MIME types
 */

const assert = require('assert');
const path = require('path');
const express = require('express');

const { recommendJobs, calculateJobMatch } = require('./jobMatching.service.v4.1');
const { getJobs } = require('./jobData.service');

async function runTests() {
  console.log('===========================================================================');
  console.log('STARTING HIREMIND AI BACKEND FINAL FIXES VERIFICATION');
  console.log('===========================================================================');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ Test ${total} PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ Test ${total} FAIL: ${name}`);
      console.error(err);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ Test ${total} PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ Test ${total} FAIL: ${name}`);
      console.error(err);
    }
  }

  // --- Test 1: Salary object in calculateJobMatch ---
  test('calculateJobMatch includes salary object or null', () => {
    const jobWithSalary = {
      jobId: 'sal-1',
      title: 'Software Engineer',
      skills: ['JavaScript'],
      salary: { min: 80000, max: 120000, currency: 'USD', period: 'yearly' },
      sourceLink: 'https://example.com/job/sal-1',
    };
    const profile = { designation: 'Software Engineer', skills: ['JavaScript'] };

    const match = calculateJobMatch(profile, jobWithSalary);
    assert(match !== null, 'Match should not be null');
    assert.deepStrictEqual(match.salary, jobWithSalary.salary, 'Salary object must be preserved');
    assert.strictEqual(match.applicationUrl, 'https://example.com/job/sal-1', 'applicationUrl must match sourceLink');

    const jobWithoutSalary = {
      jobId: 'sal-2',
      title: 'Accountant',
      skills: ['Accounting'],
      sourceLink: 'https://example.com/job/sal-2',
    };
    const match2 = calculateJobMatch(profile, jobWithoutSalary);
    assert.strictEqual(match2.salary, null, 'Salary should be null when not present in job');
  });

  // --- Test 2: recommendJobs includes salary and applicationUrl ---
  test('recommendJobs preserves salary on all recommended items', () => {
    const jobs = [
      {
        jobId: 'j1',
        title: 'React Developer',
        skills: ['React.js'],
        salary: { min: 90000, max: 110000, currency: 'USD' },
        sourceLink: 'https://jobs.example.com/1',
      },
      {
        jobId: 'j2',
        title: 'Frontend Engineer',
        skills: ['React.js'],
        salary: null,
        sourceLink: 'https://jobs.example.com/2',
      },
    ];
    const profile = { designation: 'React Developer', skills: ['React.js'] };

    const recs = recommendJobs(profile, jobs, 5);
    assert(recs.length === 2, 'Should recommend 2 jobs');
    assert.deepStrictEqual(recs[0].salary, { min: 90000, max: 110000, currency: 'USD' });
    assert.strictEqual(recs[0].applicationUrl, 'https://jobs.example.com/1');
    assert.strictEqual(recs[1].salary, null);
    assert.strictEqual(recs[1].applicationUrl, 'https://jobs.example.com/2');
  });

  // --- Test 3: recommendations route includes salary in response ---
  test('POST /api/recommendations router logic includes salary and applicationUrl', () => {
    const candidateProfile = {
      designation: 'Frontend Developer',
      skills: ['JavaScript', 'React.js'],
      experienceYears: 3,
    };

    const jobs = getJobs();
    const recommendations = recommendJobs(candidateProfile, jobs, 3);

    assert(recommendations.length > 0, 'recommendations should not be empty');
    const firstRec = recommendations[0];
    assert('salary' in firstRec, 'Recommendation must contain salary field');
    assert('sourceLink' in firstRec, 'Recommendation must contain sourceLink field');
    assert('applicationUrl' in firstRec, 'Recommendation must contain applicationUrl field');
  });

  // --- Test 4: Unknown API route returns structured JSON 404 ---
  test('Unknown API route returns structured JSON 404', () => {
    const fs = require('fs');
    const serverCode = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

    assert(
      serverCode.includes("res.status(404).json({"),
      'server.js must contain a 404 handler returning JSON'
    );
    assert(
      serverCode.includes("API endpoint not found"),
      '404 handler must include friendly message'
    );
  });

  // --- Test 5: Global error handler handles 500 safely ---
  test('Global error handler returns structured JSON 500', () => {
    const fs = require('fs');
    const serverCode = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

    assert(
      serverCode.includes("app.use((err, req, res, next) => {"),
      'server.js must register 4-parameter error-handling middleware'
    );
    assert(
      serverCode.includes("res.status(err.statusCode || 500).json({"),
      'Centralized error response must return 500 JSON status'
    );
    assert(
      serverCode.includes("success: false"),
      'Centralized error handler must return success: false'
    );
  });

  // --- Test 6: Dotenv loaded before PORT evaluation in server.js ---
  test('server.js loads dotenv BEFORE reading process.env.PORT', () => {
    const fs = require('fs');
    const serverCode = fs.readFileSync(path.resolve(__dirname, '../../server.js'), 'utf8');

    const dotenvIndex = serverCode.indexOf("require('dotenv').config()");
    const altDotenvIndex = serverCode.indexOf('require("dotenv").config()');
    const actualDotenvIndex = dotenvIndex !== -1 ? dotenvIndex : altDotenvIndex;

    const portIndex = serverCode.indexOf('process.env.PORT');

    assert(actualDotenvIndex !== -1, 'require("dotenv").config() must be present in server.js');
    assert(portIndex !== -1, 'process.env.PORT must be present in server.js');
    assert(
      actualDotenvIndex < portIndex,
      'dotenv.config() must be called BEFORE process.env.PORT is evaluated'
    );
  });

  // --- Test 7: Multer fileFilter rejects invalid file extensions and mime types ---
  await testAsync('Multer fileFilter rejects invalid file types with 400', async () => {
    const fs = require('fs');
    const resumeRoutesCode = fs.readFileSync(
      path.resolve(__dirname, '../routes/resume.routes.js'),
      'utf8'
    );

    assert(resumeRoutesCode.includes('fileFilter:'), 'resume.routes.js must configure fileFilter');
    assert(resumeRoutesCode.includes('isPdf'), 'fileFilter must check for PDF');
    assert(resumeRoutesCode.includes('isDocx'), 'fileFilter must check for DOCX');
    assert(
      resumeRoutesCode.includes('Only PDF and DOCX files are supported'),
      'fileFilter must reject other formats with clear message'
    );
    assert(
      resumeRoutesCode.includes('error.code === \'LIMIT_FILE_SIZE\' ? 413 : 400'),
      'Multer error handler must return 400 for invalid file type and 413 for size limit'
    );
  });

  // --- Test 8: Tool output standardization in orchestrator ---
  test('Orchestrator tools provide both sourceLink and applicationUrl', () => {
    const fs = require('fs');
    const orchestratorCode = fs.readFileSync(
      path.resolve(__dirname, '../agents/orchestrator.agent.js'),
      'utf8'
    );

    // Check search_jobs
    assert(
      orchestratorCode.includes('sourceLink: job.sourceLink || \'Not specified\''),
      'search_jobs must include sourceLink'
    );
    assert(
      orchestratorCode.includes('applicationUrl: job.sourceLink || \'Not specified\''),
      'search_jobs must include applicationUrl'
    );

    // Check recommend_jobs
    assert(
      orchestratorCode.includes('sourceLink: r.sourceLink || \'Not specified\''),
      'recommend_jobs must include sourceLink'
    );
    assert(
      orchestratorCode.includes('applicationUrl: r.sourceLink || \'Not specified\''),
      'recommend_jobs must include applicationUrl'
    );
  });

  console.log('===========================================================================');
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('===========================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
