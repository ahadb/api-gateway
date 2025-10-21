import winston from 'winston';
import { envConfig } from './envConfig';
import { LogMetadata } from '../common/types';

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: envConfig.logLevel,
  format: logFormat,
  defaultMeta: { service: 'ai-gateway' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: envConfig.nodeEnv === 'development' ? consoleFormat : logFormat,
    }),
    // File transports
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Helper function to log with metadata
export const logRequest = (metadata: LogMetadata) => {
  logger.info('Request processed', metadata);
};

export const logError = (error: Error, metadata?: Partial<LogMetadata>) => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    ...metadata,
  });
};

