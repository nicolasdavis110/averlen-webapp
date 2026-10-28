import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { swiftDate, parseRetirementPlan, retirementProjection, retirementEligibleBalance, demoRetirementPlan, parseLoans, loanResult, payoffScenario, debtPortfolio, parseOwnership, ownershipLens, RETIREMENT } from './planning.js';

// Inputs and outputs recorded by compiling the iPhone app's own
// RetirementProjection.swift and DebtCalculator.swift (Swift JSON encoding).
const golden = JSON.parse(readFileSync(new URL('./planning.fixtures.json', import.meta.url), 'utf8'));
const now = swiftDate(golden.now);
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-6 * Math.max(1, Math.abs(expected)), `${label}: ${actual} vs ${expected}`);

test('retirement projection matches the iPhone app', () => {
  for (const [i, c] of golden.plans.entries()) {
    const result = retirementProjection(parseRetirementPlan(c.plan), c.balance);
    close(result.projectedBalance, c.projected, `${i} projected`); close(result.requiredNestEgg, c.required, `${i} required`);
    close(result.gap, c.gap, `${i} gap`); assert.equal(result.status, c.status);
    assert.equal(result.laterRetirementAge, c.later); assert.equal(result.earlierRetirementAge, c.earlier);
    close(result.breakdown.socialSecurity, c.ss, `${i} ss`); close(result.breakdown.healthcare, c.health, `${i} health`); close(result.breakdown.education, c.edu, `${i} edu`);
  }
});
test('demo retirement plan is on track like the app demo', () => {
  assert.equal(retirementProjection(demoRetirementPlan(), RETIREMENT.demoBalance).status, 'onTrack');
});
test('loan math and payoff scenarios match the iPhone app', () => {
  const loans = parseLoans(golden.loans.map(c => c.loan));
  assert.equal(loans.length, golden.loans.length);
  for (const [i, c] of golden.loans.entries()) {
    const base = loanResult(loans[i], now);
    close(base.currentBalance, c.balance, `${i} balance`); close(base.payment, c.payment, `${i} payment`); assert.equal(base.monthsElapsed, c.elapsed);
    assert.equal(base.monthsRemaining, c.months); close(base.interestRemaining, c.interest, `${i} interest`); close(base.interestPaid, c.paid, `${i} paid`); assert.equal(base.neverPaysOff, c.never);
    const extra = payoffScenario(base, { extraMonthly: c.loan.savedExtraMonthlyPayment ?? 100 }, now), lump = payoffScenario(base, { lumpSum: c.loan.savedLumpSumPayment ?? 5000 }, now);
    assert.equal(extra.months, c.extraMonths); close(extra.interestSaved, c.extraSaved, `${i} extra`);
    assert.equal(lump.months, c.lumpMonths); close(lump.interestSaved, c.lumpSaved, `${i} lump`);
  }
  const portfolio = debtPortfolio(loans.slice(0, 3), now);
  close(portfolio.totalBalance, golden.portfolio.balance, 'portfolio'); close(portfolio.totalInterest, golden.portfolio.interest, 'portfolio interest');
  close((portfolio.debtFreeDate - Date.UTC(2001, 0, 1)) / 1000, golden.portfolio.free, 'debt free');
});
test('invalid saved plans and loans are not guessed at', () => {
  assert.equal(parseRetirementPlan({ currentAge: 40, targetRetirementAge: 30, targetAnnualSpending: 1 }), null);
  assert.equal(parseRetirementPlan('nope'), null);
  assert.deepEqual(parseLoans([{ name: 'x', originalPrincipal: 0, termMonths: 12, startDate: 1 }, null]), []);
});
test('retirement balance counts the same accounts as the app', () => {
  const plan = { ...demoRetirementPlan(), accountOverrides: { 'ACC-SAV': false, 'acc-chk': true } };
  const total = retirementEligibleBalance(plan, {
    bankAccounts: [
      { id: 'inv', type: 'investment', balance: 1000 }, { id: 'acc-sav', type: 'depository', subtype: 'savings', balance: 500 },
      { id: 'ACC-CHK', type: 'depository', subtype: 'checking', balance: 200 }, { id: 'hsa', type: 'depository', subtype: 'hsa', balance: 50 },
      { id: 'eur', type: 'investment', balance: 999, currency: 'EUR' }, { id: 'card', type: 'credit', balance: 300 },
    ],
    manualAccounts: [{ id: 'm1', asset: true, icon: 'chart.line.uptrend.xyaxis', cents: 10000 }, { id: 'm2', asset: true, icon: 'house.fill', cents: 99900 }],
  });
  assert.equal(total, 1000 + 200 + 50 + 100);
});
test('ownership lens shows each partner their own side', () => {
  const split = parseOwnership({ isEnabled: true, mode: 'custom', anchorUserId: 'USER-A', defaultPercent: 70, perAccount: { 'acct-1': 40 } });
  assert.equal(ownershipLens(split, 'user-a').percentFor('ACCT-1'), 40);
  assert.equal(ownershipLens(split, 'user-b').percentFor('acct-1'), 60);
  assert.equal(ownershipLens(split, 'user-b').percentFor('other'), 30);
  assert.equal(ownershipLens(split, null).active, false);
  assert.equal(ownershipLens(split, null).percentFor('other'), 100);
  assert.equal(ownershipLens(parseOwnership({ isEnabled: true, mode: 'even' }), null).percentFor('x'), 50);
  assert.equal(parseOwnership({ isEnabled: false }), null);
});
