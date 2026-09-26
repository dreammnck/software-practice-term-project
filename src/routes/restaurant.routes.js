const express = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/restaurants:
 *   get:
 *     tags: [Restaurants]
 *     summary: List all restaurants available for reservation
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of restaurants }
 */
router.get('/', authenticate, restaurantController.list);

/**
 * @openapi
 * /api/restaurants/{id}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get a single restaurant by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Restaurant found }
 *       404: { description: Restaurant not found }
 */
router.get('/:id', authenticate, restaurantController.getById);

module.exports = router;
