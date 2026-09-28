const path = require('path');
const { Room } = require('../models');
const { buildImageUrl, removeOldImage } = require('../services/upload/upload.service');

/**
 * POST /api/admin/rooms/:id/image
 * Загрузка изображения для номера. Только для админов.
 * Middleware: authRequired, adminOnly, uploadRoomImage, handleUploadError.
 */
exports.uploadRoomImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'Файл не загружен. Используйте поле "image".' },
      });
    }

    const room = await Room.findByPk(id);
    if (!room) {
      // Удаляем только что загруженный файл, чтобы не засорять диск
      removeOldImage(buildImageUrl(req.file.filename));
      return res.status(404).json({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: `Номер с id=${id} не найден` },
      });
    }

    // Удаляем предыдущее изображение, если оно было
    if (room.image_url) removeOldImage(room.image_url);

    const newUrl = buildImageUrl(req.file.filename);
    room.image_url = newUrl;
    await room.save();

    res.json({
      success: true,
      data: {
        room_id: room.id,
        image_url: newUrl,
        message: 'Изображение успешно загружено',
      },
    });
  } catch (err) {
    next(err);
  }
};
