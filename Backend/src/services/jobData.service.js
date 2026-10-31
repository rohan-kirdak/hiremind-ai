'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Resolves the absolute path to jobs.json across various deployment configurations:
 * 1. Explicit override via process.env.JOBS_DATA_PATH
 * 2. Standard monorepo relative to __dirname (Backend/src/services -> ../../../job-data-collector/jobs.json)
 * 3. Relative to process.cwd() when running from repository root (job-data-collector/jobs.json)
 * 4. Relative to process.cwd() when running from Backend root (../job-data-collector/jobs.json)
 * 5. Bundled fallback inside Backend/data/jobs.json
 *
 * @returns {string|null} Resolved absolute file path or null if not found
 */
function resolveJobsFilePath() {
  if (process.env.JOBS_DATA_PATH) {
    const customPath = path.resolve(process.env.JOBS_DATA_PATH);
    if (fs.existsSync(customPath)) {
      return customPath;
    }
    console.warn(
      `[jobData.service] Specified JOBS_DATA_PATH not found at: ${customPath}. Checking fallback locations.`
    );
  }

  const candidatePaths = [
    // Standard relative to __dirname: <root>/job-data-collector/jobs.json
    path.resolve(__dirname, '../../../job-data-collector/jobs.json'),
    // Relative to process.cwd() when running from repository root
    path.resolve(process.cwd(), 'job-data-collector/jobs.json'),
    // Relative to process.cwd() when running from Backend root
    path.resolve(process.cwd(), '../job-data-collector/jobs.json'),
    // Bundled fallback inside Backend/data/jobs.json
    path.resolve(__dirname, '../../data/jobs.json'),
    path.resolve(process.cwd(), 'data/jobs.json'),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (_) {
      // Continue checking next candidate
    }
  }

  return null;
}

let jobsFilePath = resolveJobsFilePath() || path.resolve(__dirname, '../../../job-data-collector/jobs.json');
let cachedJobs = null;
let lastLoadedAt = null;

/**
 * Loads and validates the jobs dataset from disk.
 * Returns cached in-memory array if already loaded, avoiding repeated disk I/O.
 *
 * @param {object} options
 * @param {boolean} [options.reload=false] Force reload from disk
 * @returns {Array<object>} Array of job objects
 */
function getJobs(options = {}) {
  const { reload = false } = options;

  if (cachedJobs && !reload) {
    return cachedJobs;
  }

  try {
    const resolvedPath = resolveJobsFilePath();

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      const candidates = [
        process.env.JOBS_DATA_PATH ? path.resolve(process.env.JOBS_DATA_PATH) : null,
        path.resolve(__dirname, '../../../job-data-collector/jobs.json'),
        path.resolve(process.cwd(), 'job-data-collector/jobs.json'),
        path.resolve(process.cwd(), '../job-data-collector/jobs.json'),
      ].filter(Boolean);

      console.warn(
        `[jobData.service] WARNING: jobs.json dataset could not be found! ` +
        `Checked locations: ${candidates.join(', ')}. Initializing with empty list.`
      );
      cachedJobs = [];
      lastLoadedAt = new Date();
      return cachedJobs;
    }

    jobsFilePath = resolvedPath;
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    const parsed = JSON.parse(fileContent);

    if (!Array.isArray(parsed)) {
      throw new Error(`[jobData.service] Invalid dataset: expected JSON array in ${resolvedPath}`);
    }

    cachedJobs = parsed;
    lastLoadedAt = new Date();
    return cachedJobs;
  } catch (error) {
    console.error(`[jobData.service] Failed to load jobs dataset: ${error.message}`);
    // If a cached version already exists, preserve it to prevent application outage
    if (cachedJobs && Array.isArray(cachedJobs)) {
      console.warn('[jobData.service] Preserving previous in-memory jobs cache after load failure.');
      return cachedJobs;
    }
    throw error;
  }
}

/**
 * Explicitly clears and reloads the jobs dataset from disk.
 * Useful when the scraper completes or new data is added.
 *
 * @returns {Array<object>} Freshly loaded jobs array
 */
function reloadJobs() {
  return getJobs({ reload: true });
}

/**
 * Retrieves a single job by its ID from the cached dataset.
 *
 * @param {string|number} jobId
 * @returns {object|null} Job object or null if not found
 */
function getJobById(jobId) {
  const jobs = getJobs();
  const searchId = String(jobId);
  return jobs.find((job) => String(job.jobId) === searchId) || null;
}

/**
 * Returns cache metadata (count, lastLoadedAt, filePath).
 */
function getCacheStatus() {
  return {
    isLoaded: cachedJobs !== null,
    totalJobs: cachedJobs ? cachedJobs.length : 0,
    lastLoadedAt,
    filePath: jobsFilePath,
  };
}

module.exports = {
  getJobs,
  reloadJobs,
  getJobById,
  getCacheStatus,
  jobsFilePath,
  resolveJobsFilePath,
};

