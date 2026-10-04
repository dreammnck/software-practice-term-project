const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'us07-test-secret';
process.env.JWT_EXPIRES_IN = '5m';

const { User, RevokedToken } = require('../src/models');
const { logout } = require('../src/controllers/auth.controller');
const { authenticate } = require('../src/middleware/auth.middleware');
const { generateToken } = require('../src/utils/jwt');

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('logout stores the token jti until its JWT expiry and returns 200', async () => {
  const originalCreate = RevokedToken.create;
  let storedToken;
  RevokedToken.create = async (token) => {
    storedToken = token;
    return token;
  };

  const exp = Math.floor(Date.now() / 1000) + 300;
  const res = responseRecorder();
  try {
    await logout({ tokenPayload: { jti: 'token-id-123', exp } }, res, assert.fail);
  } finally {
    RevokedToken.create = originalCreate;
  }

  assert.equal(storedToken.jti, 'token-id-123');
  assert.equal(storedToken.expiresAt.getTime(), exp * 1000);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'Logout successful' });
});

test('logout forwards unexpected persistence errors to global error handling', async () => {
  const originalCreate = RevokedToken.create;
  const databaseError = new Error('database unavailable');
  RevokedToken.create = async () => {
    throw databaseError;
  };

  let forwardedError;
  try {
    await logout(
      { tokenPayload: { jti: 'token-id-456', exp: Math.floor(Date.now() / 1000) + 300 } },
      responseRecorder(),
      (error) => {
        forwardedError = error;
      }
    );
  } finally {
    RevokedToken.create = originalCreate;
  }

  assert.equal(forwardedError, databaseError);
});

test('authenticate rejects a JWT after its jti has been revoked', async () => {
  const originalFindRevoked = RevokedToken.findByPk;
  const originalFindUser = User.findByPk;
  const { token, jti } = generateToken({ id: 21, role: 'user' });
  let checkedJti;

  RevokedToken.findByPk = async (candidateJti) => {
    checkedJti = candidateJti;
    return { jti: candidateJti };
  };
  User.findByPk = async () => assert.fail('revoked token must be rejected before loading a user');

  const res = responseRecorder();
  try {
    await authenticate(
      { headers: { authorization: `Bearer ${token}` } },
      res,
      () => assert.fail('revoked token must not reach the next middleware')
    );
  } finally {
    RevokedToken.findByPk = originalFindRevoked;
    User.findByPk = originalFindUser;
  }

  assert.equal(checkedJti, jti);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Token has been revoked, please log in again' });
});
