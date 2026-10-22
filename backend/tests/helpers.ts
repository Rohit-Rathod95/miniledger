import request from 'supertest';
import { createApp } from '../src/app';
import { pool, query } from '../src/db';

export const app = createApp();

export const testPhones = ['9000000001', '9000000002'];

export const authHeader = (t: string) => ({ Authorization: `Bearer ${t}` });

export async function loginAs(phone: string): Promise<string> {
  await request(app)
    .post('/auth/request-otp')
    .send({ phone });

  const result = await query<{ code: string }>(
    'select code from otp_codes where phone = $1 order by created_at desc limit 1',
    [phone]
  );

  if (result.rows.length === 0) {
    throw new Error(`No OTP found for phone ${phone}`);
  }

  const code = result.rows[0].code;

  const verifyRes = await request(app)
    .post('/auth/verify-otp')
    .send({ phone, otp: code });

  return verifyRes.body.token;
}

export async function cleanup(): Promise<void> {
  await query('delete from users where phone = any($1)', [testPhones]);
  await query('delete from otp_codes where phone = any($1)', [testPhones]);
  await pool.end();
}
