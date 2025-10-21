import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Placeholder for authentication middleware
// You can integrate JWT, API keys, OAuth, etc.

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for health checks
  if (req.path.startsWith('/health')) {
    return next();
  }

  // Example: Check for API key in header
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('Request without API key', { path: req.path, ip: req.ip });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required',
    });
  }

  // TODO: Validate API key against database/cache
  // For now, just pass through
  next();
};

// Optional: JWT verification middleware
export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'JWT token required',
    });
  }

  try {
    // TODO: Verify JWT token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or expired token',
    });
  }
};

