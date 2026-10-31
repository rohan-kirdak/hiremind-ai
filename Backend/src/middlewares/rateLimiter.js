'use strict';

/**
 * HireMind AI — Zero-Dependency In-Memory Rate Limiter
 * Protects expensive endpoints (Gemini AI chat, resume parsing) against
 * high-frequency requests, API quota exhaustion, and denial-of-service abuse.
 */

function createRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs) || 15 * 60 * 1000; // Default 15 minutes
  const max = Number(options.max) || 30; // Default 30 requests per window
  const message = options.message || 'Too many requests. Please try again later.';

  // Map<ip, Array<number>>
  const hits = new Map();

  // Periodic cleanup of stale entries every 5 minutes
  const cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, timestamps] of hits.entries()) {
      const active = timestamps.filter((t) => t > cutoff);
      if (active.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, active);
      }
    }
  }, 5 * 60 * 1000);

  // Unref cleanup timer so it does not prevent Node.js graceful exit
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return function rateLimiterMiddleware(req, res, next) {
    // Skip rate limiting if explicitly disabled in test environments
    if (process.env.NODE_ENV === 'test' && options.skipInTest !== false) {
      return next();
    }

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const windowStart = now - windowMs;

    const existingTimestamps = hits.get(ip) || [];
    const recentHits = existingTimestamps.filter((t) => t > windowStart);

    if (recentHits.length >= max) {
      const oldestHit = recentHits[0];
      const resetTimeMs = oldestHit + windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(resetTimeMs / 1000));

      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((oldestHit + windowMs) / 1000)));

      return res.status(429).json({
        success: false,
        message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: retryAfterSeconds,
      });
    }

    recentHits.push(now);
    hits.set(ip, recentHits);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(max - recentHits.length));

    next();
  };
}

module.exports = {
  createRateLimiter,
};
