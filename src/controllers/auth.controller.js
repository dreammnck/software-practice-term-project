// Auth vertical (owner: dream) — see docs/backlog.md EPIC 1, US-05..US-10.
// Models, JWT utils, and auth middleware are already wired up in src/models
// and src/middleware; implement each handler against those.
const { User } = require('../models');

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
  // TODO (US-06): verify credentials, issue a JWT via utils/jwt.generateToken.
  res.status(501).json({ message: 'Not implemented yet (US-06)' });
}

async function logout(req, res, next) {
  // TODO (US-07): revoke req.tokenPayload.jti via the RevokedToken model.
  res.status(501).json({ message: 'Not implemented yet (US-07)' });
}

async function me(req, res) {
  // TODO (US-08): return req.user.toSafeJSON().
  res.status(501).json({ message: 'Not implemented yet (US-08)' });
}

module.exports = { register, login, logout, me };
