import request from 'supertest';
import { app, cleanup, testPhones } from './helpers';

describe('Auth routes', () => {
  afterAll(async () => {
    await cleanup();
  });

  it('invalid phone -> request-otp returns 400', async () => {
    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('valid phone -> request-otp returns 200', async () => {
    const res = await request(app)
      .post('/auth/request-otp')
      .send({ phone: testPhones[0] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'OTP sent');
  });

  it('wrong OTP -> verify-otp returns 401', async () => {
    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: testPhones[0], otp: '000000' });

    expect(res.status).toBe(401);
  });
});
