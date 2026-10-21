import { Router } from 'express';
import { config } from '../config';
import { query } from '../db';
import { asyncHandler, HttpError } from '../middleware/error';
import { issueOtp, verifyOtp } from '../services/otp';
import { signToken } from '../services/token';
import { requestOtpSchema, verifyOtpSchema } from '../validation/schemas';

export const authRouter = Router();

authRouter.post(
  '/request-otp',
  asyncHandler(async (req, res) => {
    const { phone } = requestOtpSchema.parse(req.body);
    const code = await issueOtp(phone);

    console.log(`[OTP] ${phone} -> ${code}`);

    const response: { message: string; otp?: string } = {
      message: 'OTP sent',
    };
    if (config.exposeOtpInResponse) {
      response.otp = code;
    }

    res.json(response);
  })
);

authRouter.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const { phone, otp } = verifyOtpSchema.parse(req.body);
    const isValid = await verifyOtp(phone, otp);

    if (!isValid) {
      throw new HttpError(401, 'Invalid or expired OTP');
    }

    const result = await query<{ id: string; phone: string }>(
      `INSERT INTO users (phone)
       VALUES ($1)
       ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
       RETURNING id, phone`,
      [phone]
    );

    const user = result.rows[0];
    const token = signToken({ sub: user.id, phone: user.phone });

    res.json({ token, user });
  })
);
