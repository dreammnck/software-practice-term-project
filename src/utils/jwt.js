const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user.id, role: user.role, jti },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
  return { token, jti };
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
