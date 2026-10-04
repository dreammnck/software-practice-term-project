const { performance } = require('node:perf_hooks');

const baseUrl = (process.env.PERF_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const paths = (process.env.PERF_PATHS || '/health')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);
const iterations = Number.parseInt(process.env.PERF_ITERATIONS || '30', 10);
const warmupIterations = Number.parseInt(process.env.PERF_WARMUP || '5', 10);
const targetMs = Number.parseFloat(process.env.PERF_TARGET_MS || '3000');

function percentile(sortedSamples, value) {
  const index = Math.max(0, Math.ceil((value / 100) * sortedSamples.length) - 1);
  return sortedSamples[index];
}

async function acquireToken() {
  if (process.env.PERF_BEARER_TOKEN) return process.env.PERF_BEARER_TOKEN;
  if (!process.env.PERF_LOGIN_EMAIL || !process.env.PERF_LOGIN_PASSWORD) return null;

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: process.env.PERF_LOGIN_EMAIL,
      password: process.env.PERF_LOGIN_PASSWORD,
    }),
  });
  const body = await response.json();
  if (!response.ok || !body.token) {
    throw new Error(`Benchmark login failed with HTTP ${response.status}`);
  }
  return body.token;
}

async function timedRequest(path, token) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  await response.arrayBuffer();
  const durationMs = performance.now() - startedAt;

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  return durationMs;
}

async function measure(path, token) {
  for (let index = 0; index < warmupIterations; index += 1) {
    await timedRequest(path, token);
  }

  const samples = [];
  for (let index = 0; index < iterations; index += 1) {
    samples.push(await timedRequest(path, token));
  }

  const sorted = samples.toSorted((left, right) => left - right);
  return {
    path,
    samples: iterations,
    minMs: Number(sorted[0].toFixed(2)),
    averageMs: Number((samples.reduce((sum, value) => sum + value, 0) / samples.length).toFixed(2)),
    p50Ms: Number(percentile(sorted, 50).toFixed(2)),
    p95Ms: Number(percentile(sorted, 95).toFixed(2)),
    maxMs: Number(sorted.at(-1).toFixed(2)),
    targetMs,
  };
}

async function main() {
  if (!Number.isInteger(iterations) || iterations < 1) throw new Error('PERF_ITERATIONS must be a positive integer');
  if (!Number.isInteger(warmupIterations) || warmupIterations < 0) throw new Error('PERF_WARMUP must be a non-negative integer');
  if (!Number.isFinite(targetMs) || targetMs <= 0) throw new Error('PERF_TARGET_MS must be a positive number');

  const token = await acquireToken();
  const results = [];
  for (const path of paths) results.push(await measure(path, token));

  console.table(results);

  const failed = results.filter(({ maxMs }) => maxMs >= targetMs);
  if (failed.length > 0) {
    throw new Error(
      `Response-time target missed for ${failed.map(({ path }) => path).join(', ')} (target: < ${targetMs} ms)`
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
