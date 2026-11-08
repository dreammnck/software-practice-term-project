const test = require('node:test');
const assert = require('node:assert/strict');

const { Reservation, Restaurant } = require('../src/models');
const restaurantController = require('../src/controllers/restaurant.controller');
const reservationController = require('../src/controllers/reservation.controller');

function res() {
  return {
    statusCode: 200,
    body: undefined,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

const owner = { id: 1, role: 'user' };
const other = { id: 2, role: 'user' };
const admin = { id: 3, role: 'admin' };

function stubs(fn) {
  const orig = {
    rFind: Restaurant.findByPk, resFind: Reservation.findByPk,
    resAll: Reservation.findAll, resCreate: Reservation.create, resSum: Reservation.sum,
  };
  Reservation.sum = async () => 0;
  return async () => {
    try { await fn(); } finally {
      Restaurant.findByPk = orig.rFind; Reservation.findByPk = orig.resFind;
      Reservation.findAll = orig.resAll; Reservation.create = orig.resCreate;
      Reservation.sum = orig.resSum;
    }
  };
}

function fakeReservation(userId = 1) {
  return {
    id: 10, userId, restaurantId: 1, date: '2030-01-01', numberOfTables: 1,
    saved: false, destroyed: false,
    async save() { this.saved = true; },
    async destroy() { this.destroyed = true; },
  };
}

test('US-11 getById returns 404 for missing or malformed id', stubs(async () => {
  Restaurant.findByPk = async () => null;
  const r1 = res();
  await restaurantController.getById({ params: { id: '5' } }, r1);
  assert.equal(r1.statusCode, 404);
  const r2 = res();
  await restaurantController.getById({ params: { id: 'abc' } }, r2);
  assert.equal(r2.statusCode, 404);
}));

test('US-12 create → 404 for unknown restaurant, 201 owned by caller', stubs(async () => {
  Restaurant.findByPk = async () => null;
  const r1 = res();
  await reservationController.create({ user: owner, body: { restaurantId: 9, date: '2030-01-01', numberOfTables: 1 } }, r1);
  assert.equal(r1.statusCode, 404);

  Restaurant.findByPk = async () => ({ id: 9 });
  let created;
  Reservation.create = async (v) => { created = v; return { id: 1, ...v }; };
  const r2 = res();
  await reservationController.create({ user: owner, body: { restaurantId: 9, date: '2030-01-01', numberOfTables: 2 } }, r2);
  assert.equal(r2.statusCode, 201);
  assert.equal(created.userId, owner.id);
}));

test('US-13 list scopes to caller; admin sees all', stubs(async () => {
  let where;
  Reservation.findAll = async (opts) => { where = opts.where; return []; };
  await reservationController.list({ user: owner }, res());
  assert.deepEqual(where, { userId: 1 });
  await reservationController.list({ user: admin }, res());
  assert.deepEqual(where, {});
}));

test('US-13/14/15/19 non-owner gets 403 on get/update/delete without mutation', stubs(async () => {
  const row = fakeReservation(1);
  Reservation.findByPk = async () => row;
  for (const fn of ['getOne', 'update', 'remove']) {
    const r = res();
    await reservationController[fn]({ user: other, params: { id: '10' }, body: { numberOfTables: 3 } }, r);
    assert.equal(r.statusCode, 403, fn);
    assert.equal(r.body.reservation, undefined, fn);
  }
  assert.equal(row.saved, false);
  assert.equal(row.destroyed, false);
}));

test('US-14/15 owner can update and delete; US-16 admin bypasses ownership', stubs(async () => {
  for (const user of [owner, admin]) {
    const row = fakeReservation(1);
    Reservation.findByPk = async () => row;
    const r1 = res();
    await reservationController.update({ user, params: { id: '10' }, body: { numberOfTables: 3 } }, r1);
    assert.equal(r1.statusCode, 200);
    assert.equal(row.numberOfTables, 3);
    assert.equal(row.saved, true);
    const r2 = res();
    await reservationController.remove({ user, params: { id: '10' }, body: {} }, r2);
    assert.equal(r2.statusCode, 200);
    assert.equal(row.destroyed, true);
  }
}));

test('missing reservation → 404', stubs(async () => {
  Reservation.findByPk = async () => null;
  const r = res();
  await reservationController.getOne({ user: owner, params: { id: '10' } }, r);
  assert.equal(r.statusCode, 404);
}));

test('Req 3: a user may reserve at most 3 tables in total (create)', stubs(async () => {
  Restaurant.findByPk = async () => ({ id: 1 });
  let createdCount = 0;
  Reservation.create = async (v) => { createdCount += 1; return { id: 1, ...v }; };
  const body = { restaurantId: 1, date: '2030-01-01', numberOfTables: 2 };

  Reservation.sum = async () => 1; // 1 used, 2 more fits exactly
  const ok = res();
  await reservationController.create({ user: owner, body }, ok);
  assert.equal(ok.statusCode, 201);

  Reservation.sum = async () => 2; // 2 used, 2 more would be 4
  const over = res();
  await reservationController.create({ user: owner, body }, over);
  assert.equal(over.statusCode, 409);
  assert.equal(createdCount, 1);
}));

test('Req 3: update cannot push the owner above 3 tables; admin edit counts the owner', stubs(async () => {
  Reservation.sum = async () => 2; // other reservations of the owner
  const r = fakeReservation(1);
  Reservation.findByPk = async () => r;
  const over = res();
  await reservationController.update({ user: owner, params: { id: '10' }, body: { numberOfTables: 2 } }, over);
  assert.equal(over.statusCode, 409);
  assert.equal(r.saved, false);

  const adminOver = res();
  await reservationController.update({ user: admin, params: { id: '10' }, body: { numberOfTables: 2 } }, adminOver);
  assert.equal(adminOver.statusCode, 409);

  const ok = res();
  await reservationController.update({ user: owner, params: { id: '10' }, body: { numberOfTables: 1 } }, ok);
  assert.equal(ok.statusCode, 200);
  assert.equal(r.saved, true);
}));
