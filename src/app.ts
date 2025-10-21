import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { gatewayRouter } from './gateway/router';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(requestLogger);
app.use(rateLimiter);

// Routes
app.use(gatewayRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

logger.info('Express app initialized');

export default app;

