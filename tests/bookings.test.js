const request = require('supertest');
const app = require('../app');
const { User, Room, Booking } = require('../models');

describe('Bookings API', () => {
  let token;
  let roomId;

  beforeAll(async () => {
    await Booking.destroy({ where: {}, truncate: true, cascade: true });
    await Room.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });

    // Гость
    await request(app).post('/api/auth/register')
      .send({ email: 'booker@test.com', password: 'password123' });

    const login = await request(app).post('/api/auth/login')
      .send({ email: 'booker@test.com', password: 'password123' });
    token = login.body.token;

    // Номер
    const room = await Room.create({
      category: 'standard', title: 'Test Room', description: 'desc',
      price_per_night: 3000, capacity: 2, is_available: true, image_url: '/img/1.jpg'
    });
    roomId = room.id;
  });

  // ============ СОЗДАНИЕ ============

  it('POST /api/bookings — успешное создание (201)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        room_id: roomId,
        check_in_date: '2025-08-01',
        check_out_date: '2025-08-05'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('pending');
    expect(res.body.total_price).toBeGreaterThan(0);
  });

  it('POST /api/bookings — дата выезда раньше заезда (400)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        room_id: roomId,
        check_in_date: '2025-09-05',
        check_out_date: '2025-09-01'
      });

    expect(res.statusCode).toBe(400);
  });

  it('POST /api/bookings — дата заезда в прошлом (400)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        room_id: roomId,
        check_in_date: '2020-01-01',
        check_out_date: '2020-01-05'
      });

    expect(res.statusCode).toBe(400);
  });

  it('POST /api/bookings — несуществующий номер (404)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        room_id: 99999,
        check_in_date: '2025-08-01',
        check_out_date: '2025-08-05'
      });

    expect(res.statusCode).toBe(404);
  });

  it('POST /api/bookings — без токена (401)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({
        room_id: roomId,
        check_in_date: '2025-08-01',
        check_out_date: '2025-08-05'
      });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/bookings — пересечение дат (409)', async () => {
    // Первая бронь
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ room_id: roomId, check_in_date: '2025-10-01', check_out_date: '2025-10-05' });

    // Вторая с пересечением
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ room_id: roomId, check_in_date: '2025-10-03', check_out_date: '2025-10-07' });

    expect(res.statusCode).toBe(409);
  });

  // ============ МОИ БРОНИ ============

  it('GET /api/bookings/my — возвращает брони пользователя', async () => {
    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const bookings = res.body.bookings || res.body;
    expect(Array.isArray(bookings)).toBe(true);
  });

  it('GET /api/bookings/my — без токена (401)', async () => {
    const res = await request(app).get('/api/bookings/my');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/bookings/my?page=1&limit=5 — пагинация', async () => {
    const res = await request(app)
      .get('/api/bookings/my?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});