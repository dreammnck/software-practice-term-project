// Auth vertical (owner: dream) — see docs/backlog.md EPIC 1, US-05..US-10.
// Models, JWT utils, and auth middleware are already wired up in src/models
// and src/middleware; implement each handler against those.

async function register(req, res, next) {
  // TODO (US-05): hash + create the user via the User model, 409 on duplicate email.
  res.status(501).json({ message: 'Not implemented yet (US-05)' });
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
