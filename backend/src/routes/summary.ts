import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { getSummary } from '../services/loans';

export const summaryRouter = Router();

summaryRouter.use(requireAuth);

summaryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const summary = await getSummary(req.userId!);
    res.json(summary);
  })
);
