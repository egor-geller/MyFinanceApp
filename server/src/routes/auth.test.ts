import express from 'express';
import request from 'supertest';

jest.mock('../db/index.js', () => ({
  pool: { query: jest.fn() },
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pw'),
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn(),
}));

import { pool } from '../db/index.js';
import bcrypt from 'bcrypt';
import authRouter from './auth';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

const mockQuery = pool.query as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /auth/register', () => {
  it('returns 201 and token on success', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // email not taken
      .mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com', name: 'Alice' }] }) // insert user
      .mockResolvedValueOnce({ rows: [] }); // insert profile

    const res = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'a@b.com',
      password: 'secret123',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBe('mock_token');
    expect(res.body.user.email).toBe('a@b.com');
  });

  it('returns 409 when email already registered', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // email exists

    const res = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'a@b.com',
      password: 'secret123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already registered');
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'not-an-email',
      password: 'secret123',
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Alice',
      email: 'a@b.com',
      password: '123',
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'a@b.com',
      password: 'secret123',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('returns 200 and token on valid credentials', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'a@b.com', name: 'Alice', password_hash: 'hashed_pw', email_reminders: false, email_monthly_report: false }],
    });
    mockCompare.mockResolvedValueOnce(true);

    const res = await request(app).post('/auth/login').send({
      email: 'a@b.com',
      password: 'secret123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('mock_token');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('returns 401 when user does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/auth/login').send({
      email: 'nobody@b.com',
      password: 'secret123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 when password is wrong', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'a@b.com', name: 'Alice', password_hash: 'hashed_pw', email_reminders: false, email_monthly_report: false }],
    });
    mockCompare.mockResolvedValueOnce(false);

    const res = await request(app).post('/auth/login').send({
      email: 'a@b.com',
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 400 when email format is invalid', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'not-an-email',
      password: 'secret123',
    });

    expect(res.status).toBe(400);
  });
});
