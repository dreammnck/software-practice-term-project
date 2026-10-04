// Auth vertical (owner: dream) — see docs/backlog.md EPIC 1, US-05..US-10.
// Models, JWT utils, and auth middleware are already wired up in src/models
// and src/middleware; implement each handler against those.
const { User, RevokedToken } = require('../models');
const { generateToken } = require('../utils/jwt');

async function register(req, res, next) {
  const { name, telephone, email, password } = req.body;

  try {
    const user = await User.create({ name, telephone, email, password });

    return res.status(201).json({
      message: 'Registration successful',
      user: user.toSafeJSON(),
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email already registered' });
    }

    return next(err);
  }
}

async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const { token } = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  const { jti, exp } = req.tokenPayload;

  try {
    await RevokedToken.create({
      jti,
      expiresAt: new Date(exp * 1000),
    });

    return res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  // TODO (US-08): return req.user.toSafeJSON().
  res.status(501).json({ message: 'Not implemented yet (US-08)' });
}

module.exports = { register, login, logout, me };
