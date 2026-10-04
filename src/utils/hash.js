const bcrypt = require('bcrypt');

const DEFAULT_SALT_ROUNDS = 10;

function hashPassword(plainPassword, saltRounds = DEFAULT_SALT_ROUNDS) {
  return bcrypt.hash(plainPassword, saltRounds);
}

function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

module.exports = { hashPassword, comparePassword, DEFAULT_SALT_ROUNDS };
