'use strict';

const fs = require('fs');
const path = require('path');

const jobsFilePath = path.resolve(
  __dirname,
  '../../../job-data-collector/jobs.json'
);

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
    if (!fs.existsSync(jobsFilePath)) {
      console.warn(`[jobData.service] Warning: jobs file not found at ${jobsFilePath}. Initializing with empty list.`);
      cachedJobs = [];
      lastLoadedAt = new Date();
      return cachedJobs;
    }

    const fileContent = fs.readFileSync(jobsFilePath, 'utf8');
    const parsed = JSON.parse(fileContent);

    if (!Array.isArray(parsed)) {
      throw new Error(`[jobData.service] Invalid dataset: expected JSON array in ${jobsFilePath}`);
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
};

