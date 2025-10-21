import { Router, Request, Response } from 'express';
import { requestDispatcher } from '../gateway/requestDispatcher';

export const aiRouter = Router();

// Forward all /api/ai/* requests to the AI service
aiRouter.all('/*', async (req: Request, res: Response) => {
  await requestDispatcher.dispatch(req, res, 'ai');
});

