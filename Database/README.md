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

## ER-Диаграмма

```mermaid
erDiagram
    Users ||--o{ Bookings : "has many"
    Rooms ||--o{ Bookings : "has many"
    
    Users {
        int id PK "Уникальный идентификатор"
        varchar email UK "Email пользователя"
        varchar password_hash "Хеш пароля (bcrypt)"
        enum role "guest | admin"
        timestamp created_at "Дата регистрации"
    }
    
    Rooms {
        int id PK "Уникальный идентификатор"
        enum category "standard | comfort | lux"
        varchar title "Название номера"
        text description "Описание номера"
        decimal price_per_night "Цена за ночь"
        int capacity "Макс. вместимость"
        boolean is_available "Доступен для бронирования"
        varchar image_url "URL изображения"
        timestamp created_at "Дата создания"
    }
    
    Bookings {
        int id PK "Уникальный идентификатор"
        int user_id FK "Ссылка на Users"
        int room_id FK "Ссылка на Rooms"
        date check_in_date "Дата заезда"
        date check_out_date "Дата выезда"
        decimal total_price "Итоговая стоимость"
        enum status "pending | confirmed | rejected"
        timestamp created_at "Дата создания заявки"
    }

ссылка на нейрослоп: https://chat.qwen.ai/s/t_ace7a7cb-6aec-46ea-ad23-044362634336
