import { Router } from 'express';
import { aiRouter } from '../routes/aiRouter';
import { dataRouter } from '../routes/dataRouter';
import { healthRouter } from '../routes/healthRouter';

export const gatewayRouter = Router();

// Mount route handlers
gatewayRouter.use('/health', healthRouter);
gatewayRouter.use('/api/ai', aiRouter);
gatewayRouter.use('/api/data', dataRouter);

// Root route
gatewayRouter.get('/', (_, res) => {
  res.json({
    service: 'AI Gateway',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      ai: '/api/ai/*',
      data: '/api/data/*',
    },
  });
});

