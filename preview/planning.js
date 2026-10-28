// Ports of the iPhone app's planning math (RetirementProjection.swift,
// DebtCalculator.swift, OwnershipSplit.swift). Amounts are dollars, as in the
// app, so results match it to the cent. Keep the constants in step with iOS.

// Swift's default JSONEncoder writes Date as seconds since 2001-01-01.
const SWIFT_EPOCH_MS = Date.UTC(2001, 0, 1);
export const swiftDate = value => typeof value === 'number' && Number.isFinite(value) ? new Date(SWIFT_EPOCH_MS + value * 1000) : null;
const finite = (value, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const integer = (value, fallback) => Number.isInteger(value) ? value : fallback;
const sameId = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const lookup = (map, id) => {
  if (!map || typeof map !== 'object') return undefined;
  const key = Object.keys(map).find(candidate => sameId(candidate, id));
  return key === undefined ? undefined : map[key];
};

// ── Retirement ─────────────────────────────────────────────────────
export const RETIREMENT = {
  annualRealGrowthRate: 0.05, safeWithdrawalMultiplier: 25, preMedicareAge: 65,
  healthcareAnnualCostPerAdult: 20000, onTrackCushion: 50000, assumedInflation: 0.02,
  maxContributionPercent: 50, stepUpPercentPointsPerYear: 1,
  socialSecurityAmount: 23000, socialSecurityAge: 67, demoBalance: 132500,
};
const contributionCap = age => (age >= 60 && age <= 63) ? 44350 : age >= 50 ? 41100 : 32000;
const investmentIcon = 'chart.line.uptrend.xyaxis';

// Swift encodes SocialSecurityConfig as {"auto":{}}, {"disabled":{}} or
// {"custom":{"annualAmount":…,"startAge":…}}.
function socialSecurity(value) {
  if (value && typeof value === 'object') {
    if ('disabled' in value) return { enabled: false, amount: 0, startAge: RETIREMENT.socialSecurityAge };
    if (value.custom && typeof value.custom === 'object') return { enabled: true, amount: Math.max(0, finite(value.custom.annualAmount)), startAge: integer(value.custom.startAge, RETIREMENT.socialSecurityAge) };
  }
  return { enabled: true, amount: RETIREMENT.socialSecurityAmount, startAge: RETIREMENT.socialSecurityAge };
}
export function parseRetirementPlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const plan = {
    mode: raw.mode === 'fire' ? 'fire' : 'traditional',
    currentAge: integer(raw.currentAge, NaN), targetRetirementAge: integer(raw.targetRetirementAge, NaN),
    annualSalary: finite(raw.annualSalary), contributionPercent: finite(raw.contributionPercent),
    socialSecurity: socialSecurity(raw.socialSecurity), includesPartner: raw.includesPartner === true,
    spouseCurrentAge: integer(raw.spouseCurrentAge, null), spouseTargetRetirementAge: integer(raw.spouseTargetRetirementAge, null),
    spouseAnnualSalary: finite(raw.spouseAnnualSalary), spouseContributionPercent: finite(raw.spouseContributionPercent),
    spouseSocialSecurity: raw.spouseSocialSecurity == null ? null : socialSecurity(raw.spouseSocialSecurity),
    annualRaisePercent: finite(raw.annualRaisePercent, 3), stepUpContribution: raw.stepUpContribution === true,
    targetAnnualSpending: finite(raw.targetAnnualSpending),
    kids: Array.isArray(raw.kids) ? raw.kids.filter(kid => kid && typeof kid === 'object').map(kid => ({ currentAge: integer(kid.currentAge, 0), educationCost: Math.max(0, finite(kid.educationCost)) })) : [],
    healthcareCost: raw.healthcareAnnualCostPerAdultOverride == null ? RETIREMENT.healthcareAnnualCostPerAdult : finite(raw.healthcareAnnualCostPerAdultOverride, RETIREMENT.healthcareAnnualCostPerAdult),
    realGrowthRate: raw.realGrowthRateOverride == null ? RETIREMENT.annualRealGrowthRate : finite(raw.realGrowthRateOverride, RETIREMENT.annualRealGrowthRate),
    accountOverrides: raw.accountOverrides && typeof raw.accountOverrides === 'object' ? raw.accountOverrides : {},
  };
  // A plan the app would reject is not shown rather than guessed at.
  if (!(plan.currentAge >= 18 && plan.currentAge <= 90 && plan.targetRetirementAge > plan.currentAge && plan.targetRetirementAge <= 90 && plan.targetAnnualSpending > 0)) return null;
  return plan;
}
export const demoRetirementPlan = () => parseRetirementPlan({ mode: 'traditional', currentAge: 34, targetRetirementAge: 65, annualSalary: 85000, contributionPercent: 12, socialSecurity: { auto: {} }, includesPartner: false, annualRaisePercent: 3, stepUpContribution: true, targetAnnualSpending: 65000, kids: [], accountOverrides: {} });

// Mirrors RetirementPlan.retirementEligibleBalance: investment accounts and
// savings/HSA/money market by default, investment-icon manual assets, and any
// per-account choice the user made in the app.
export function retirementEligibleBalance(plan, { bankAccounts = [], manualAccounts = [] } = {}) {
  let total = 0;
  for (const account of bankAccounts) {
    if (account.type !== 'investment' && account.type !== 'depository') continue;
    const override = lookup(plan.accountOverrides, account.id);
    const byDefault = account.type === 'investment' || ['savings', 'hsa', 'money market'].includes(String(account.subtype || '').toLowerCase());
    if (!(override ?? byDefault)) continue;
    if (account.currency && account.currency.trim().toUpperCase() !== 'USD') continue;
    if (Number.isFinite(account.balance) && account.balance > 0) total += account.balance;
  }
  for (const account of manualAccounts) {
    if (!account.asset) continue;
    const override = lookup(plan.accountOverrides, account.id);
    if (!(override ?? account.icon === investmentIcon)) continue;
    const balance = account.cents / 100;
    if (balance > 0) total += balance;
  }
  return total;
}

export function retirementProjection(plan, currentBalance) {
  const r = plan.realGrowthRate, partnered = plan.includesPartner;
  const spouseAge = partnered ? plan.spouseCurrentAge : null, spouseRetAge = partnered ? plan.spouseTargetRetirementAge : null;
  const primaryRetAge = plan.targetRetirementAge;
  const primaryYears = Math.max(0, primaryRetAge - plan.currentAge);
  const spouseYears = spouseAge != null && spouseRetAge != null ? Math.max(0, spouseRetAge - spouseAge) : 0;
  const jointYears = Math.max(primaryYears, spouseYears);
  const firstYears = spouseRetAge != null ? Math.min(primaryYears, spouseYears) : primaryYears;
  const earlierRetirementAge = spouseAge != null && spouseYears === firstYears ? spouseAge + spouseYears : plan.currentAge + firstYears;
  const realRaise = (1 + plan.annualRaisePercent / 100) / (1 + RETIREMENT.assumedInflation) - 1;
  let balance = currentBalance, primarySalary = plan.annualSalary, primaryPct = plan.contributionPercent;
  let spouseSalary = plan.spouseAnnualSalary || 0, spousePct = plan.spouseContributionPercent || 0;
  const points = [{ age: plan.currentAge, balance }];
  for (let year = 1; year <= jointYears; year++) {
    balance *= 1 + r;
    const primaryAgeThisYear = plan.currentAge + year - 1;
    if (primaryAgeThisYear < primaryRetAge) balance += Math.min(primarySalary * primaryPct / 100, contributionCap(primaryAgeThisYear));
    if (partnered && spouseAge != null && spouseRetAge != null) {
      const spouseAgeThisYear = spouseAge + year - 1;
      if (spouseAgeThisYear < spouseRetAge) balance += Math.min(spouseSalary * spousePct / 100, contributionCap(spouseAgeThisYear));
    }
    points.push({ age: plan.currentAge + year, balance });
    primarySalary *= 1 + realRaise; spouseSalary *= 1 + realRaise;
    if (plan.stepUpContribution) {
      primaryPct = Math.min(primaryPct + RETIREMENT.stepUpPercentPointsPerYear, RETIREMENT.maxContributionPercent);
      spousePct = Math.min(spousePct + RETIREMENT.stepUpPercentPointsPerYear, RETIREMENT.maxContributionPercent);
    }
  }
  const projectedBalance = balance;
  const currentBalanceFV = currentBalance * (1 + r) ** jointYears;
  const education = plan.kids.reduce((sum, kid) => {
    const delta = jointYears - Math.max(0, 18 - kid.currentAge);
    return sum + (delta >= 0 ? kid.educationCost * (1 + r) ** delta : kid.educationCost / (1 + r) ** -delta);
  }, 0);
  let healthcare = 0;
  const healthcareImpact = (yearsToRet, retAge) => {
    if (retAge >= RETIREMENT.preMedicareAge) return;
    for (let k = 0; k < RETIREMENT.preMedicareAge - retAge; k++) healthcare += plan.healthcareCost * (1 + r) ** (jointYears - (yearsToRet + k));
  };
  healthcareImpact(primaryYears, primaryRetAge);
  if (spouseRetAge != null && spouseAge != null) healthcareImpact(spouseYears, spouseRetAge);
  const activation = (startAge, age) => Math.max(0, startAge - age - jointYears);
  const streams = [];
  if (plan.socialSecurity.enabled && plan.socialSecurity.amount > 0) streams.push({ year: activation(plan.socialSecurity.startAge, plan.currentAge), amount: plan.socialSecurity.amount });
  if (partnered && spouseAge != null && plan.spouseSocialSecurity?.enabled && plan.spouseSocialSecurity.amount > 0) streams.push({ year: activation(plan.spouseSocialSecurity.startAge, spouseAge), amount: plan.spouseSocialSecurity.amount });
  streams.sort((a, b) => a.year - b.year);
  let phase0 = 0, phase1 = 0, phase1Offset = 0, phase2Offset = 0;
  if (streams.length === 1) { phase0 = streams[0].year; phase2Offset = streams[0].amount; }
  else if (streams.length >= 2) { phase0 = streams[0].year; phase1 = streams[1].year - streams[0].year; phase1Offset = streams[0].amount; phase2Offset = streams[0].amount + streams[1].amount; }
  const rate = 1 / RETIREMENT.safeWithdrawalMultiplier;
  const bridge = (spending, years, after) => years > 0 ? Math.max(0, spending) * ((1 - (1 + rate) ** -years) / rate) / (1 + rate) ** after : 0;
  const spendingCapital = bridge(plan.targetAnnualSpending, phase0, 0) + bridge(plan.targetAnnualSpending - phase1Offset, phase1, phase0)
    + Math.max(0, plan.targetAnnualSpending - phase2Offset) * RETIREMENT.safeWithdrawalMultiplier / (1 + rate) ** (phase0 + phase1);
  const requiredNestEgg = spendingCapital + education + healthcare;
  const gap = projectedBalance - requiredNestEgg;
  const status = gap > RETIREMENT.onTrackCushion ? 'onTrack' : gap > -RETIREMENT.onTrackCushion ? 'needsAttention' : 'offTrack';
  return {
    projectedBalance: Math.max(0, projectedBalance), requiredNestEgg: Math.max(0, requiredNestEgg), gap, status,
    yearsToRetirement: jointYears, earlierRetirementAge, laterRetirementAge: plan.currentAge + jointYears, points,
    breakdown: {
      currentBalance: Math.max(0, currentBalanceFV), contributions: Math.max(0, projectedBalance - currentBalanceFV),
      spending: Math.max(0, spendingCapital), education: Math.max(0, education), healthcare: Math.max(0, healthcare),
      socialSecurity: Math.max(0, plan.targetAnnualSpending * RETIREMENT.safeWithdrawalMultiplier - spendingCapital),
    },
  };
}
export const statusLabel = { onTrack: 'On Track', needsAttention: 'Needs Attention', offTrack: 'Off Track' };

// ── Debt ───────────────────────────────────────────────────────────
const MAX_MONTHS = 1200, EPSILON = 0.01;
const LOAN_KINDS = { mortgage: 'Mortgage', auto: 'Auto Loan', student: 'Student Loan', personal: 'Personal Loan', other: 'Other Loan' };
export const loanKindName = kind => LOAN_KINDS[kind] || LOAN_KINDS.other;
export function parseLoans(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(loan => loan && typeof loan === 'object').map(loan => ({
    id: String(loan.id || ''), name: typeof loan.name === 'string' && loan.name.trim() ? loan.name : 'Loan',
    kind: LOAN_KINDS[loan.kind] ? loan.kind : 'other', connectedAccountId: typeof loan.connectedAccountId === 'string' ? loan.connectedAccountId : null,
    originalPrincipal: finite(loan.originalPrincipal), annualInterestRate: finite(loan.annualInterestRate),
    termMonths: integer(loan.termMonths, 0), monthlyPayment: finite(loan.monthlyPayment), startDate: swiftDate(loan.startDate),
    currentBalanceOverride: loan.currentBalanceOverride == null ? null : finite(loan.currentBalanceOverride, null),
    savedExtraMonthlyPayment: Math.max(0, finite(loan.savedExtraMonthlyPayment)), savedLumpSumPayment: Math.max(0, finite(loan.savedLumpSumPayment)),
  })).filter(loan => loan.originalPrincipal > 0 && loan.annualInterestRate >= 0 && loan.annualInterestRate <= 100 && loan.termMonths >= 1 && loan.termMonths <= 1200 && loan.monthlyPayment >= 0 && loan.startDate);
}
const addMonthsTo = (date, months) => { const next = new Date(date); next.setMonth(next.getMonth() + months); return next; };
export function demoLoans(now = new Date()) {
  return [
    { id: 'demo-mortgage', name: 'Home Mortgage', kind: 'mortgage', connectedAccountId: null, originalPrincipal: 335000, annualInterestRate: 6.375, termMonths: 360, monthlyPayment: 2090, startDate: addMonthsTo(now, -52), currentBalanceOverride: null, savedExtraMonthlyPayment: 0, savedLumpSumPayment: 0 },
    { id: 'demo-auto', name: 'Car Loan', kind: 'auto', connectedAccountId: null, originalPrincipal: 29500, annualInterestRate: 5.9, termMonths: 60, monthlyPayment: 569, startDate: addMonthsTo(now, -19), currentBalanceOverride: null, savedExtraMonthlyPayment: 0, savedLumpSumPayment: 0 },
  ];
}
export function amortizeLoan(balance, r, payment) {
  if (balance <= EPSILON) return { months: 0, interest: 0, neverPaysOff: false, horizonExceeded: false };
  if (!(payment > 0)) return { months: 0, interest: 0, neverPaysOff: true, horizonExceeded: false };
  if (r <= 0) {
    const months = Math.ceil((balance - EPSILON) / payment);
    return months <= MAX_MONTHS ? { months, interest: 0, neverPaysOff: false, horizonExceeded: false } : { months: MAX_MONTHS, interest: 0, neverPaysOff: false, horizonExceeded: true };
  }
  if (payment <= balance * r) return { months: 0, interest: 0, neverPaysOff: true, horizonExceeded: false };
  let remaining = balance, interest = 0, months = 0;
  while (remaining > EPSILON && months < MAX_MONTHS) {
    const charge = remaining * r;
    const principal = Math.min(payment - charge, remaining);
    remaining -= principal; interest += charge; months++;
  }
  return { months, interest, neverPaysOff: false, horizonExceeded: remaining > EPSILON };
}
function balanceAfter(payments, principal, r, payment) {
  let balance = principal, interestPaid = 0;
  for (let n = 0; n < payments && balance > EPSILON; n++) {
    const charge = Math.max(0, balance * r);
    let principalPortion = payment - charge;
    if (principalPortion <= 0) { interestPaid += payment; balance += charge - payment; continue; }
    principalPortion = Math.min(principalPortion, balance);
    balance -= principalPortion; interestPaid += charge;
  }
  return { balance: Math.max(0, balance), interestPaid };
}
const standardPayment = (principal, r, term) => term <= 0 ? 0 : r <= 0 ? principal / term : principal * r * (1 + r) ** term / ((1 + r) ** term - 1);
// Calendar.dateComponents([.month]) counts whole months completed.
export function monthsElapsed(start, now, term) {
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  const anniversary = addMonthsTo(start, months);
  if (anniversary > now) months--;
  return Math.min(Math.max(0, months), term);
}
export function loanResult(loan, now = new Date()) {
  const r = loan.annualInterestRate / 100 / 12;
  const usedComputedPayment = !(loan.monthlyPayment > 0.009);
  const payment = usedComputedPayment ? standardPayment(loan.originalPrincipal, r, loan.termMonths) : loan.monthlyPayment;
  const elapsed = monthsElapsed(loan.startDate, now, loan.termMonths);
  const scheduled = balanceAfter(elapsed, loan.originalPrincipal, r, payment);
  const currentBalance = Math.max(0, loan.currentBalanceOverride ?? scheduled.balance);
  const principalPaid = Math.max(0, loan.originalPrincipal - currentBalance);
  const interestPaid = loan.currentBalanceOverride == null ? scheduled.interestPaid : Math.max(0, payment * elapsed - principalPaid);
  const payoff = amortizeLoan(currentBalance, r, payment);
  return {
    monthlyRate: r, payment, usedComputedPayment, monthsElapsed: elapsed, currentBalance, principalPaid, interestPaid,
    monthsRemaining: payoff.months, payoffDate: addMonthsTo(now, payoff.months), interestRemaining: payoff.interest,
    neverPaysOff: payoff.neverPaysOff, horizonExceeded: payoff.horizonExceeded, isPaidOff: currentBalance <= EPSILON,
  };
}
export function payoffScenario(baseline, { extraMonthly = 0, lumpSum = 0 } = {}, now = new Date()) {
  const lump = Math.max(0, Math.min(lumpSum, baseline.currentBalance));
  const payoff = amortizeLoan(Math.max(0, baseline.currentBalance - lump), baseline.monthlyRate, baseline.payment + Math.max(0, extraMonthly));
  const comparable = !baseline.horizonExceeded && !payoff.horizonExceeded;
  return {
    months: payoff.months, payoffDate: addMonthsTo(now, payoff.months), interest: payoff.interest,
    interestSaved: comparable ? Math.max(0, baseline.interestRemaining - payoff.interest) : 0,
    monthsSaved: comparable ? Math.max(0, baseline.monthsRemaining - payoff.months) : 0,
    neverPaysOff: payoff.neverPaysOff, horizonExceeded: payoff.horizonExceeded,
  };
}
export function debtPortfolio(loans, now = new Date()) {
  let totalBalance = 0, totalInterest = 0, monthlyTotal = 0, latest = null, anyNever = false, anyHorizon = false;
  for (const loan of loans) {
    const result = loanResult(loan, now);
    totalBalance += result.currentBalance; totalInterest += result.interestRemaining; monthlyTotal += result.payment;
    if (result.neverPaysOff) anyNever = true;
    else if (result.horizonExceeded) anyHorizon = true;
    else if (!result.isPaidOff && (!latest || result.payoffDate > latest)) latest = result.payoffDate;
  }
  return { totalBalance, totalInterest, monthlyTotal, loanCount: loans.length, debtFreeDate: anyNever || anyHorizon ? null : latest, anyNeverPaysOff: anyNever, anyHorizonExceeded: anyHorizon };
}

// ── Ownership split ────────────────────────────────────────────────
const clampPercent = value => Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 50;
export function parseOwnership(raw) {
  if (!raw || typeof raw !== 'object' || raw.isEnabled !== true) return null;
  return {
    mode: raw.mode === 'custom' ? 'custom' : 'even', anchorUserId: typeof raw.anchorUserId === 'string' && raw.anchorUserId ? raw.anchorUserId : null,
    defaultPercent: finite(raw.defaultPercent, 50), perAccount: raw.perAccount && typeof raw.perAccount === 'object' ? raw.perAccount : {},
  };
}
// The stored percentages belong to the partner who set them up (the anchor);
// the other partner sees the complement, so both never see the same 70%.
// Without a known current user an anchored split fails closed to 100%.
export function ownershipLens(split, currentUserId) {
  const active = Boolean(split) && (!split.anchorUserId || Boolean(currentUserId));
  const perspective = percent => !split?.anchorUserId ? percent : sameId(currentUserId, split.anchorUserId) ? percent : 100 - percent;
  const percentFor = id => {
    if (!active) return 100;
    const anchor = split.mode === 'even' ? 50 : clampPercent(lookup(split.perAccount, id) ?? split.defaultPercent);
    return perspective(anchor);
  };
  return { active, percentFor, defaultPercent: active ? perspective(clampPercent(split.defaultPercent)) : 100, label: !active ? 'Your share' : split.mode === 'even' ? '50% share' : 'Custom share' };
}
