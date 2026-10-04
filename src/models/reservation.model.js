const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Reservation extends Model {}

Reservation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    numberOfTables: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 3 },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'restaurants', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'Reservation',
    tableName: 'reservations',
    indexes: [{ fields: ['userId'] }, { fields: ['restaurantId'] }],
  }
);

module.exports = Reservation;
