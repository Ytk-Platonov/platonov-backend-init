const request = require('supertest');
const app = require('../app');
const { User, Room, Booking } = require('../models');
const bcrypt = require('bcrypt');

describe('Admin API — модерация', () => {
  let guestToken;
  let adminToken;
  let roomId;

  beforeAll(async () => {
    await Booking.destroy({ where: {}, truncate: true, cascade: true });
    await Room.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });

    // Гость
    await request(app).post('/api/auth/register')
      .send({ email: 'guest-mod@test.com', password: 'password123' });
    const guestLogin = await request(app).post('/api/auth/login')
      .send({ email: 'guest-mod@test.com', password: 'password123' });
    guestToken = guestLogin.body.token;

    // Админ (создаем напрямую)
    await User.create({
      email: 'admin@test.com',
      password_hash: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    const adminLogin = await request(app).post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = adminLogin.body.token;

    // Номер
    const room = await Room.create({
      category: 'standard', title: 'Admin Room', description: 'desc',
      price_per_night: 3000, capacity: 2, is_available: true, image_url: '/img/1.jpg'
    });
    roomId = room.id;
  });

  // ============ СПИСОК ВСЕХ БРОНЕЙ ============

  it('GET /api/admin/bookings — запрещено гостю (403)', async () => {
    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${guestToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('GET /api/admin/bookings — админ видит список (200)', async () => {
    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    const bookings = res.body.bookings || res.body;
    expect(Array.isArray(bookings)).toBe(true);
  });

  it('GET /api/admin/bookings — без токена (401)', async () => {
    const res = await request(app).get('/api/admin/bookings');
    expect(res.statusCode).toBe(401);
  });

  // ============ МОДЕРАЦИЯ ============

  it('PATCH /api/admin/bookings/:id/confirm — гость не может (403)', async () => {
    const booking = await Booking.create({
      user_id: 1, room_id: roomId,
      check_in_date: '2025-11-01', check_out_date: '2025-11-05',
      total_price: 12000, status: 'pending'
    });

    const res = await request(app)
      .patch(`/api/admin/bookings/${booking.id}/confirm`)
      .set('Authorization', `Bearer ${guestToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('PATCH /api/admin/bookings/:id/confirm — админ подтверждает (200)', async () => {
    const booking = await Booking.create({
      user_id: 1, room_id: roomId,
      check_in_date: '2025-12-01', check_out_date: '2025-12-05',
      total_price: 12000, status: 'pending'
    });

    const res = await request(app)
      .patch(`/api/admin/bookings/${booking.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('PATCH /api/admin/bookings/:id/reject — админ отклоняет (200)', async () => {
    const booking = await Booking.create({
      user_id: 1, room_id: roomId,
      check_in_date: '2026-01-01', check_out_date: '2026-01-05',
      total_price: 12000, status: 'pending'
    });

    const res = await request(app)
      .patch(`/api/admin/bookings/${booking.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Test rejection' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('rejected');
  });

  it('PATCH /api/admin/bookings/9999/confirm — несуществующая бронь (404)', async () => {
    const res = await request(app)
      .patch('/api/admin/bookings/9999/confirm')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('PATCH /api/admin/bookings/:id/confirm — бронь уже не pending (400)', async () => {
    const booking = await Booking.create({
      user_id: 1, room_id: roomId,
      check_in_date: '2026-02-01', check_out_date: '2026-02-05',
      total_price: 12000, status: 'confirmed' // уже подтверждена
    });

    const res = await request(app)
      .patch(`/api/admin/bookings/${booking.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
  });
});