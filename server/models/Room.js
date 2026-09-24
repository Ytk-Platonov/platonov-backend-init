module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Room', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category: { type: DataTypes.ENUM('standard', 'comfort', 'lux'), allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price_per_night: { type: DataTypes.INTEGER, allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
    image_url: { type: DataTypes.STRING }
  }, { tableName: 'rooms', timestamps: false });
};