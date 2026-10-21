import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/error';
import { createLoan, listLoans, markRepaid } from '../services/loans';
import { createLoanSchema, loanIdSchema, markRepaidSchema } from '../validation/schemas';

export const loansRouter = Router();

loansRouter.use(requireAuth);

loansRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createLoanSchema.parse(req.body);
    const loan = await createLoan(req.userId!, input);
    res.status(201).json(loan);
  })
);

loansRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const loans = await listLoans(req.userId!);
    res.json(loans);
  })
);

loansRouter.patch(
  '/:id/repaid',
  asyncHandler(async (req, res) => {
    const { id } = loanIdSchema.parse(req.params);
    const { repaid } = markRepaidSchema.parse(req.body ?? {});
    const loan = await markRepaid(req.userId!, id, repaid);

    if (!loan) {
      throw new HttpError(404, 'Loan not found');
    }

    res.json(loan);
  })
);
