/**
 * Test script for verifying jobs.json path resolution and fallback mechanisms
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { getJobs, reloadJobs, resolveJobsFilePath } = require('./jobData.service');

console.log('===========================================================================');
console.log('TESTING JOBS DATASET PATH RESOLUTION & FALLBACK MECHANISMS');
console.log('===========================================================================');

// 1. Verify default resolution
const defaultPath = resolveJobsFilePath();
console.log('1. Default resolved path:', defaultPath);
assert(defaultPath !== null, 'Default path must resolve successfully');
assert(fs.existsSync(defaultPath), 'Resolved default path must exist on disk');

const jobs = getJobs({ reload: true });
console.log(`✓ Default loading succeeded: ${jobs.length} jobs loaded from dataset`);
assert(Array.isArray(jobs), 'Jobs must be an array');
assert(jobs.length >= 1700, 'Jobs count must be at least 1,700');

// 2. Verify JOBS_DATA_PATH environment variable override
const testCustomPath = path.resolve(__dirname, '../../../job-data-collector/jobs.json');
process.env.JOBS_DATA_PATH = testCustomPath;
const customResolved = resolveJobsFilePath();
console.log('2. Overridden path via JOBS_DATA_PATH:', customResolved);
assert.strictEqual(customResolved, testCustomPath, 'JOBS_DATA_PATH override must take precedence');
delete process.env.JOBS_DATA_PATH;
console.log('✓ JOBS_DATA_PATH override verified');

// 3. Verify behavior when running from inside Backend directory
const originalCwd = process.cwd();
try {
  process.chdir(path.resolve(__dirname, '../..')); // change cwd to Backend/
  console.log('3. Testing with process.cwd() set to Backend/:', process.cwd());
  const backendRootResolved = resolveJobsFilePath();
  console.log('   Resolved path from Backend/ cwd:', backendRootResolved);
  assert(backendRootResolved !== null, 'Must resolve when cwd is Backend/');
  assert(fs.existsSync(backendRootResolved), 'Path must exist on disk');
  console.log('✓ Backend-root working directory resolution verified');
} finally {
  process.chdir(originalCwd);
}

// 4. Verify behavior when dataset file is missing
const originalEnv = process.env.JOBS_DATA_PATH;
try {
  process.env.JOBS_DATA_PATH = path.resolve(__dirname, 'non-existent-jobs.json');
  console.log('4. Testing invalid JOBS_DATA_PATH fallback:');
  const fallbackResolved = resolveJobsFilePath();
  // Should fall back to candidate paths and find real jobs.json
  assert(fallbackResolved !== null, 'Should fall back to valid candidates');
  assert(fs.existsSync(fallbackResolved), 'Fallback must exist');
  console.log('✓ Invalid custom path gracefully falls back to default candidates');
} finally {
  if (originalEnv) {
    process.env.JOBS_DATA_PATH = originalEnv;
  } else {
    delete process.env.JOBS_DATA_PATH;
  }
}

console.log('===========================================================================');
console.log('ALL JOBS PATH RESOLUTION TESTS PASSED SUCCESSFULLY');
console.log('===========================================================================');
