# База данных отеля «Сладкие сны»

## Стек
- **СУБД:** PostgreSQL 15+
- **ORM:** Sequelize 6+

## ER-Диаграмма (Связи)
- **User (1) <---> (N) Booking** (Один пользователь может иметь много бронирований)
- **Room (1) <---> (N) Booking** (Один номер может быть забронирован много раз в разные даты)

## Описание таблиц

### 1. Users (Пользователи)
| Поле | Тип | Описание |
|---|---|---|
| id | INT (PK) | Уникальный ID |
| email | VARCHAR | Email (уникальный) |
| password_hash | VARCHAR | Хеш пароля (bcrypt) |
| role | ENUM | 'guest' или 'admin' |
| created_at | TIMESTAMP | Дата регистрации |

### 2. Rooms (Номера)
| Поле | Тип | Описание |
|---|---|---|
| id | INT (PK) | Уникальный ID |
| category | ENUM | 'standard', 'comfort', 'lux' |
| title | VARCHAR | Название номера |
| description | TEXT | Описание |
| price_per_night | DECIMAL(10,2) | Цена за ночь |
| capacity | INT | Макс. вместимость (гостей) |
| is_available | BOOLEAN | Доступен ли номер для бронирования |
| image_url | VARCHAR | Путь к главному фото |

### 3. Bookings (Бронирования)
| Поле | Тип | Описание |
|---|---|---|
| id | INT (PK) | Уникальный ID |
| user_id | INT (FK) | Ссылка на Users |
| room_id | INT (FK) | Ссылка на Rooms |
| check_in_date | DATE | Дата заезда |
| check_out_date | DATE | Дата выезда |
| total_price | DECIMAL(10,2) | Итоговая стоимость |
| status | ENUM | 'pending', 'confirmed', 'rejected' |
| created_at | TIMESTAMP | Дата создания заявки |

## Тестовые данные (Seeders)
- **Пользователи (3):** 1 админ (`admin@sweetdreams.ru`), 2 гостя. Пароль для всех: `password123`.
- **Номера (5):** 2 стандартных, 2 комфорта, 1 люкс.
- **Бронирования (7):** Разные статусы (pending, confirmed, rejected) и даты (прошлые и будущие).

ссылка на нейрослоп: https://chat.qwen.ai/s/t_ace7a7cb-6aec-46ea-ad23-044362634336
