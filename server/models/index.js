const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.NODE_ENV === 'test' ? ':memory:' : './database.sqlite',
  logging: false
});

const User = require('./User')(sequelize, DataTypes);
const Room = require('./Room')(sequelize, DataTypes);
const Booking = require('./Booking')(sequelize, DataTypes);

// Связи
User.hasMany(Booking, { foreignKey: 'user_id' });
Booking.belongsTo(User, { foreignKey: 'user_id' });

Room.hasMany(Booking, { foreignKey: 'room_id' });
Booking.belongsTo(Room, { foreignKey: 'room_id' });

module.exports = { sequelize, User, Room, Booking };