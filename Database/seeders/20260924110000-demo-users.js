'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('Users', [
      {
        email: 'admin@sweetdreams.ru',
        password_hash: hashedPassword,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'ivan.guest@mail.ru',
        password_hash: hashedPassword,
        role: 'guest',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        email: 'maria.guest@mail.ru',
        password_hash: hashedPassword,
        role: 'guest',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
