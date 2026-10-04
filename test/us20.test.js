const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');

process.env.NODE_ENV = 'test';

const app = require('../src/app');
const { Reservation } = require('../src/models');

test('reservation foreign keys have database indexes', () => {
  const indexedFields = Reservation.options.indexes.map(({ fields }) => fields).flat();
  assert.ok(indexedFields.includes('userId'));
  assert.ok(indexedFields.includes('restaurantId'));
});

test('local health responses stay below the 3-second NFR and 150 ms target', async () => {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/health`;

  try {
    for (let index = 0; index < 5; index += 1) {
      const response = await fetch(url);
      assert.equal(response.status, 200);
      await response.arrayBuffer();
    }

    const durations = [];
    for (let index = 0; index < 30; index += 1) {
      const startedAt = performance.now();
      const response = await fetch(url);
      await response.arrayBuffer();
      durations.push(performance.now() - startedAt);
      assert.equal(response.status, 200);
    }

    const sorted = durations.toSorted((left, right) => left - right);
    const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
    const max = sorted.at(-1);

    assert.ok(max < 3000, `maximum response time ${max.toFixed(2)} ms exceeded 3000 ms`);
    assert.ok(p95 < 150, `p95 response time ${p95.toFixed(2)} ms exceeded 150 ms`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
      server.closeAllConnections();
    });
  }
});
