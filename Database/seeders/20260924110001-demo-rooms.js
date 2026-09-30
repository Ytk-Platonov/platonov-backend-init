'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Rooms', [
      {
        category: 'standard', title: 'Стандартный одноместный',
        description: 'Уютный номер с одной кроватью и видом во двор.',
        price_per_night: 2500.00, capacity: 1, is_available: true,
        image_url: '/images/rooms/standard1.jpg', created_at: new Date(), updated_at: new Date()
      },
      {
        category: 'standard', title: 'Стандартный двухместный',
        description: 'Просторный номер с двумя раздельными кроватями.',
        price_per_night: 3200.00, capacity: 2, is_available: true,
        image_url: '/images/rooms/standard2.jpg', created_at: new Date(), updated_at: new Date()
      },
      {
        category: 'comfort', title: 'Комфорт с балконом',
        description: 'Номер категории комфорт с собственным балконом и мини-баром.',
        price_per_night: 4500.00, capacity: 2, is_available: true,
        image_url: '/images/rooms/comfort1.jpg', created_at: new Date(), updated_at: new Date()
      },
      {
        category: 'comfort', title: 'Семейный комфорт',
        description: 'Идеально для семьи: большая кровать и диван.',
        price_per_night: 5500.00, capacity: 4, is_available: true,
        image_url: '/images/rooms/comfort2.jpg', created_at: new Date(), updated_at: new Date()
      },
      {
        category: 'lux', title: 'Люкс «Шоколадные сны»',
        description: 'Премиальный номер с джакузи, панорамным видом и завтраком в постель.',
        price_per_night: 12000.00, capacity: 2, is_available: true,
        image_url: '/images/rooms/lux1.jpg', created_at: new Date(), updated_at: new Date()
      }
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Rooms', null, {});
  }
};
