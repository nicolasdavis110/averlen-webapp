import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSnapshot } from '../app/data.js';
import { detectSubscriptions, subscriptionInputs, monthlyEquivalent } from './subscriptions.js';
import { fixture, householdId } from '../app/test/fixtures.mjs';

// Subscriptions is a port of RecurringDetector.detect on iOS. It was compared
// with the Swift code on 13,000 generated histories in three time zones; these
// keep the main behaviors and the live data path pinned.
const DAY = 86400000;
const ref = new Date(2026, 10, 11, 12).getTime();
const charge = (daysAgo, merchantName, amount, extra = {}) => ({ at: ref - daysAgo * DAY, merchantName, amount, isIncome: false, category: null, logo: '', ...extra });
const detect = (rows, options = {}) => detectSubscriptions(rows, { referenceAt: ref, ...options });

test('a listed brand billing monthly is a subscription at its latest price', () => {
  const items = detect([charge(70, 'Netflix', 15.49), charge(40, 'Netflix', 15.49), charge(10, 'Netflix', 17.99)]);
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, 17.99);
});
test('an unknown merchant only counts when added on the iPhone', () => {
  const rows = [charge(70, 'Corner Gym', 30), charge(40, 'Corner Gym', 30), charge(10, 'Corner Gym', 30)];
  assert.equal(detect(rows).length, 0);
  assert.equal(detect(rows, { manual: ['corner gym'] }).length, 1);
});
test('"not a subscription" on the iPhone hides it', () => {
  const rows = [charge(70, 'Netflix', 15.49), charge(40, 'Netflix', 15.49), charge(10, 'Netflix', 15.49)];
  assert.equal(detect(rows, { dismissed: ['netflix'] }).length, 0);
});
test('a cancelled subscription drops off', () => {
  assert.equal(detect([charge(160, 'Netflix', 15.49), charge(130, 'Netflix', 15.49), charge(100, 'Netflix', 15.49)]).length, 0);
});
test('two plans under one merchant are two rows', () => {
  const rows = [10, 40, 70, 100].flatMap(d => [charge(d, 'APPLE.COM/BILL', 2.99), charge(d + 3, 'APPLE.COM/BILL', 9.99)]);
  assert.deepEqual(detect(rows).map(item => item.amount), [9.99, 2.99]);
});
test('a yearly plan counts at its monthly cost', () => {
  const items = detect([charge(400, 'Audible', 149.5), charge(35, 'Audible', 149.5)]);
  assert.equal(items.length, 1);
  assert.ok(Math.abs(monthlyEquivalent(items[0]) - 149.5 * 30.44 / 365) < 0.5);
});

test('synced rows: exact times, Bills & Utilities left out, transfers ignored', () => {
  const data = fixture();
  const category = (id, slug) => ({ id, household_id: householdId, name: id, default_slug: slug, icon: 'tv.fill', color_hex: 'A78BFA' });
  data.payload.changes.categories = [category('fun', 'entertainment'), category('bills', 'bills_utilities')];
  const row = (id, date, merchant, amount, categoryId, extra = {}) => ({ id, household_id: householdId, date, merchant_name: merchant, amount, category_id: categoryId, is_income: false, ...extra });
  data.payload.changes.transactions = [
    ...['2026-08-20', '2026-09-20', '2026-10-20'].map((d, i) => row(`n${i}`, `${d}T15:30:00Z`, 'Netflix', 15.49, 'fun')),
    ...['2026-08-12', '2026-09-12', '2026-10-12'].map((d, i) => row(`p${i}`, `${d}T15:30:00Z`, 'Spotify', 11.99, 'bills')),
    ...['2026-08-05', '2026-09-05', '2026-10-05'].map((d, i) => row(`t${i}`, d, 'Hulu', 7.99, 'fun', { is_internal_transfer: true })),
  ];
  const normalized = normalizeSnapshot(data.profile, data.billing, data.payload);
  assert.equal(normalized.transactions.find(tx => tx.id === 'n0').at, Date.parse('2026-08-20T15:30:00Z'));
  const items = detectSubscriptions(subscriptionInputs(normalized.transactions), {
    categories: normalized.categories, referenceAt: Date.parse('2026-11-11T18:00:00Z'), skipCategoryIds: ['bills'],
  });
  assert.deepEqual(items.map(item => [item.merchantName, item.amount, item.categoryIcon]), [['Netflix', 15.49, 'tv.fill']]);
});
