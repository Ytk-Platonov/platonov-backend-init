const Room = require('../models/Room');
const Booking = require('../models/Booking');

const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({ error: 'Неверный формат ID номера' });
        }

        const room = await Room.findByPk(id, {
            include: [{
                model: Booking,
                as: 'bookings',
                attributes: ['id', 'check_in_date', 'check_out_date', 'status'],
                where: { status: ['pending', 'confirmed'] },
                required: false
            }]
        });

        if (!room) {
            return res.status(404).json({ error: 'Номер не найден' });
        }

        res.json(room);
    } catch (error) {
        console.error('Ошибка при получении деталей номера:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};

module.exports = { getRoomById };
