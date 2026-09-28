const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Сервис загрузки изображений для номеров.
 * Ограничения: jpg/jpeg/png/webp, максимум 5 МБ.
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads/rooms';
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5 МБ

// Создаём директорию, если её нет
const absoluteUploadDir = path.join(process.cwd(), UPLOAD_DIR);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
  console.log(`[Upload] Создана папка: ${absoluteUploadDir}`);
}

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, absoluteUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `room_${req.params.id || 'unknown'}_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Недопустимый формат файла. Разрешены: jpg, jpeg, png, webp.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Middleware для одного файла с ключом "image".
 */
const uploadRoomImage = upload.single('image');

/**
 * Формирует публичный URL для загруженного файла.
 * @param {string} filename
 * @returns {string} — относительный URL
 */
function buildImageUrl(filename) {
  return `/${UPLOAD_DIR.replace(/\\/g, '/')}/${filename}`;
}

/**
 * Удаляет старое изображение номера (если оно лежит в нашей папке).
 * @param {string|null} imageUrl
 */
function removeOldImage(imageUrl) {
  if (!imageUrl) return;
  try {
    const relative = imageUrl.replace(/^\//, '');
    const fullPath = path.join(process.cwd(), relative);
    if (fs.existsSync(fullPath) && fullPath.startsWith(absoluteUploadDir)) {
      fs.unlinkSync(fullPath);
      console.log(`[Upload] Удалён старый файл: ${fullPath}`);
    }
  } catch (err) {
    console.warn('[Upload] Не удалось удалить старый файл:', err.message);
  }
}

module.exports = {
  uploadRoomImage,
  buildImageUrl,
  removeOldImage,
  absoluteUploadDir,
};
