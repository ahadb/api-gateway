import { Router, Request, Response } from 'express';
import { apiRegistry } from '../gateway/apiRegistry';
import { type HealthResponse, ReadinessResponse, LiveResponse } from '../common/types';

export const healthRouter = Router();

healthRouter.get('/', (_: Request, res: Response) => {
  const health: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: apiRegistry.getAllServices().map(s => ({
      name: s.name,
      baseUrl: s.baseUrl,
    })),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  };

  res.json(health);
});

healthRouter.get('/ready', (_: Request, res: Response) => {
  // Add readiness checks here (database, redis, etc.)
  const ready: ReadinessResponse = {
    status: 'ready',
    timestamp: new Date().toISOString(),
  }
  res.json(ready);
});

healthRouter.get('/live', (_: Request, res: Response) => {
  // Liveness probe
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

