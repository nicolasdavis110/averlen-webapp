import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSnapshot } from '../app/data.js';
import { categories, flowOf } from './model.js';
import { generate, moneyAheadInputs, webTransactions, dayNumber, dayKey, brandKey, subscriptionMatch, normalizeMerchant } from './money-ahead.js';
import { fixture, householdId } from '../app/test/fixtures.mjs';

// Coming up is a port of MoneyAhead.swift. A wider Swift-vs-JavaScript
// comparison (15,000 generated histories, every merchant pattern) was run when
// it was ported; these keep the main behaviors and the live data path pinned.
let n = 0;
const tx = (date, merchant, amount, kind = 'bill', isKnownBill = true) => ({ id: `T${n++}`, date: dayNumber(date), merchant, amount, kind, isKnownBill });
const run = (rows, today = '2026-11-06') => generate(rows, dayNumber(today));
const dates = report => report.events.map(event => dayKey(event.date));

test('a monthly bill is estimated on its day', () => {
  const report = run([tx('2026-08-15', 'Netflix', 20), tx('2026-09-15', 'Netflix', 20), tx('2026-10-15', 'Netflix', 20)]);
  assert.deepEqual(dates(report), ['2026-11-15']);
  assert.equal(report.events[0].amount, 20);
});
test('two payments are not enough, and a stopped bill is not rolled forward', () => {
  assert.deepEqual(run([tx('2026-09-15', 'Netflix', 20), tx('2026-10-15', 'Netflix', 20)]).events, []);
  assert.deepEqual(run([tx('2026-08-15', 'Netflix', 20), tx('2026-09-15', 'Netflix', 20), tx('2026-10-15', 'Netflix', 20)], '2026-12-06').events, []);
});
test('pay on the 1st and 15th, moved off weekends', () => {
  const pay = ['2026-08-14', '2026-09-01', '2026-09-15', '2026-10-01', '2026-10-15', '2026-10-30'].map(d => tx(d, 'Job', 2000, 'income'));
  assert.deepEqual(dates(run(pay, '2026-11-03')), ['2026-11-13', '2026-12-01']);
});
test('a price change is reported with the old price', () => {
  const change = run([tx('2026-09-01', 'Netflix', 20), tx('2026-10-01', 'Netflix', 20), tx('2026-11-01', 'Netflix', 25)]).changes[0];
  assert.equal(change.reason, 'amount');
  assert.equal(change.previousAmount, 20);
  assert.equal(change.amount, 25);
});
test('an annual plan is estimated and flagged as a renewal', () => {
  const report = run([tx('2024-11-10', 'Netflix', 100), tx('2025-11-10', 'Netflix', 100)]);
  assert.equal(report.events[0].isAnnual, true);
  assert.equal(report.changes[0].reason, 'renewal');
});
test('a possible duplicate charge is found', () => {
  const rows = ['2026-09-01', '2026-10-01', '2026-11-01', '2026-11-02'].map(d => tx(d, 'Netflix', 20));
  assert.equal(run(rows).changes[0].reason, 'possibleDuplicate');
});
test('repeat shopping is not a bill, a steady price is', () => {
  const shopping = [['2026-07-12', 60], ['2026-08-11', 85], ['2026-09-12', 44], ['2026-10-13', 71]].map(([d, a]) => tx(d, 'Corner Grocer', a, 'bill', false));
  assert.deepEqual(run(shopping).events, []);
  const steady = ['2026-07-19', '2026-08-19', '2026-09-19', '2026-10-19'].map(d => tx(d, 'Ring Club', 6, 'bill', false));
  assert.deepEqual(dates(run(steady)), ['2026-11-19']);
});
test('merchant names match the iPhone', () => {
  assert.equal(brandKey('Northwind Insurance'), brandKey('NORTHWIND INS 800-555-0100'));
  assert.notEqual(brandKey('City Water'), brandKey('City Gas'));
  assert.equal(normalizeMerchant('PAYPAL *SPOTIFY'), 'spotify');
  assert.equal(subscriptionMatch('NETFLIX.COM'), 'guaranteed');
  assert.equal(subscriptionMatch('PEACOCK 704-555-0100'), 'listed');
  assert.equal(subscriptionMatch('Calm Waters Spa'), 'none');
});

test('synced rows: utilities, pay and the iPhone’s subscription choices', () => {
  const data = fixture();
  const category = (id, slug) => ({ id, household_id: householdId, name: id, default_slug: slug });
  data.payload.changes.categories = [category('bills', 'bills_utilities'), category('pay', 'income'), category('fun', 'entertainment')];
  const row = (id, date, merchant, amount, categoryId, extra = {}) => ({ id, household_id: householdId, date: `${date}T18:00:00Z`, merchant_name: merchant, amount, category_id: categoryId, is_income: false, ...extra });
  data.payload.changes.transactions = [
    ...['08', '09', '10'].map(m => row(`power-${m}`, `2026-${m}-12`, 'Bright Power', 104.5, 'bills')),
    ...['08', '09', '10'].map(m => row(`stream-${m}`, `2026-${m}-20`, 'Streamly Plus', 9.99, 'fun')),
    ...['08', '09', '10'].map(m => row(`club-${m}`, `2026-${m}-03`, 'Netflix', 15.49, 'fun')),
    ...['2026-10-09', '2026-10-23', '2026-11-06'].map((d, i) => row(`pay-${i}`, d, 'Acme Payroll', 2500, 'pay', { is_income: true })),
  ];
  data.payload.changes.recurring_overrides = [
    { id: 'o1', household_id: householdId, merchant_key: 'streamly plus', override_type: 'manual', version: 1 },
    { id: 'o2', household_id: householdId, merchant_key: 'netflix', override_type: 'dismissed', version: 2 },
  ];
  const normalized = normalizeSnapshot(data.profile, data.billing, data.payload);
  assert.deepEqual(normalized.plans.recurring, { manual: ['streamly plus'], dismissed: ['netflix'] });
  const saved = categories.splice(0, categories.length, ...normalized.categories);
  try {
    const inputs = moneyAheadInputs(webTransactions(normalized.transactions, { categoryOf: id => categories.find(cat => cat.id === id), flowOf }), normalized.plans.recurring);
    const report = generate(inputs, dayNumber('2026-11-07'));
    const names = report.events.map(event => `${event.merchant} ${dayKey(event.date)}`);
    // Utilities count by category, "Streamly Plus" because it was added as a
    // subscription on the iPhone; Netflix was marked "not a subscription".
    assert.deepEqual(names, ['Bright Power 2026-11-12', 'Acme Payroll 2026-11-20', 'Streamly Plus 2026-11-20', 'Acme Payroll 2026-12-04']);
  } finally { categories.splice(0, categories.length, ...saved); }
});
