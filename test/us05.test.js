const test = require('node:test');
const assert = require('node:assert/strict');

const { User } = require('../src/models');
const { register } = require('../src/controllers/auth.controller');

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

test('register creates a user-role account and returns a safe 201 response', async () => {
  const originalCreate = User.create;
  let createPayload;
  User.create = async (payload) => {
    createPayload = payload;
    return {
      toSafeJSON: () => ({
        id: 7,
        name: payload.name,
        telephone: payload.telephone,
        email: payload.email,
        role: 'user',
      }),
    };
  };

  const req = {
    body: {
      name: 'Test User',
      telephone: '0812345678',
      email: 'test@example.com',
      password: 'Secret123!',
      role: 'admin',
    },
  };
  const res = responseRecorder();

  try {
    await register(req, res, assert.fail);
  } finally {
    User.create = originalCreate;
  }

  assert.deepEqual(createPayload, {
    name: 'Test User',
    telephone: '0812345678',
    email: 'test@example.com',
    password: 'Secret123!',
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, 'Registration successful');
  assert.equal(res.body.user.role, 'user');
  assert.equal('password' in res.body.user, false);
});

test('register returns 409 for an existing email', async () => {
  const originalCreate = User.create;
  User.create = async () => {
    const error = new Error('duplicate');
    error.name = 'SequelizeUniqueConstraintError';
    throw error;
  };

  const res = responseRecorder();
  try {
    await register(
      { body: { name: 'Duplicate', telephone: '0800000000', email: 'used@example.com', password: 'Secret123!' } },
      res,
      assert.fail
    );
  } finally {
    User.create = originalCreate;
  }

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { message: 'Email already registered' });
});

test('register forwards unexpected database errors to global error handling', async () => {
  const originalCreate = User.create;
  const databaseError = new Error('database unavailable');
  User.create = async () => {
    throw databaseError;
  };

  let forwardedError;
  try {
    await register(
      { body: { name: 'Test', telephone: '0800000000', email: 'test@example.com', password: 'Secret123!' } },
      responseRecorder(),
      (error) => {
        forwardedError = error;
      }
    );
  } finally {
    User.create = originalCreate;
  }

  assert.equal(forwardedError, databaseError);
});

test('User creation hook hashes passwords and safe JSON excludes the hash', async () => {
  const user = User.build({
    id: 8,
    name: 'Hook Test',
    telephone: '0899999999',
    email: 'hook@example.com',
    password: 'Secret123!',
  });

  await User.runHooks('beforeCreate', user);

  assert.notEqual(user.password, 'Secret123!');
  assert.equal(await user.validatePassword('Secret123!'), true);
  assert.equal('password' in user.toSafeJSON(), false);
  assert.equal(user.role, 'user');
});
