import request from 'supertest';
import { app, authHeader, cleanup, loginAs, testPhones } from './helpers';

describe('Loans routes', () => {
  let tokenA: string;
  let tokenB: string;
  let createdLoanId: string;

  beforeAll(async () => {
    tokenA = await loginAs(testPhones[0]);
    tokenB = await loginAs(testPhones[1]);
  });

  afterAll(async () => {
    await cleanup();
  });

  it('GET /loans with no token -> 401', async () => {
    const res = await request(app).get('/loans');
    expect(res.status).toBe(401);
  });

  it('POST /loans with invalid body ({ friendName: "", amount: -5, dueDate: "nope" }) -> 400', async () => {
    const res = await request(app)
      .post('/loans')
      .set(authHeader(tokenA))
      .send({ friendName: '', amount: -5, dueDate: 'nope' });

    expect(res.status).toBe(400);
  });

  it('POST /loans valid ({ friendName: "Test Friend", amount: 500.5, dueDate: "2020-01-01" }) -> 201, body.amount === 500.5, body.isOverdue === true', async () => {
    const res = await request(app)
      .post('/loans')
      .set(authHeader(tokenA))
      .send({ friendName: 'Test Friend', amount: 500.5, dueDate: '2020-01-01' });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(500.5);
    expect(res.body.isOverdue).toBe(true);
    createdLoanId = res.body.id;
  });

  it('GET /loans -> 200, contains the created loan', async () => {
    const res = await request(app)
      .get('/loans')
      .set(authHeader(tokenA));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const loan = res.body.find((item: any) => item.id === createdLoanId);
    expect(loan).toBeDefined();
    expect(loan.friendName).toBe('Test Friend');
  });

  it('GET /summary -> totalLent >= 500.5 and overdueAmount >= 500.5', async () => {
    const res = await request(app)
      .get('/summary')
      .set(authHeader(tokenA));

    expect(res.status).toBe(200);
    expect(res.body.totalLent).toBeGreaterThanOrEqual(500.5);
    expect(res.body.overdueAmount).toBeGreaterThanOrEqual(500.5);
  });

  it('PATCH /loans/:id/repaid with {} -> 200, body.repaid === true', async () => {
    const res = await request(app)
      .patch(`/loans/${createdLoanId}/repaid`)
      .set(authHeader(tokenA))
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.repaid).toBe(true);
  });

  it('authorization: create a loan as tokenA, then PATCH it as tokenB -> 404', async () => {
    const createRes = await request(app)
      .post('/loans')
      .set(authHeader(tokenA))
      .send({ friendName: 'Private Friend', amount: 200, dueDate: '2026-12-31' });

    expect(createRes.status).toBe(201);
    const privateLoanId = createRes.body.id;

    const patchRes = await request(app)
      .patch(`/loans/${privateLoanId}/repaid`)
      .set(authHeader(tokenB))
      .send({});

    expect(patchRes.status).toBe(404);
  });
});
