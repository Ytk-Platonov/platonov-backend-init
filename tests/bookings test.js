const request = require('supertest');
const app = require('../server/app');
const { Booking, Room } = require('../server/models');

// Мокаем мидлвар аутентификации для тестов
jest.mock('../server/middleware/auth', () => (req, res, next) => {
  req.user = { id: 1, role: 'guest' };
  next();
});

describe('POST /api/bookings', () => {
  it('должен успешно создать бронирование', async () => {
    // Создаем тестовый номер
    const room = await Room.create({ pricePerNight: 1000, isAvailable: true });

    const response = await request(app)
      .post('/api/bookings')
      .send({
        roomId: room.id,
        checkIn: '2026-11-01T14:00:00Z',
        checkOut: '2026-11-05T12:00:00Z'
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending');
    expect(response.body.totalPrice).toBe(4000); // 1000 * 4 ночи * 1.0
  });

  it('должен вернуть 400, если даты в прошлом', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send({
        roomId: 1,
        checkIn: '2020-01-01T14:00:00Z',
        checkOut: '2020-01-05T12:00:00Z'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Ошибка валидации');
  });
});
