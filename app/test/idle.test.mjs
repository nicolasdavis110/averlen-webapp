import test from 'node:test';
import assert from 'node:assert/strict';
import { createIdleGuard, IDLE_TIMEOUT_MS, ACTIVITY_KEY } from '../idle.js';

function memoryStorage() { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), map }; }

test('signs out after 30 minutes without activity', () => {
  let now = 1_000_000; let expired = 0; const storage = memoryStorage();
  const idle = createIdleGuard({ storage, now: () => now, onExpire: () => expired++ });
  idle.touch(true);
  now += IDLE_TIMEOUT_MS; assert.equal(idle.check(), false);
  now += 1; assert.equal(idle.check(), true); assert.equal(expired, 1);
  // Expiry restarts the clock so the next sign-in isn't signed out at once.
  assert.equal(idle.check(), false);
});

test('activity keeps the session alive', () => {
  let now = 0; let expired = 0; const storage = memoryStorage();
  const idle = createIdleGuard({ storage, now: () => now + 1, onExpire: () => expired++ });
  idle.touch(true);
  for (let i = 0; i < 10; i++) { now += 20 * 60 * 1000; idle.touch(); assert.equal(idle.check(), false); }
  assert.equal(expired, 0);
});

test('a tab reopened after the limit is expired; a fresh or missing stamp is not', () => {
  const storage = memoryStorage(); let now = 5_000_000;
  assert.equal(createIdleGuard({ storage, now: () => now, onExpire() {} }).expired(), false);
  storage.setItem(ACTIVITY_KEY, String(now - IDLE_TIMEOUT_MS - 1));
  assert.equal(createIdleGuard({ storage, now: () => now, onExpire() {} }).expired(), true);
  storage.setItem(ACTIVITY_KEY, String(now - 60_000));
  assert.equal(createIdleGuard({ storage, now: () => now, onExpire() {} }).expired(), false);
  storage.setItem(ACTIVITY_KEY, 'garbage');
  assert.equal(createIdleGuard({ storage, now: () => now, onExpire() {} }).expired(), false);
});

test('blocked storage still times out within the open tab', () => {
  let now = 10; let expired = 0;
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const idle = createIdleGuard({ storage: blocked, now: () => now, onExpire: () => expired++ });
  idle.touch(true); now += IDLE_TIMEOUT_MS + 1;
  assert.equal(idle.check(), true); assert.equal(expired, 1);
});

test('only a timestamp is stored', () => {
  const storage = memoryStorage();
  createIdleGuard({ storage, now: () => 42, onExpire() {} }).touch(true);
  assert.deepEqual([...storage.map.entries()], [[ACTIVITY_KEY, '42']]);
});

test('the first click after a long sleep signs out instead of extending the session', () => {
  let now = 10_000_000; let expired = 0; const storage = memoryStorage();
  const idle = createIdleGuard({ storage, now: () => now, onExpire: () => expired++ });
  idle.touch(true);
  // Laptop sleeps with the tab open: no timer runs, then a click on waking.
  now += IDLE_TIMEOUT_MS + 5 * 60 * 1000;
  idle.touch();
  assert.equal(expired, 1);
  // The 60-second timer that fires next must not count it twice.
  assert.equal(idle.check(), false); assert.equal(expired, 1);
});
