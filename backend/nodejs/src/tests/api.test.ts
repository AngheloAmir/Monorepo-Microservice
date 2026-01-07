import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('API Endpoints', () => {
  it('GET /test should return message', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    // Based on test.route.ts: res.json({ message: 'Test' });
    expect(res.body).toEqual({ message: 'Test' });
  });

  it('GET /login should return a token', async () => {
    const res = await request(app).get('/login');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });
});
