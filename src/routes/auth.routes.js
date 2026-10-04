const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, telephone, email, password]
 *             properties:
 *               name: { type: string }
 *               telephone: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: Registration successful }
 *       409: { description: Email already registered }
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('telephone').trim().notEmpty().withMessage('telephone is required'),
    body('email').trim().isEmail().withMessage('a valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  ],
  validate,
  authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and obtain a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, JWT returned }
 *       401: { description: Invalid credentials }
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('a valid email is required'),
    body('password').notEmpty().withMessage('password is required'),
  ],
  validate,
  authController.login
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out (revokes the current JWT)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logout successful }
 *       401: { description: Missing/invalid token }
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
