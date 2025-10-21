import { Router, Request, Response } from 'express';
import { requestDispatcher } from '../gateway/requestDispatcher';

export const dataRouter = Router();

// Forward all /api/data/* requests to the Data/BI service
dataRouter.all('/*', async (req: Request, res: Response) => {
  await requestDispatcher.dispatch(req, res, 'data');
});

