import test from 'node:test';
import assert from 'node:assert/strict';
import { totals, forMonth, categoryTotals, makeDemo, wealthTotals, categoryChanges, previousMonth, makeWealthHistory, applyOwnership, amortize, retirementEstimate, deletionPolicy, monthChange, attentionStory, pace, trendsComparison, monthlySeries } from './model.js';

test('cash flow excludes transfers, deleted rows and excluded categories without losing cents', () => {
  const rows = [
    { cents: 100001, income: true }, { cents: 1999, category: 'groceries' },
    { cents: 2, category: 'groceries' }, { cents: 50000, transfer: true },
    { cents: 4000, deleted: true }, { cents: 3000, excluded: true },
  ];
  assert.deepEqual(totals(rows), { income: 100001, spending: 2001, net: 98000 });
  assert.equal(categoryTotals(rows).reduce((sum, cat) => sum + cat.cents, 0), 2001);
});
test('Trends compares the same days and refuses an incomplete previous month', () => {
  const rows = [
    { date: '2026-09-01', cents: 1000, category: 'groceries' },
    { date: '2026-09-26', cents: 9000, category: 'groceries' },
    { date: '2026-10-01', cents: 1600, category: 'groceries' },
    { date: '2026-10-02', cents: 8000, category: 'groceries', transfer: true },
  ];
  const result = categoryChanges(rows, '2026-10', new Date(2026, 9, 25, 12));
  assert.equal(result.available, true);
  assert.equal(result.changes[0].before, 1000);
  assert.equal(result.changes[0].delta, 600);
  assert.equal(categoryChanges(rows.slice(1), '2026-10', new Date(2026, 9, 25, 12)).available, false);
  assert.equal(previousMonth('2026-01'), '2025-12');
});
test('ownership is a reversible display view and synthetic history reconciles at its endpoint', () => {
  const accounts = [{ id: 'asset', cents: 10000, asset: true }, { id: 'debt', cents: 2000, asset: false }];
  const original = structuredClone(accounts);
  assert.equal(wealthTotals(applyOwnership(accounts, 50)).net, 4000);
  assert.equal(wealthTotals(applyOwnership(accounts, 100)).net, 8000);
  assert.deepEqual(accounts, original);
  assert.equal(wealthTotals(applyOwnership(accounts, 0)).net, 0);
  const history = makeWealthHistory(new Date(2026, 9, 25, 12), 8000);
  assert.equal(history.length, 27);
  assert.deepEqual(history.at(-1), { date: '2026-10-25', cents: 8000 });
});
test('debt simulations trim the last payment and handle zero interest, extra payments, and nonpayoff', () => {
  assert.deepEqual(amortize({ balanceCents: 10000, apr: 0, paymentCents: 3000 }), { months: 4, interestCents: 0, paysOff: true });
  const loan = { balanceCents: 100000, apr: 12, paymentCents: 10000 };
  const base = amortize(loan), extra = amortize({ ...loan, extraCents: 10000 });
  assert.ok(extra.months < base.months);
  assert.ok(extra.interestCents < base.interestCents);
  assert.equal(amortize({ ...loan, paymentCents: 1000 }).paysOff, false);
  assert.equal(amortize({ ...loan, lumpSumCents: 100000 }).months, 0);
  assert.throws(() => amortize({ ...loan, balanceCents: NaN }), RangeError);
});
test('retirement uses annual growth then end-of-year contributions and rejects invalid ages', () => {
  assert.equal(retirementEstimate({ age: 35, retirementAge: 36, balanceCents: 1000000, monthlyCents: 10000, realReturn: 5 }).cents, 1170000);
  assert.equal(retirementEstimate({ age: 65, retirementAge: 65, balanceCents: 1000000, monthlyCents: 10000, realReturn: 5 }).cents, 1000000);
  assert.throws(() => retirementEstimate({ age: 35, retirementAge: 34, balanceCents: 0, monthlyCents: 10000, realReturn: 5 }), RangeError);
  assert.throws(() => retirementEstimate({ age: 18, retirementAge: 100, balanceCents: 100000000000, monthlyCents: 100000000000, realReturn: 15 }), RangeError);
});
test('deletion requires fresh identity and blocks shared owners even after identity confirmation', () => {
  assert.deepEqual(deletionPolicy({ owner: true, memberCount: 2, freshIdentity: true }), { allowed: false, reason: 'transfer_ownership' });
  assert.equal(deletionPolicy({ owner: true, memberCount: 1 }).reason, 'reauthenticate');
  assert.equal(deletionPolicy({ owner: true, memberCount: 1, freshIdentity: true }).allowed, true);
  assert.equal(deletionPolicy({ owner: false, memberCount: 2, freshIdentity: true }).allowed, true);
});
test('like-for-like comparisons stop at the same day and never include another month', () => {
  const rows = [
    { date: '2026-09-01', cents: 100 }, { date: '2026-09-25', cents: 200 },
    { date: '2026-09-26', cents: 400 }, { date: '2026-10-01', cents: 800 },
  ];
  assert.equal(totals(forMonth(rows, '2026-09', 25)).spending, 300);
  assert.equal(totals(forMonth(rows, '2026-09')).spending, 700);
});
test('synthetic data crosses year boundaries using local calendar dates', () => {
  const rows = makeDemo(new Date(2026, 0, 1, 12));
  assert.equal(rows[0].date, '2026-01-01');
  assert.equal(rows[1].date, '2025-12-31');
  assert.ok(rows.length > 53);
  assert.ok(rows.at(-1).date < '2025-01-10', 'about a year of synthetic history');
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
});
test('sample category totals reconcile to spending, and wealth reconciles to account balances', () => {
  const rows = forMonth(makeDemo(new Date(2026, 9, 25, 12)), '2026-10');
  assert.equal(totals(rows).spending, 106164);
  assert.equal(categoryTotals(rows).reduce((sum, cat) => sum + cat.cents, 0), 106164);
  assert.deepEqual(wealthTotals(), { assets: 1673732, liabilities: 84721, net: 1589011 });
});

const day = (date, cents, category = 'groceries', extra = {}) => ({ id: `${date}-${cents}`, date, cents, category, ...extra });
test('home change compares with the same day last month and names the window like the app', () => {
  const rows = [day('2026-09-03', 10000), day('2026-09-20', 90000), day('2026-10-02', 12000), day('2026-10-04', 500, 'groceries', { transfer: true })];
  const change = monthChange(rows, '2026-10', new Date(2026, 9, 5, 12));
  assert.equal(Math.round(change.percent), 20);
  assert.equal(change.label, 'vs this time last month');
  assert.equal(monthChange(rows, '2026-09', new Date(2026, 9, 5, 12)), null);
  assert.equal(monthChange(rows, '2026-10', new Date(2026, 10, 2, 12)).label, 'vs last month');
});
test('worth-a-look picks the largest meaningful increase and ignores small moves', () => {
  const rows = [day('2026-09-02', 5000), day('2026-09-02', 2000, 'shopping'), day('2026-10-02', 9000), day('2026-10-02', 3000, 'shopping')];
  const story = attentionStory(rows, '2026-10', new Date(2026, 9, 10, 12));
  assert.equal(story.id, 'groceries'); assert.equal(story.delta, 4000); assert.equal(story.comparison, 'to date');
  assert.equal(attentionStory([day('2026-10-02', 9000)], '2026-10', new Date(2026, 9, 10, 12)), null);
});
test('pace builds a typical curve from covered months, drops outliers, and caps the projection', () => {
  const rows = [];
  for (const month of ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']) rows.push(day(`${month}-01`, 10000), day(`${month}-15`, 10000));
  rows.push(day('2026-08-20', 900000)); // August is an outlier month
  rows.push(day('2026-10-01', 60000));
  const result = pace(rows, '2026-10', new Date(2026, 9, 10, 12));
  assert.equal(result.spent, 60000);
  assert.equal(result.typicalToday, 10000);
  assert.equal(result.typical.at(-1), 20000);
  assert.equal(result.projected, 60000, 'never below what is already spent, ratio capped at 1.5x');
  assert.equal(pace(rows, '2026-09', new Date(2026, 9, 10, 12)).typical, null);
});
test('trends compares with the typical month to date and labels the baseline', () => {
  const rows = [day('2026-08-01', 4000), day('2026-08-05', 8000, 'shopping'), day('2026-09-01', 6000), day('2026-09-05', 2000, 'shopping'), day('2026-09-20', 99999, 'shopping'), day('2026-10-01', 9000), day('2026-10-02', 1000, 'shopping')];
  const result = trendsComparison(rows, '2026-10', new Date(2026, 9, 10, 12));
  assert.equal(result.label, 'vs typical month to date'); assert.equal(result.count, 2);
  assert.deepEqual(result.drivers.map(row => [row.id, row.current, row.typical]).sort(), [['groceries', 9000, 5000], ['shopping', 1000, 5000]]);
  assert.equal(result.totalDelta, 0);
  assert.equal(trendsComparison(rows.slice(2), '2026-10', new Date(2026, 9, 10, 12)).label, 'vs prior month to date');
  const series = monthlySeries(rows, '2026-10', new Date(2026, 9, 10, 12));
  assert.deepEqual(series.bars.map(bar => bar.month), ['2026-08', '2026-09', '2026-10']);
  assert.equal(series.typical, 10000);
});
