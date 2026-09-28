const request = require('supertest');
const app = require('../app');
const { User } = require('../models');

describe('Auth API', () => {
  const testUser = {
    email: 'qa-auth@test.com',
    password: 'password123'
  };

  beforeAll(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  // ============ РЕГИСТРАЦИЯ ============

  it('POST /api/auth/register — успешная регистрация (201)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.role).toBe('guest');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('POST /api/auth/register — email занят (409)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(409);
  });

  it('POST /api/auth/register — неверный email (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/register — короткий пароль (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@test.com', password: '123' });

    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/register — пустое тело (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(res.statusCode).toBe(400);
  });

  // ============ ВХОД ============

  it('POST /api/auth/login — успешный вход (200)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(testUser);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('POST /api/auth/login — неверный пароль (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrong-password' });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/login — несуществующий пользователь (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'password123' });

    expect(res.statusCode).toBe(401);
  });
});