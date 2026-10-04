const { verifyToken } = require('../utils/jwt');
const { User, RevokedToken } = require('../models');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerMatch = typeof authHeader === 'string' && authHeader.match(/^Bearer ([^\s]+)$/);
  if (!bearerMatch) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = bearerMatch[1];
  let payload;

  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  if (
    payload.sub == null ||
    typeof payload.jti !== 'string' ||
    payload.jti.length === 0 ||
    !['user', 'admin'].includes(payload.role)
  ) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const revoked = await RevokedToken.findByPk(payload.jti);
    if (revoked) {
      return res.status(401).json({ message: 'Token has been revoked, please log in again' });
    }

    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    req.tokenPayload = payload;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { authenticate };
