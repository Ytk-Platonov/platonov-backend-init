const request = require('supertest');
const app = require('../app');
const { Room, Booking, User } = require('../models');

describe('Rooms API', () => {
  beforeAll(async () => {
    await Booking.destroy({ where: {}, truncate: true, cascade: true });
    await Room.destroy({ where: {}, truncate: true, cascade: true });

    // Тестовые номера
    await Room.bulkCreate([
      { category: 'standard', title: 'Стандарт 1', description: 'desc',
        price_per_night: 2000, capacity: 2, is_available: true, image_url: '/img/1.jpg' },
      { category: 'comfort', title: 'Комфорт 1', description: 'desc',
        price_per_night: 5000, capacity: 3, is_available: true, image_url: '/img/2.jpg' },
      { category: 'lux', title: 'Люкс 1', description: 'desc',
        price_per_night: 12000, capacity: 4, is_available: true, image_url: '/img/3.jpg' },
      { category: 'standard', title: 'Стандарт 2 (недоступен)', description: 'desc',
        price_per_night: 2500, capacity: 2, is_available: false, image_url: '/img/4.jpg' }
    ]);
  });

  // ============ СПИСОК ============

  it('GET /api/rooms — возвращает только доступные номера', async () => {
    const res = await request(app).get('/api/rooms');

    expect(res.statusCode).toBe(200);
    const rooms = res.body.rooms || res.body;
    rooms.forEach(r => expect(r.is_available).toBe(true));
  });

  it('GET /api/rooms?page=1&limit=2 — пагинация работает', async () => {
    const res = await request(app).get('/api/rooms?page=1&limit=2');

    expect(res.statusCode).toBe(200);
    const rooms = res.body.rooms || res.body;
    expect(rooms.length).toBeLessThanOrEqual(2);
  });

  it('GET /api/rooms?limit=abc — неверный limit (400)', async () => {
    const res = await request(app).get('/api/rooms?limit=abc');
    expect(res.statusCode).toBe(400);
  });

  // ============ ФИЛЬТРАЦИЯ ============

  it('GET /api/rooms/filter?category=lux — фильтр по категории', async () => {
    const res = await request(app).get('/api/rooms/filter?category=lux');

    expect(res.statusCode).toBe(200);
    const rooms = res.body.rooms || res.body;
    rooms.forEach(r => expect(r.category).toBe('lux'));
  });

  it('GET /api/rooms/filter?minPrice=3000&maxPrice=8000 — фильтр по цене', async () => {
    const res = await request(app)
      .get('/api/rooms/filter?minPrice=3000&maxPrice=8000');

    expect(res.statusCode).toBe(200);
    const rooms = res.body.rooms || res.body;
    rooms.forEach(r => {
      expect(r.price_per_night).toBeGreaterThanOrEqual(3000);
      expect(r.price_per_night).toBeLessThanOrEqual(8000);
    });
  });

  it('GET /api/rooms/filter?capacity=4 — фильтр по вместимости', async () => {
    const res = await request(app).get('/api/rooms/filter?capacity=4');

    expect(res.statusCode).toBe(200);
    const rooms = res.body.rooms || res.body;
    rooms.forEach(r => expect(r.capacity).toBeGreaterThanOrEqual(4));
  });

  it('GET /api/rooms/filter — неверный формат даты (400)', async () => {
    const res = await request(app)
      .get('/api/rooms/filter?check_in=not-a-date&check_out=2025-07-05');

    expect(res.statusCode).toBe(400);
  });

  // ============ ДЕТАЛИ ============

  it('GET /api/rooms/1 — детали существующего номера', async () => {
    const res = await request(app).get('/api/rooms/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('title');
  });

  it('GET /api/rooms/9999 — номер не найден (404)', async () => {
    const res = await request(app).get('/api/rooms/9999');
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/rooms/abc — нечисловой id (400)', async () => {
    const res = await request(app).get('/api/rooms/abc');
    expect(res.statusCode).toBe(400);
  });
});