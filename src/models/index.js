const { mongoose, connect } = require('../config/db');
const User = require('./user.model');
const Restaurant = require('./restaurant.model');
const Reservation = require('./reservation.model');
const RevokedToken = require('./revokedToken.model');

module.exports = {
  mongoose,
  connect,
  User,
  Restaurant,
  Reservation,
  RevokedToken,
};
