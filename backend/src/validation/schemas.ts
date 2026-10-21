import { z } from 'zod';

export const requestOtpSchema = z.object({
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, 'Invalid phone number format'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, 'Invalid phone number format'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export const createLoanSchema = z.object({
  friendName: z.string().trim().min(1).max(100),
  amount: z.number().positive().max(100000000),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  receiptUrl: z.string().url().optional(),
});

export const markRepaidSchema = z.object({
  repaid: z.boolean().optional().default(true),
});

export const loanIdSchema = z.object({
  id: z.string().uuid(),
});

