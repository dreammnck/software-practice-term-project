const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'us09-test-secret';
process.env.JWT_EXPIRES_IN = '5m';

const { User, RevokedToken } = require('../src/models');
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

test('authenticate rejects missing and malformed Bearer headers', async () => {
  const invalidHeaders = [
    undefined,
    '',
    'Basic abc123',
    'Bearer',
    'Bearer ',
    'Bearer token extra',
    'bearer token',
  ];

  for (const authorization of invalidHeaders) {
    const res = responseRecorder();
    await authenticate(
      { headers: authorization === undefined ? {} : { authorization } },
      res,
      () => assert.fail(`header should be rejected: ${authorization}`)
    );
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Missing or invalid Authorization header' });
  }
});

test('authenticate rejects a token signed with a different secret', async () => {
  const token = jwt.sign(
    { sub: 41, role: 'user', jti: 'invalid-signature-jti' },
    'different-secret',
    { expiresIn: '5m' }
  );
  const res = responseRecorder();

  await authenticate(
    { headers: { authorization: `Bearer ${token}` } },
    res,
    () => assert.fail('invalid signature must not reach protected handlers')
  );

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Invalid or expired token' });
});

test('authenticate rejects an expired token', async () => {
  const token = jwt.sign(
    { sub: 42, role: 'user', jti: 'expired-token-jti' },
    process.env.JWT_SECRET,
    { expiresIn: -1 }
  );
  const res = responseRecorder();

  await authenticate(
    { headers: { authorization: `Bearer ${token}` } },
    res,
    () => assert.fail('expired token must not reach protected handlers')
  );

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Invalid or expired token' });
});

test('authenticate rejects a signed token missing required claims', async () => {
  const token = jwt.sign({ sub: 43, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const res = responseRecorder();

  await authenticate(
    { headers: { authorization: `Bearer ${token}` } },
    res,
    () => assert.fail('token without jti must not reach protected handlers')
  );

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Invalid or expired token' });
});

test('authenticate rejects a revoked token before loading its user', async () => {
  const originalFindRevoked = RevokedToken.findByPk;
  const originalFindUser = User.findByPk;
  const { token, jti } = generateToken({ id: 44, role: 'user' });
  RevokedToken.findByPk = async () => ({ jti });
  User.findByPk = async () => assert.fail('revoked token must not load a user');

  const res = responseRecorder();
  try {
    await authenticate(
      { headers: { authorization: `Bearer ${token}` } },
      res,
      () => assert.fail('revoked token must not reach protected handlers')
    );
  } finally {
    RevokedToken.findByPk = originalFindRevoked;
    User.findByPk = originalFindUser;
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Token has been revoked, please log in again' });
});

test('authenticate rejects a valid token when its user no longer exists', async () => {
  const originalFindRevoked = RevokedToken.findByPk;
  const originalFindUser = User.findByPk;
  const { token } = generateToken({ id: 45, role: 'user' });
  RevokedToken.findByPk = async () => null;
  User.findByPk = async () => null;

  const res = responseRecorder();
  try {
    await authenticate(
      { headers: { authorization: `Bearer ${token}` } },
      res,
      () => assert.fail('deleted user must not reach protected handlers')
    );
  } finally {
    RevokedToken.findByPk = originalFindRevoked;
    User.findByPk = originalFindUser;
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'User no longer exists' });
});

test('authenticate attaches a valid current user and verified payload', async () => {
  const originalFindRevoked = RevokedToken.findByPk;
  const originalFindUser = User.findByPk;
  const user = { id: 46, role: 'admin' };
  const { token, jti } = generateToken(user);
  RevokedToken.findByPk = async () => null;
  User.findByPk = async () => user;

  const req = { headers: { authorization: `Bearer ${token}` } };
  let reachedNext = false;
  try {
    await authenticate(req, responseRecorder(), () => {
      reachedNext = true;
    });
  } finally {
    RevokedToken.findByPk = originalFindRevoked;
    User.findByPk = originalFindUser;
  }

  assert.equal(reachedNext, true);
  assert.equal(req.user, user);
  assert.equal(req.tokenPayload.sub, user.id);
  assert.equal(req.tokenPayload.role, user.role);
  assert.equal(req.tokenPayload.jti, jti);
});

test('authenticate forwards database failures to global error handling', async () => {
  const originalFindRevoked = RevokedToken.findByPk;
  const databaseError = new Error('database unavailable');
  const { token } = generateToken({ id: 47, role: 'user' });
  RevokedToken.findByPk = async () => {
    throw databaseError;
  };

  let forwardedError;
  try {
    await authenticate(
      { headers: { authorization: `Bearer ${token}` } },
      responseRecorder(),
      (error) => {
        forwardedError = error;
      }
    );
  } finally {
    RevokedToken.findByPk = originalFindRevoked;
  }

  assert.equal(forwardedError, databaseError);
});
