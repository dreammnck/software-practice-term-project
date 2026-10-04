const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'us08-test-secret';
process.env.JWT_EXPIRES_IN = '5m';

const { User, RevokedToken } = require('../src/models');
const { me } = require('../src/controllers/auth.controller');
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

function testUser() {
  return {
    id: 31,
    name: 'Profile Test',
    telephone: '0812345678',
    email: 'profile@example.com',
    password: '$2b$10$not-returned',
    role: 'user',
    createdAt: new Date('2026-10-04T00:00:00.000Z'),
    updatedAt: new Date('2026-10-04T00:00:00.000Z'),
    toSafeJSON() {
      const { id, name, telephone, email, role, createdAt, updatedAt } = this;
      return { id, name, telephone, email, role, createdAt, updatedAt };
    },
  };
}

test('me returns the authenticated user profile without a password', () => {
  const user = testUser();
  const res = responseRecorder();

  me({ user }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.id, user.id);
  assert.equal(res.body.user.email, user.email);
  assert.equal(res.body.user.role, 'user');
  assert.equal('password' in res.body.user, false);
});

test('authenticate loads the JWT subject and makes it available to me', async () => {
  const originalFindRevoked = RevokedToken.findByPk;
  const originalFindUser = User.findByPk;
  const user = testUser();
  const { token, jti } = generateToken(user);
  let checkedJti;
  let loadedUserId;

  RevokedToken.findByPk = async (candidateJti) => {
    checkedJti = candidateJti;
    return null;
  };
  User.findByPk = async (candidateUserId) => {
    loadedUserId = candidateUserId;
    return user;
  };

  const req = { headers: { authorization: `Bearer ${token}` } };
  const authRes = responseRecorder();
  let reachedProfile = false;
  try {
    await authenticate(req, authRes, () => {
      reachedProfile = true;
    });
  } finally {
    RevokedToken.findByPk = originalFindRevoked;
    User.findByPk = originalFindUser;
  }

  assert.equal(reachedProfile, true);
  assert.equal(checkedJti, jti);
  assert.equal(loadedUserId, user.id);
  assert.equal(req.user, user);
  assert.equal(req.tokenPayload.sub, user.id);

  const profileRes = responseRecorder();
  me(req, profileRes);
  assert.equal(profileRes.statusCode, 200);
  assert.equal(profileRes.body.user.email, user.email);
  assert.equal('password' in profileRes.body.user, false);
});
