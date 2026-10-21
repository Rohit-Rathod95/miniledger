import { z } from 'zod';

export const requestOtpSchema = z.object({
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, 'Invalid phone number format'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, 'Invalid phone number format'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});
