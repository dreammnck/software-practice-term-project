const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.JWT_SECRET = 'foundation-test-secret';
process.env.JWT_EXPIRES_IN = '5m';

const { hashPassword, comparePassword } = require('../src/utils/hash');
const { generateToken, verifyToken } = require('../src/utils/jwt');
const { notFound, errorHandler } = require('../src/middleware/error');
const { User, Restaurant, Reservation, RevokedToken } = require('../src/models');

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

test('bcrypt hash and compare utilities work in isolation', async () => {
  const passwordHash = await hashPassword('CorrectHorseBatteryStaple1!');
  assert.notEqual(passwordHash, 'CorrectHorseBatteryStaple1!');
  assert.equal(await comparePassword('CorrectHorseBatteryStaple1!', passwordHash), true);
  assert.equal(await comparePassword('wrong-password', passwordHash), false);
});

test('JWT sign and verify utilities work in isolation', () => {
  const { token, jti } = generateToken({ id: 42, role: 'user' });
  const payload = verifyToken(token);
  assert.equal(payload.sub, 42);
  assert.equal(payload.role, 'user');
  assert.equal(payload.jti, jti);
});

test('global error middleware returns consistent JSON responses', () => {
  const missing = responseRecorder();
  notFound({ originalUrl: '/missing' }, missing);
  assert.equal(missing.statusCode, 404);
  assert.deepEqual(missing.body, { message: 'Route /missing not found' });

  const failure = responseRecorder();
  const previousConsoleError = console.error;
  console.error = () => {};
  try {
    errorHandler({ status: 418, message: 'Teapot' }, {}, failure, () => {});
  } finally {
    console.error = previousConsoleError;
  }
  assert.equal(failure.statusCode, 418);
  assert.deepEqual(failure.body, { message: 'Teapot' });
});

test('all four Sequelize tables expose the required columns and relationships', () => {
  assert.deepEqual(
    Object.keys(User.rawAttributes).filter((name) => !['createdAt', 'updatedAt'].includes(name)),
    ['id', 'name', 'telephone', 'email', 'password', 'role']
  );
  assert.deepEqual(
    Object.keys(Restaurant.rawAttributes).filter((name) => !['createdAt', 'updatedAt'].includes(name)),
    ['id', 'name', 'address', 'telephone', 'openTime', 'closeTime']
  );
  assert.deepEqual(
    Object.keys(Reservation.rawAttributes).filter((name) => !['createdAt', 'updatedAt'].includes(name)),
    ['id', 'date', 'numberOfTables', 'userId', 'restaurantId']
  );
  assert.deepEqual(Object.keys(RevokedToken.rawAttributes), ['jti', 'expiresAt']);
  assert.equal(Reservation.associations.User.foreignKey, 'userId');
  assert.equal(Reservation.associations.Restaurant.foreignKey, 'restaurantId');
});

test('.env.example documents every environment variable used by src', () => {
  const root = path.resolve(__dirname, '..');
  const envKeys = new Set(
    fs.readFileSync(path.join(root, '.env.example'), 'utf8')
      .split(/\r?\n/)
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => line.slice(0, line.indexOf('=')))
  );
  const sourceFiles = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.name.endsWith('.js')) sourceFiles.push(target);
    }
  };
  visit(path.join(root, 'src'));
  const usedKeys = new Set();
  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/process\.env\.([A-Z0-9_]+)/g)) usedKeys.add(match[1]);
  }
  assert.deepEqual([...usedKeys].filter((key) => !envKeys.has(key)), []);
});

test('Postman collection and environment are valid importable skeletons', () => {
  const root = path.resolve(__dirname, '..');
  const collection = JSON.parse(
    fs.readFileSync(path.join(root, 'postman/RestaurantReservation.postman_collection.json'), 'utf8')
  );
  const environment = JSON.parse(
    fs.readFileSync(path.join(root, 'postman/RestaurantReservation.postman_environment.json'), 'utf8')
  );
  assert.equal(collection.info.schema, 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
  assert.ok(Array.isArray(collection.item));
  assert.equal(environment._postman_variable_scope, 'environment');
  assert.ok(environment.values.some(({ key }) => key === 'baseUrl'));
});
