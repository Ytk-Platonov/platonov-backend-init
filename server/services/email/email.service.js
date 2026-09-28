const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Сервис отправки email-уведомлений.
 * Использует nodemailer и HTML-шаблоны из папки ./templates.
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true для 465, false для 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const TEMPLATES_DIR = path.join(__dirname, 'templates');

/**
 * Простая замена {{var}} в HTML-шаблоне.
 * @param {string} template — содержимое HTML
 * @param {Object} data — переменные
 */
function renderTemplate(template, data) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
  });
}

/**
 * Загрузка и рендер шаблона.
 */
function loadTemplate(templateName, data) {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return renderTemplate(raw, data);
}

/**
 * Базовая отправка письма.
 */
async function sendMail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`[Email] Письмо отправлено на ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('[Email] Ошибка отправки:', err.message);
    // Не бросаем ошибку дальше — уведомление не должно ломать основной флоу
    return null;
  }
}

/**
 * 1. Уведомление о создании бронирования.
 */
async function sendBookingCreated(user, booking, room) {
  const html = loadTemplate('booking-created', {
    userName: user.email,
    roomTitle: room.title,
    checkIn: new Date(booking.check_in_date).toLocaleDateString('ru-RU'),
    checkOut: new Date(booking.check_out_date).toLocaleDateString('ru-RU'),
    totalPrice: booking.total_price,
    bookingId: booking.id,
    clientUrl: process.env.CLIENT_URL || '#',
  });
  return sendMail({
    to: user.email,
    subject: `Заявка №${booking.id} на бронирование получена — «Сладкие сны»`,
    html,
  });
}

/**
 * 2. Уведомление о подтверждении бронирования.
 */
async function sendBookingConfirmed(user, booking, room) {
  const html = loadTemplate('booking-confirmed', {
    userName: user.email,
    roomTitle: room.title,
    checkIn: new Date(booking.check_in_date).toLocaleDateString('ru-RU'),
    checkOut: new Date(booking.check_out_date).toLocaleDateString('ru-RU'),
    totalPrice: booking.total_price,
    bookingId: booking.id,
    clientUrl: process.env.CLIENT_URL || '#',
  });
  return sendMail({
    to: user.email,
    subject: `Бронирование №${booking.id} подтверждено — «Сладкие сны»`,
    html,
  });
}

/**
 * 3. Уведомление об отклонении бронирования (с причиной).
 */
async function sendBookingRejected(user, booking, room, reason = 'не указана') {
  const html = loadTemplate('booking-rejected', {
    userName: user.email,
    roomTitle: room.title,
    checkIn: new Date(booking.check_in_date).toLocaleDateString('ru-RU'),
    checkOut: new Date(booking.check_out_date).toLocaleDateString('ru-RU'),
    bookingId: booking.id,
    reason,
    clientUrl: process.env.CLIENT_URL || '#',
  });
  return sendMail({
    to: user.email,
    subject: `Бронирование №${booking.id} отклонено — «Сладкие сны»`,
    html,
  });
}

module.exports = {
  sendMail,
  sendBookingCreated,
  sendBookingConfirmed,
  sendBookingRejected,
};
