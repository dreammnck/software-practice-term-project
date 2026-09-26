const sequelize = require('../config/db');
const User = require('./user.model');
const Restaurant = require('./restaurant.model');
const Reservation = require('./reservation.model');
const RevokedToken = require('./revokedToken.model');

User.hasMany(Reservation, { foreignKey: 'userId', onDelete: 'CASCADE' });
Reservation.belongsTo(User, { foreignKey: 'userId' });

Restaurant.hasMany(Reservation, { foreignKey: 'restaurantId', onDelete: 'CASCADE' });
Reservation.belongsTo(Restaurant, { foreignKey: 'restaurantId' });

module.exports = {
  sequelize,
  User,
  Restaurant,
  Reservation,
  RevokedToken,
};
