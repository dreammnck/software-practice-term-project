// Reservations vertical (owner: max) — US-12..US-16, US-19.
// Ownership rule: a non-admin may only touch reservations where userId === req.user.id.
const { Op } = require('sequelize');
const { Reservation, Restaurant } = require('../models');

function isValidId(id) {
  return /^[1-9]\d{0,9}$/.test(String(id)) && Number(id) <= 2147483647;
}

const MAX_TABLES_PER_USER = 3;

// Requirement: a user may reserve up to 3 tables in total. Returns the number of
// additional tables the user can still reserve (excluding one reservation being edited).
async function remainingTables(userId, excludeId) {
  const where = { userId };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const used = (await Reservation.sum('numberOfTables', { where })) || 0;
  return MAX_TABLES_PER_USER - used;
}

function limitExceeded(res, remaining) {
  return res.status(409).json({
    message: `Reservation limit exceeded: a user may reserve up to ${MAX_TABLES_PER_USER} tables in total (${Math.max(remaining, 0)} remaining)`,
  });
}

function canAccess(user, reservation) {
  return user.role === 'admin' || reservation.userId === user.id;
}

// Loads a reservation and enforces 404 (missing) / 403 (not owner, not admin).
// Returns the reservation, or null after having sent the error response.
async function loadAuthorized(req, res) {
  if (!isValidId(req.params.id)) {
    res.status(404).json({ message: 'Reservation not found' });
    return null;
  }
  const reservation = await Reservation.findByPk(req.params.id);
  if (!reservation) {
    res.status(404).json({ message: 'Reservation not found' });
    return null;
  }
  if (!canAccess(req.user, reservation)) {
    res.status(403).json({ message: 'Forbidden: you do not own this reservation' });
    return null;
  }
  return reservation;
}

async function create(req, res, next) {
  try {
    const { restaurantId, date, numberOfTables } = req.body;
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    const remaining = await remainingTables(req.user.id);
    if (numberOfTables > remaining) return limitExceeded(res, remaining);
    const reservation = await Reservation.create({
      restaurantId,
      date,
      numberOfTables,
      userId: req.user.id,
    });
    return res.status(201).json({ message: 'Reservation created', reservation });
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const reservations = await Reservation.findAll({
      where,
      include: [{ model: Restaurant, attributes: ['id', 'name'] }],
      order: [['date', 'ASC'], ['id', 'ASC']],
    });
    return res.status(200).json({ count: reservations.length, reservations });
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const reservation = await loadAuthorized(req, res);
    if (!reservation) return undefined;
    return res.status(200).json({ reservation });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const reservation = await loadAuthorized(req, res);
    if (!reservation) return undefined;

    const { restaurantId, date, numberOfTables } = req.body;
    if (restaurantId !== undefined) {
      const restaurant = await Restaurant.findByPk(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      reservation.restaurantId = restaurantId;
    }
    if (date !== undefined) reservation.date = date;
    if (numberOfTables !== undefined) {
      const remaining = await remainingTables(reservation.userId, reservation.id);
      if (numberOfTables > remaining) return limitExceeded(res, remaining);
      reservation.numberOfTables = numberOfTables;
    }

    await reservation.save();
    return res.status(200).json({ message: 'Reservation updated', reservation });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const reservation = await loadAuthorized(req, res);
    if (!reservation) return undefined;
    await reservation.destroy();
    return res.status(200).json({ message: 'Reservation deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, list, getOne, update, remove };
