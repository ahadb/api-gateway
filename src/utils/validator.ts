import { Request } from 'express';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateRequest = (req: Request, requiredFields: string[]): void => {
  const missingFields = requiredFields.filter(field => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
};

export const validateQueryParams = (req: Request, requiredParams: string[]): void => {
  const missingParams = requiredParams.filter(param => {
    const value = req.query[param];
    return value === undefined || value === null || value === '';
  });

  if (missingParams.length > 0) {
    throw new ValidationError(
      `Missing required query parameters: ${missingParams.join(', ')}`
    );
  }
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

