module.exports = (sequelize, DataTypes) => {
  return sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('guest', 'admin'), defaultValue: 'guest' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'users', timestamps: false });
};