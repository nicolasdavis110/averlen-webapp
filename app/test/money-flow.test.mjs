import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSnapshot } from '../data.js';
import { categories, totals, categoryTotals, spendingChange } from '../../preview/model.js';
import { fixture, householdId } from './fixtures.mjs';

// The scenarios in ios-safety-tests/money-flow-totals.py (MoneyFlow on iOS),
// run through the same path as the live site: synced rows → normalizeSnapshot
// → the shared totals. Amounts are in cents.
function load(transactions, { includeInvestments = false } = {}) {
  const data = fixture();
  const category = (id, extra = {}) => ({ id, household_id: householdId, name: id, ...extra });
  data.payload.changes.categories = [
    category('groceries'), category('shopping'), category('salary', { default_slug: 'income' }),
    category('invest', { default_slug: 'investments' }), category('transfers', { default_slug: 'internal_transfers' }),
    category('excluded', { is_excluded: true }),
  ];
  data.payload.changes.transactions = transactions.map(([amount, categoryId, extra = {}], i) => ({
    id: `tx-${i}`, household_id: householdId, date: '2026-10-15T12:00:00Z', merchant_name: 'Example',
    amount, category_id: categoryId, is_income: false, ...extra,
  }));
  if (includeInvestments) data.payload.changes.user_preferences.push({ id: 'pref', household_id: householdId, pref_key: 'candor_include_investments', pref_value: { v: true } });
  const normalized = normalizeSnapshot(data.profile, data.billing, data.payload);
  // The live app swaps the shared category list in the same way (preview/app.js).
  categories.length = 0; categories.push(...normalized.categories);
  return normalized.transactions;
}
const saved = categories.map(cat => ({ ...cat }));
test.after(() => { categories.length = 0; categories.push(...saved); });
const income = { is_income: true };
const byId = rows => Object.fromEntries(categoryTotals(rows).map(cat => [cat.id, cat.cents]));

test('a return comes off its category instead of counting as income', () => {
  const rows = load([[100, 'groceries'], [30, 'groceries', income], [2000, 'salary', income]]);
  assert.deepEqual(totals(rows), { income: 200000, spending: 7000, net: 193000 });
  assert.deepEqual(byId(rows), { groceries: 7000 });
});
test('more back than spent: the category drops off and the rest is income', () => {
  const rows = load([[40, 'shopping'], [100, 'shopping', income], [25, 'groceries']]);
  assert.deepEqual(totals(rows), { income: 6000, spending: 2500, net: 3500 });
  assert.deepEqual(byId(rows), { groceries: 2500 });
  assert.equal(totals(rows).net, 10000 - 4000 - 2500);
});
test('uncategorized money in is still income', () => {
  const rows = load([[50, null, income], [10, null]]);
  assert.deepEqual(totals(rows), { income: 5000, spending: 1000, net: 4000 });
});
test('investments off are left out both ways; on, withdrawals come off deposits', () => {
  const investRows = [[500, 'invest'], [200, 'invest', income]];
  assert.deepEqual(totals(load(investRows)), { income: 0, spending: 0, net: 0 });
  assert.deepEqual(totals(load(investRows, { includeInvestments: true })), { income: 0, spending: 30000, net: -30000 });
});
test('transfers, deleted rows and excluded categories never count', () => {
  const rows = load([
    [900, 'shopping', { is_internal_transfer: true }], [900, 'transfers'],
    [900, 'salary', { is_income: true, is_deleted: true }], [900, 'excluded'], [900, 'excluded', income],
  ]);
  assert.deepEqual(totals(rows), { income: 0, spending: 0, net: 0 });
});
test("a day's running figure moves the same way", () => {
  const [refund, salary] = load([[30, 'groceries', income], [30, 'salary', income]]);
  assert.equal(spendingChange(refund), -3000);
  assert.equal(spendingChange(salary), 0);
});
