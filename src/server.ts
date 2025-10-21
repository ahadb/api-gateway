import app from './app';
import { envConfig } from './utils/envConfig';
import { logger } from './utils/logger';

const PORT = envConfig.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 AI Gateway server running on port ${PORT}`);
  logger.info(`Environment: ${envConfig.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default server;

