import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/error';
import { uploadReceipt } from '../services/storage';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadsRouter = Router();

uploadsRouter.use(requireAuth);

uploadsRouter.post(
  '/receipt',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, 'No file uploaded (expected field "file")');
    }

    const url = await uploadReceipt(req.userId!, req.file);
    res.status(201).json({ url });
  })
);
