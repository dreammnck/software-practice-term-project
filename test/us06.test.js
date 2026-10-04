const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'us06-test-secret';
process.env.JWT_EXPIRES_IN = '5m';

const { User } = require('../src/models');
const { login } = require('../src/controllers/auth.controller');
const { verifyToken } = require('../src/utils/jwt');

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

function authenticatedUser(passwordMatches = true) {
  return {
    id: 11,
    name: 'Login Test',
    telephone: '0812345678',
    email: 'login@example.com',
    role: 'user',
    validatePassword: async () => passwordMatches,
    toSafeJSON() {
      const { id, name, telephone, email, role } = this;
      return { id, name, telephone, email, role };
    },
  };
}

test('login verifies credentials and returns a signed JWT plus safe user', async () => {
  const originalFindOne = User.findOne;
  const user = authenticatedUser();
  let query;
  User.findOne = async (options) => {
    query = options;
    return user;
  };

  const res = responseRecorder();
  try {
    await login(
      { body: { email: 'login@example.com', password: 'Secret123!' } },
      res,
      assert.fail
    );
  } finally {
    User.findOne = originalFindOne;
  }

  assert.deepEqual(query, { where: { email: 'login@example.com' } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Login successful');
  assert.equal('password' in res.body.user, false);

  const payload = verifyToken(res.body.token);
  assert.equal(payload.sub, user.id);
  assert.equal(payload.role, user.role);
  assert.equal(typeof payload.jti, 'string');
  assert.ok(payload.jti.length > 0);
});

test('login returns the same 401 response for an unknown email', async () => {
  const originalFindOne = User.findOne;
  User.findOne = async () => null;

  const res = responseRecorder();
  try {
    await login(
      { body: { email: 'missing@example.com', password: 'Secret123!' } },
      res,
      assert.fail
    );
  } finally {
    User.findOne = originalFindOne;
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Invalid email or password' });
});

test('login returns the same 401 response for a wrong password', async () => {
  const originalFindOne = User.findOne;
  User.findOne = async () => authenticatedUser(false);

  const res = responseRecorder();
  try {
    await login(
      { body: { email: 'login@example.com', password: 'WrongPassword' } },
      res,
      assert.fail
    );
  } finally {
    User.findOne = originalFindOne;
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Invalid email or password' });
});

test('login forwards unexpected database errors to global error handling', async () => {
  const originalFindOne = User.findOne;
  const databaseError = new Error('database unavailable');
  User.findOne = async () => {
    throw databaseError;
  };

  let forwardedError;
  try {
    await login(
      { body: { email: 'login@example.com', password: 'Secret123!' } },
      responseRecorder(),
      (error) => {
        forwardedError = error;
      }
    );
  } finally {
    User.findOne = originalFindOne;
  }

  assert.equal(forwardedError, databaseError);
});
