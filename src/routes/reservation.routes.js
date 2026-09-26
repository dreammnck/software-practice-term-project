const express = require('express');
const { body } = require('express-validator');
const reservationController = require('../controllers/reservation.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

const reservationBodyRules = [
  body('restaurantId').isMongoId().withMessage('restaurantId must be a valid id'),
  body('date').isISO8601().withMessage('date must be a valid date (YYYY-MM-DD)'),
  body('numberOfTables')
    .isInt({ min: 1, max: 3 })
    .withMessage('numberOfTables must be between 1 and 3'),
];

const reservationUpdateRules = [
  body('restaurantId').optional().isMongoId().withMessage('restaurantId must be a valid id'),
  body('date').optional().isISO8601().withMessage('date must be a valid date (YYYY-MM-DD)'),
  body('numberOfTables')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('numberOfTables must be between 1 and 3'),
];

/**
 * @openapi
 * /api/reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Create a reservation (registered user)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurantId, date, numberOfTables]
 *             properties:
 *               restaurantId: { type: string }
 *               date: { type: string, format: date }
 *               numberOfTables: { type: integer, minimum: 1, maximum: 3 }
 *     responses:
 *       201: { description: Reservation created }
 *   get:
 *     tags: [Reservations]
 *     summary: List reservations (own reservations for a user, all reservations for an admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of reservations }
 */
router.post('/', authenticate, reservationBodyRules, validate, reservationController.create);
router.get('/', authenticate, reservationController.list);

/**
 * @openapi
 * /api/reservations/{id}:
 *   get:
 *     tags: [Reservations]
 *     summary: Get a reservation by id (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reservation found }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 *   put:
 *     tags: [Reservations]
 *     summary: Update a reservation (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurantId: { type: string }
 *               date: { type: string, format: date }
 *               numberOfTables: { type: integer, minimum: 1, maximum: 3 }
 *     responses:
 *       200: { description: Reservation updated }
 *   delete:
 *     tags: [Reservations]
 *     summary: Delete a reservation (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Reservation deleted }
 */
router.get('/:id', authenticate, reservationController.getOne);
router.put('/:id', authenticate, reservationUpdateRules, validate, reservationController.update);
router.delete('/:id', authenticate, reservationController.remove);

module.exports = router;
