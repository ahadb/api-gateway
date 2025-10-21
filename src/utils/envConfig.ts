import dotenv from 'dotenv';

dotenv.config();

export const envConfig = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',

  // Service URLs
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  dataServiceUrl: process.env.DATA_SERVICE_URL || 'http://localhost:8001',

  // API Keys
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

// Validate required environment variables (optional for now)
// Uncomment when you actually use databases in production:
// const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL'];
// const missingEnvVars = requiredEnvVars.filter(
//   (envVar) => !process.env[envVar]
// );
// if (missingEnvVars.length > 0 && envConfig.nodeEnv === 'production') {
//   throw new Error(
//     `Missing required environment variables: ${missingEnvVars.join(', ')}`
//   );
// }

