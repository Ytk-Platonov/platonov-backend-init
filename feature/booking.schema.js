const { z } = require('zod');

const bookingSchema = z.object({
  roomId: z.number().int().positive({ message: 'ID номера должен быть положительным числом' }),
  checkIn: z.string().datetime({ message: 'Неверный формат даты заезда (нужен ISO 8601)' }),
  checkOut: z.string().datetime({ message: 'Неверный формат даты выезда (нужен ISO 8601)' }),
})
.refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
  message: 'Дата выезда должна быть позже даты заезда',
  path: ['checkOut'], // Указываем, к какому полю привязать ошибку
})
.refine((data) => new Date(data.checkIn) >= new Date(new Date().setHours(0, 0, 0, 0)), {
  message: 'Дата заезда не может быть в прошлом',
  path: ['checkIn'],
});

module.exports = { bookingSchema };
