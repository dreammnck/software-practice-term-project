const test = require('node:test');
const assert = require('node:assert/strict');

const { User } = require('../src/models');

function userWithPassword() {
  return User.build({
    id: 81,
    name: 'Password Safety Test',
    telephone: '0812345678',
    email: 'password-safety@example.com',
    password: 'Secret123!',
    role: 'user',
    createdAt: new Date('2026-10-04T00:00:00.000Z'),
    updatedAt: new Date('2026-10-04T00:00:00.000Z'),
  });
}

test('User creation hook replaces plaintext with a bcrypt hash', async () => {
  const user = userWithPassword();

  await User.runHooks('beforeCreate', user);

  assert.notEqual(user.password, 'Secret123!');
  assert.match(user.password, /^\$2[aby]\$\d{2}\$/);
  assert.equal(await user.validatePassword('Secret123!'), true);
  assert.equal(await user.validatePassword('WrongPassword'), false);
});

test('all User JSON serialization excludes the password field', () => {
  const user = userWithPassword();

  assert.equal('password' in user.toSafeJSON(), false);
  assert.equal('password' in user.toJSON(), false);
  assert.equal('password' in JSON.parse(JSON.stringify(user)), false);
});

test('ordinary User queries exclude password unless login explicitly opts in', () => {
  assert.deepEqual(User._scope.attributes.exclude, ['password']);

  const loginScope = User.scope('withPassword');
  assert.ok(loginScope._scope.attributes.include.includes('password'));
});
