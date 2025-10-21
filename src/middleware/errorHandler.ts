import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/validator';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error
  logger.error('Error handler caught error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
  }

  // Handle axios errors
  if ((err as any).isAxiosError) {
    const axiosError = err as any;
    if (axiosError.response) {
      return res.status(axiosError.response.status).json({
        error: 'Service Error',
        message: axiosError.response.data?.message || 'Downstream service error',
      });
    } else if (axiosError.request) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Unable to reach downstream service',
      });
    }
  }

  // Default error response
  const statusCode = (err as any).statusCode || 500;
  return res.status(statusCode).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

