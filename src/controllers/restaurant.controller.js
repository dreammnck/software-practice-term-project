// Restaurants vertical (owner: max) — US-11.
const { Restaurant } = require('../models');

async function list(req, res, next) {
  try {
    const restaurants = await Restaurant.findAll({ order: [['name', 'ASC']] });
    return res.status(200).json({ count: restaurants.length, restaurants });
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const restaurant = /^[1-9]\d{0,9}$/.test(id) && Number(id) <= 2147483647
      ? await Restaurant.findByPk(id)
      : null;
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    return res.status(200).json({ restaurant });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getById };
