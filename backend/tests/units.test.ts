import { generateOtp } from '../src/services/otp';
import { createLoanSchema, requestOtpSchema } from '../src/validation/schemas';

describe('Unit tests (no DB)', () => {
  it('generateOtp() matches /^\\d{6}$/ over several calls', () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    }
  });

  it('requestOtpSchema.safeParse validates phone', () => {
    expect(requestOtpSchema.safeParse({ phone: '9876543210' }).success).toBe(true);
    expect(requestOtpSchema.safeParse({ phone: 'abc' }).success).toBe(false);
  });

  it('createLoanSchema rejects amount 0 and accepts a valid object', () => {
    const invalidZeroAmount = {
      friendName: 'Test Friend',
      amount: 0,
      dueDate: '2026-10-22',
    };
    expect(createLoanSchema.safeParse(invalidZeroAmount).success).toBe(false);

    const validObject = {
      friendName: 'Test Friend',
      amount: 100.5,
      dueDate: '2026-10-22',
    };
    expect(createLoanSchema.safeParse(validObject).success).toBe(true);
  });
});
