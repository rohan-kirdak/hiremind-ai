'use strict';

/**
 * HireMind AI — Shared Gemini API Client
 *
 * Single centralized client for all agents (Orchestrator, Resume, Career Guidance).
 * Encapsulates client initialization, timeout handling, and bounded exponential backoff
 * for transient errors (503, 429, high demand) while rejecting non-retryable errors immediately.
 */

const { GoogleGenAI, Type } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[gemini.client] Warning: GEMINI_API_KEY is not defined in environment.');
}

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
});

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const MAX_RETRIES = 4;
const DEFAULT_TIMEOUT_MS = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getModel() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

// Errors that must NOT be retried — they will not resolve with short backoff.
function isNonRetryableError(errorText, retryAfterMs = null) {
  if (retryAfterMs && retryAfterMs > 60000) return true; // Long wait (e.g. daily quota exhaustion)
  if (
    /per day limit exceeded|free_tier_requests|quota metric.*free_tier/i.test(
      String(errorText),
    )
  ) {
    return true;
  }
  return /401|403|API_KEY_INVALID|PERMISSION_DENIED|invalid api key|INVALID_ARGUMENT|400/i.test(
    String(errorText),
  );
}

// Errors that are safe to retry after a short delay.
function isTransientError(errorText) {
  return /503|UNAVAILABLE|high demand|overloaded|429|RESOURCE_EXHAUSTED/i.test(
    String(errorText),
  );
}

/**
 * Execute Gemini generateContent with request timeout and bounded exponential backoff.
 *
 * @param {object} options
 * @param {string} [options.model]
 * @param {Array<object>} options.contents
 * @param {object} [options.config]
 * @param {number} [options.timeoutMs=30000]
 * @returns {Promise<object>} Gemini generateContent response
 */
async function generateWithRetry(options) {
  const model = options.model || getModel();
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let timerId;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(
          () => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      });

      const requestPromise = ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });

      const result = await Promise.race([requestPromise, timeoutPromise]);

      // Always clear the timer when the request succeeds.
      clearTimeout(timerId);
      return result;
    } catch (error) {
      // Always clear the timer on failure.
      clearTimeout(timerId);

      const errorText = `${error.status || ''} ${error.message || error}`;

      // Extract retry-after from headers or Google RPC errorDetails
      const rpcDelay = error.errorDetails?.find?.((d) =>
        d['@type']?.includes('RetryInfo'),
      )?.retryDelay;
      const retryAfterMs = error.headers?.get?.('retry-after')
        ? Number(error.headers.get('retry-after')) * 1000
        : rpcDelay
          ? parseFloat(rpcDelay) * 1000
          : null;

      // Never retry authentication, validation, or daily quota exhaustion errors.
      if (isNonRetryableError(errorText, retryAfterMs)) {
        throw error;
      }

      const transient = isTransientError(errorText);
      const isLastAttempt = attempt === MAX_RETRIES - 1;

      if (!transient || isLastAttempt) {
        throw error;
      }

      const backoffMs = retryAfterMs ?? Math.min(2000 * 2 ** attempt, 16000);

      console.warn(
        `[gemini.client] Transient Gemini error (${errorText.trim().slice(0, 60)}). ` +
        `Retry ${attempt + 1}/${MAX_RETRIES - 1} in ${backoffMs}ms`,
      );

      await sleep(backoffMs);
    }
  }
}

module.exports = {
  ai,
  Type,
  getModel,
  generateWithRetry,
  isNonRetryableError,
  isTransientError,
};
