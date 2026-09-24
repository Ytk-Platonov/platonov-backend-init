const { Op } = require('sequelize');
const { ZodError } = require('zod');
const { bookingSchema } = require('../../feature/booking.schema');
const { Booking, Room, Category } = require('../models'); // Ваши модели Sequelize
const sequelize = require('../config/database'); // Ваше подключение к БД

class BookingController {
  async create(req, res) {
    try {
      // 1. Валидация формата данных (Zod)
      const validatedData = bookingSchema.parse(req.body);
      const { roomId, checkIn, checkOut } = validatedData;
      const userId = req.user.id;

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // 2. Транзакция для защиты от Race Condition (одновременных броней)
      const result = await sequelize.transaction(async (t) => {
        
        // 3. Проверка существования и доступности номера
        const room = await Room.findByPk(roomId, {
          include: [{ model: Category }],
          transaction: t,
          lock: t.LOCK.UPDATE // Блокируем строку на время транзакции
        });

        if (!room) throw new Error('ROOM_NOT_FOUND');
        if (!room.isAvailable) throw new Error('ROOM_UNAVAILABLE');

        // 4. Проверка пересечения дат (Overlapping)
        const overlappingBooking = await Booking.findOne({
          where: {
            roomId,
            status: { [Op.in]: ['pending', 'confirmed'] },
            checkIn: { [Op.lt]: checkOutDate },
            checkOut: { [Op.gt]: checkInDate }
          },
          transaction: t
        });

        if (overlappingBooking) throw new Error('DATES_OVERLAP');

        // 5. Расчет стоимости
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const coefficient = room.Category ? room.Category.coefficient : 1.0;
        const totalPrice = room.pricePerNight * nights * coefficient;

        // 6. Создание бронирования со статусом pending
        const newBooking = await Booking.create({
          userId,
          roomId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalPrice,
          status: 'pending'
        }, { transaction: t });

        return newBooking;
      });

      return res.status(201).json(result);

    } catch (error) {
      // Обработка ошибок валидации Zod
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Ошибка валидации', 
          details: error.errors.map(e => ({ field: e.path[0], message: e.message })) 
        });
      }

      // Обработка бизнес-ошибок
      switch (error.message) {
        case 'ROOM_NOT_FOUND': return res.status(404).json({ error: 'Номер не найден' });
        case 'ROOM_UNAVAILABLE': return res.status(400).json({ error: 'Номер недоступен для бронирования' });
        case 'DATES_OVERLAP': return res.status(400).json({ error: 'Номер уже занят на выбранные даты' });
        default:
          console.error(error);
          return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }
    }
  }
}

module.exports = new BookingController();
