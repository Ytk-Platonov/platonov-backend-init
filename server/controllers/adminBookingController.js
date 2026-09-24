// Импортируем модели
// Пока они не написаны, код не запустится, но логика верная!
const { Booking, User, Room } = require('../models'); 
const { Op } = require('sequelize'); // Операторы для сложных запросов (больше, меньше, между)

exports.getAllBookings = async (req, res) => {
    try {
        // 1. Забираем параметры из строки запроса (например, ?status=pending&page=2)
        // Если их нет, берем значения по умолчанию
        const { status, date_from, date_to, page = 1, limit = 20 } = req.query;
        
        // 2. Собираем условия фильтрации (куда подставим WHERE в SQL)
        const whereClause = {};

        if (status) {
            whereClause.status = status;
        }

        // Логика фильтра по датам
        if (date_from && date_to) {
            whereClause.created_at = { [Op.between]: [new Date(date_from), new Date(date_to)] };
        } else if (date_from) {
            whereClause.created_at = { [Op.gte]: new Date(date_from) }; // >=
        } else if (date_to) {
            whereClause.created_at = { [Op.lte]: new Date(date_to) }; // <=
        }

        // 3. Считаем математику для пагинации
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const offset = (pageNumber - 1) * limitNumber; // Сколько записей пропустить

        // 4. Делаем запрос к БД
        // findAndCountAll удобен тем, что он сразу возвращает и данные (rows), и общее кол-во (count)
        const { count, rows } = await Booking.findAndCountAll({
            where: whereClause,
            // Подтягиваем данные о юзере и номере, чтобы не делать отдельные запросы
            include: [
                { model: User, attributes: ['id', 'email'] }, 
                { model: Room, attributes: ['id', 'title', 'category'] }
            ],
            order: [['created_at', 'DESC']], // Сортировка: новые сверху
            limit: limitNumber,
            offset: offset
        });

        // 5. Отдаем красивый ответ
        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limitNumber),
                currentPage: pageNumber,
                itemsPerPage: limitNumber
            }
        });

    } catch (error) {
        // Если что-то пошло не так (упала БД, кривой запрос)
        console.error('Ошибка в adminBookings:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Внутренняя ошибка сервера' 
        });
    }
};
