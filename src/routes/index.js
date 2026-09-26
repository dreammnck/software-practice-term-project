const express = require('express');
const authRoutes = require('./auth.routes');
const restaurantRoutes = require('./restaurant.routes');
const reservationRoutes = require('./reservation.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/reservations', reservationRoutes);

module.exports = router;
