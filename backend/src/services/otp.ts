import { randomInt } from 'node:crypto';
import { config } from '../config';
import { query } from '../db';

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export async function issueOtp(phone: string): Promise<string> {
  await query(
    'UPDATE otp_codes SET consumed = true WHERE phone = $1 AND consumed = false',
    [phone]
  );

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + config.otpTtlMinutes * 60 * 1000);

  await query(
    'INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
    [phone, code, expiresAt]
  );

  return code;
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `SELECT id FROM otp_codes
     WHERE phone = $1
       AND code = $2
       AND consumed = false
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone, code]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const { id } = result.rows[0];
  await query(
    'UPDATE otp_codes SET consumed = true WHERE id = $1',
    [id]
  );

  return true;
}
