const { verifyToken } = require('../utils/jwt');
const { User, RevokedToken } = require('../models');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);

    const revoked = await RevokedToken.findOne({ jti: payload.jti });
    if (revoked) {
      return res.status(401).json({ message: 'Token has been revoked, please log in again' });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
