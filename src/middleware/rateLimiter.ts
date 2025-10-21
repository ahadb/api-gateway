import rateLimit from 'express-rate-limit';
import { envConfig } from '../utils/envConfig';
import { logger } from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: envConfig.rateLimitWindowMs,
  max: envConfig.rateLimitMaxRequests,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  },
});

// Stricter rate limiter for AI endpoints (more expensive)
export const aiRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Too many AI requests',
    message: 'Please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

