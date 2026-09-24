'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Bookings', [
      // Брони для гостя 1 (user_id: 2)
      { user_id: 2, room_id: 1, check_in_date: '2026-10-01', check_out_date: '2026-10-05', total_price: 10000.00, status: 'confirmed', created_at: new Date(), updated_at: new Date() },
      { user_id: 2, room_id: 3, check_in_date: '2026-11-10', check_out_date: '2026-11-15', total_price: 22500.00, status: 'pending', created_at: new Date(), updated_at: new Date() },
      
      // Брони для гостя 2 (user_id: 3)
      { user_id: 3, room_id: 5, check_in_date: '2026-09-25', check_out_date: '2026-09-28', total_price: 36000.00, status: 'confirmed', created_at: new Date(), updated_at: new Date() },
      { user_id: 3, room_id: 2, check_in_date: '2026-12-20', check_out_date: '2026-12-25', total_price: 16000.00, status: 'rejected', created_at: new Date(), updated_at: new Date() },
      { user_id: 3, room_id: 4, check_in_date: '2026-10-15', check_out_date: '2026-10-18', total_price: 16500.00, status: 'pending', created_at: new Date(), updated_at: new Date() },
      
      // Дополнительные брони
      { user_id: 2, room_id: 5, check_in_date: '2026-12-30', check_out_date: '2027-01-05', total_price: 72000.00, status: 'pending', created_at: new Date(), updated_at: new Date() },
      { user_id: 3, room_id: 1, check_in_date: '2026-11-01', check_out_date: '2026-11-03', total_price: 5000.00, status: 'confirmed', created_at: new Date(), updated_at: new Date() }
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Bookings', null, {});
  }
};
