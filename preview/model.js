import { transactions as specs } from './demo.js?v=db98a177cd';

// This preview is intentionally isolated from authentication, storage, and APIs.
export const categories = [
  { id: 'groceries', name: 'Groceries', color: '#5FAF87', icon: 'cart' },
  { id: 'restaurants', name: 'Restaurants', color: '#D27C35', icon: 'utensils' },
  { id: 'transport', name: 'Transport', color: '#5B8DEF', icon: 'car' },
  { id: 'entertainment', name: 'Entertainment', color: '#A78BFA', icon: 'play' },
  { id: 'shopping', name: 'Shopping', color: '#D768A1', icon: 'bag' },
  { id: 'subscriptions', name: 'Subscriptions', color: '#C49423', icon: 'repeat' },
  { id: 'utilities', name: 'Utilities', color: '#299B90', icon: 'bolt' },
  { id: 'income', name: 'Income', color: '#35795A', icon: 'income' },
];
export const accounts = [
  { id: 'checking', name: 'Everyday Checking', institution: 'First Horizon', mask: '4521', cents: 428732, asset: true, type: 'Cash' },
  { id: 'savings', name: 'Emergency Fund', institution: 'First Horizon', mask: '8934', cents: 1245000, asset: true, type: 'Cash' },
  { id: 'credit', name: 'Cash Rewards Card', institution: 'Apex Card', mask: '1234', cents: 84721, asset: false, type: 'Credit card' },
];
export function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
// Older synthetic months so Trends and pacing have a year of history, like the
// app's demo. Deterministic: the same dates and amounts on every load.
function historySpecs() {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const vary = (cents, spread = .25) => Math.round(cents * (1 - spread + random() * spread * 2));
  const rows = [];
  const add = (daysAgo, merchant, cents, category, income = false) => rows.push({ id: `demo-h${rows.length}`, daysAgo, merchant, cents, category, income, transfer: false });
  for (let daysAgo = 30; daysAgo <= 372; daysAgo++) {
    if (daysAgo < 89 && daysAgo % 2) continue; // lighter where the app demo already has rows
    if (daysAgo >= 89 && daysAgo % 14 === 0) add(daysAgo, 'Acme Corp Payroll', 425000, 'income', true);
    if (daysAgo % 7 === 3) add(daysAgo, random() < .5 ? 'Whole Foods Market' : "Trader Joe's", vary(9800), 'groceries');
    if (daysAgo % 7 === 1 || daysAgo % 7 === 5) add(daysAgo, ['Chipotle', 'Starbucks', 'Sweetgreen', 'Local Bistro'][Math.floor(random() * 4)], vary(2400, .5), 'restaurants');
    if (daysAgo % 9 === 2) add(daysAgo, random() < .5 ? 'Shell' : 'Uber', vary(4200), 'transport');
    if (daysAgo % 30 === 6) add(daysAgo, 'Netflix', 1549, 'subscriptions');
    if (daysAgo % 30 === 11) add(daysAgo, 'Spotify', 1199, 'subscriptions');
    if (daysAgo % 30 === 16) add(daysAgo, 'City Power & Light', vary(11200, .2), 'utilities');
    if (daysAgo % 17 === 4) add(daysAgo, random() < .5 ? 'Target' : 'Amazon', vary(6500, .6), 'shopping');
    if (daysAgo % 23 === 8) add(daysAgo, random() < .5 ? 'AMC Theatres' : 'Steam', vary(3200, .4), 'entertainment');
  }
  return rows;
}
const history = historySpecs();
export function makeDemo(today = new Date()) {
  const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  return [...specs, ...history].map(spec => {
    const date = new Date(anchor);
    date.setDate(date.getDate() - spec.daysAgo);
    return { ...spec, date: localDateKey(date) };
  });
}
export function eligible(rows) { return rows.filter(row => !row.transfer && !row.deleted && !row.excluded); }
export function forMonth(rows, month, throughDay = 31) {
  return eligible(rows).filter(row => row.date.slice(0, 7) === month && Number(row.date.slice(8)) <= throughDay);
}
export function totals(rows) {
  return eligible(rows).reduce((sum, row) => {
    sum[row.income ? 'income' : 'spending'] += row.cents;
    sum.net = sum.income - sum.spending;
    return sum;
  }, { income: 0, spending: 0, net: 0 });
}
export function categoryTotals(rows) {
  return categories.filter(cat => cat.id !== 'income' && cat.income !== true).map(cat => ({
    ...cat, cents: eligible(rows).filter(tx => !tx.income && tx.category === cat.id).reduce((sum, tx) => sum + tx.cents, 0),
  })).filter(cat => cat.cents > 0).sort((a, b) => b.cents - a.cents);
}
export function wealthTotals(rows = accounts) {
  const assets = rows.filter(a => a.asset).reduce((sum, a) => sum + a.cents, 0);
  const liabilities = rows.filter(a => !a.asset).reduce((sum, a) => sum + a.cents, 0);
  return { assets, liabilities, net: assets - liabilities };
}

export function previousMonth(month) {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() - 1);
  return localDateKey(date).slice(0, 7);
}
export function categoryChanges(rows, month, today = new Date()) {
  const prior = previousMonth(month);
  const cutoff = month === localDateKey(today).slice(0, 7) ? today.getDate() : 31;
  const coverageStart = rows.map(row => row.date).sort()[0];
  if (!coverageStart || coverageStart > `${prior}-01`) return { available: false, prior, cutoff, changes: [] };
  const current = categoryTotals(forMonth(rows, month, cutoff));
  const previous = categoryTotals(forMonth(rows, prior, cutoff));
  const changes = categories.filter(cat => cat.id !== 'income' && cat.income !== true).map(cat => {
    const now = current.find(row => row.id === cat.id)?.cents || 0;
    const before = previous.find(row => row.id === cat.id)?.cents || 0;
    return { ...cat, now, before, delta: now - before };
  }).filter(cat => cat.now || cat.before).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return { available: true, prior, cutoff, changes };
}
const daysIn = month => new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
export function addMonths(month, count) {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + count);
  return localDateKey(date).slice(0, 7);
}
// Missing history is not a zero-spend month: only months covered from day 1 count.
const coveredFrom = rows => rows.map(row => row.date).sort()[0];
const isCovered = (rows, month) => { const start = coveredFrom(rows); return Boolean(start) && start <= `${month}-01`; };
function iqrBounds(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length / 4)], q3 = sorted[Math.floor(sorted.length * 3 / 4)], iqr = q3 - q1;
  return [q1 - 1.5 * iqr, q3 + 1.5 * iqr];
}
// HomeView's trimmed mean: plain mean below three months, IQR-filtered above.
function trimmedMean(values) {
  if (!values.length) return null;
  if (values.length < 3) return values.reduce((a, b) => a + b, 0) / values.length;
  const [low, high] = iqrBounds(values), kept = values.filter(v => v >= low && v <= high);
  return kept.length ? kept.reduce((a, b) => a + b, 0) / kept.length : [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

// Home hero badge: the current month compares with the same day of last month.
export function monthChange(rows, month, today = new Date()) {
  const isCurrent = month === localDateKey(today).slice(0, 7), prior = previousMonth(month);
  const cutoff = isCurrent ? Math.min(today.getDate(), daysIn(prior)) : 31;
  const now = totals(forMonth(rows, month)).spending, before = totals(forMonth(rows, prior, cutoff)).spending;
  if (!before) return null;
  return { percent: (now - before) / before * 100, label: isCurrent ? 'vs this time last month' : 'vs last month' };
}
// Home "Worth a look": the category that rose most against the same comparison window.
export function attentionStory(rows, month, today = new Date()) {
  const isCurrent = month === localDateKey(today).slice(0, 7), prior = previousMonth(month);
  const cutoff = isCurrent ? Math.min(today.getDate(), daysIn(prior)) : 31;
  const previousRows = forMonth(rows, prior, cutoff);
  if (!totals(previousRows).spending) return null;
  const now = categoryTotals(forMonth(rows, month)), before = categoryTotals(previousRows);
  const best = categories.filter(cat => cat.id !== 'income' && cat.income !== true && !cat.excluded).map(cat => {
    const current = now.find(row => row.id === cat.id)?.cents || 0, previous = before.find(row => row.id === cat.id)?.cents || 0;
    return { ...cat, current, previous, delta: current - previous };
  }).filter(cat => Math.max(cat.current, cat.previous) >= 4000 && cat.delta >= 2500).sort((a, b) => b.delta - a.delta)[0];
  return best ? { ...best, comparison: isCurrent ? 'to date' : '', prior } : null;
}
// Home pace chart: cumulative spending against the typical curve of up to 12
// prior covered months, outlier months removed, with HomeView's capped projection.
export function pace(rows, month, today = new Date()) {
  const isCurrent = month === localDateKey(today).slice(0, 7), length = daysIn(month);
  const day = isCurrent ? today.getDate() : length;
  const dailyFor = target => { const out = Array(daysIn(target)).fill(0); eligible(rows).filter(tx => !tx.income && tx.date.slice(0, 7) === target).forEach(tx => { out[Number(tx.date.slice(8)) - 1] += tx.cents; }); return out; };
  let running = 0;
  const current = dailyFor(month).slice(0, day).map(cents => running += cents);
  const result = { length, day, current, spent: running, typical: null, typicalToday: null, projected: null };
  if (!isCurrent || day < 3) return result;
  const history = [];
  for (let offset = 1; offset <= 12; offset++) {
    const target = addMonths(month, -offset);
    if (!isCovered(rows, target)) break;
    const daily = dailyFor(target), total = daily.reduce((a, b) => a + b, 0);
    if (total > 0) history.push({ daily, total });
  }
  if (!history.length) return result;
  const totalsList = history.map(row => row.total);
  const [low, high] = history.length >= 3 ? iqrBounds(totalsList) : [-Infinity, Infinity];
  const kept = history.filter(row => row.total >= low && row.total <= high);
  let cumulative = 0;
  result.typical = Array.from({ length }, (_, i) => {
    const samples = kept.filter(row => i < row.daily.length);
    return cumulative += samples.length ? samples.reduce((sum, row) => sum + row.daily[i], 0) / samples.length : 0;
  }).map(Math.round);
  result.typicalToday = result.typical[day - 1];
  const typicalMonth = trimmedMean(totalsList);
  if (day >= 5 && typicalMonth != null) {
    const ratio = result.typicalToday > 0 ? Math.min(running / result.typicalToday, 1.5) : 1;
    result.projected = Math.round(Math.max(running, typicalMonth * ratio));
  }
  return result;
}
// Trends: each category against your typical month (up to 12 prior covered
// months with data), through the same day while the month is in progress.
export function trendsComparison(rows, month, today = new Date()) {
  const isCurrent = month === localDateKey(today).slice(0, 7), cutoff = isCurrent ? today.getDate() : 31;
  const history = [];
  for (let offset = 1; offset <= 12; offset++) {
    const target = addMonths(month, -offset);
    if (!isCovered(rows, target)) break;
    const monthRows = forMonth(rows, target, cutoff);
    if (monthRows.some(tx => !tx.income)) history.unshift({ month: target, rows: monthRows });
  }
  const count = history.length;
  const label = !count ? 'Not enough history' : isCurrent ? (count === 1 ? 'vs prior month to date' : 'vs typical month to date') : (count === 1 ? 'vs prior month' : `vs ${count}-mo avg`);
  if (!count) return { available: false, label, count, drivers: [], totalDelta: 0 };
  const now = categoryTotals(forMonth(rows, month, cutoff));
  const typicalOf = id => history.reduce((sum, row) => sum + (categoryTotals(row.rows).find(cat => cat.id === id)?.cents || 0), 0) / count;
  const drivers = categories.filter(cat => cat.id !== 'income' && cat.income !== true && !cat.excluded).map(cat => {
    const current = now.find(row => row.id === cat.id)?.cents || 0, typical = Math.round(typicalOf(cat.id));
    return { ...cat, current, typical, delta: current - typical };
  }).filter(cat => Math.max(cat.current, cat.typical) >= 2500 && Math.abs(cat.delta) >= 1000).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  const typicalTotal = history.reduce((sum, row) => sum + totals(row.rows).spending, 0) / count;
  return { available: true, label, count, drivers, totalDelta: Math.round(totals(forMonth(rows, month, cutoff)).spending - typicalTotal) };
}
// Trends bars: up to 12 covered months ending at the selected one, all cut at
// the same day while it is in progress, plus the typical (average prior) level.
export function monthlySeries(rows, month, today = new Date()) {
  const cutoff = month === localDateKey(today).slice(0, 7) ? today.getDate() : 31;
  const bars = [];
  for (let offset = 11; offset >= 0; offset--) {
    const target = addMonths(month, -offset);
    if (offset && !isCovered(rows, target)) continue;
    bars.push({ month: target, spending: totals(forMonth(rows, target, cutoff)).spending });
  }
  const prior = bars.slice(0, -1).filter(bar => bar.spending > 0);
  return { bars, cutoff, typical: prior.length ? Math.round(prior.reduce((sum, bar) => sum + bar.spending, 0) / prior.length) : null };
}
export function applyOwnership(rows, percent = 100) {
  const share = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 50;
  return rows.map(row => ({ ...row, cents: Math.round(row.cents * share / 100) }));
}
export function makeWealthHistory(today = new Date(), endingCents = wealthTotals().net) {
  // Synthetic weekly history with the iPhone demo's drift/noise, anchored to
  // the preview's reconciled account total rather than a mismatching endpoint.
  return Array.from({ length: 27 }, (_, i) => {
    const week = 26 - i;
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - week * 7, 12);
    return { date: localDateKey(date), cents: endingCents - week * 17500 + Math.round(Math.sin(week * .7) * 25000) };
  });
}
export function amortize({ balanceCents, apr, paymentCents, extraCents = 0, lumpSumCents = 0 }) {
  if (![balanceCents, apr, paymentCents, extraCents, lumpSumCents].every(Number.isFinite)
      || [balanceCents, apr, paymentCents, extraCents, lumpSumCents].some(value => value < 0)) throw new RangeError('Use finite, nonnegative amounts.');
  let balance = Math.max(0, balanceCents - lumpSumCents) / 100;
  const rate = apr / 100 / 12;
  const payment = (paymentCents + extraCents) / 100;
  let months = 0, interest = 0;
  if (balance <= .01) return { months: 0, interestCents: 0, paysOff: true };
  if (payment <= balance * rate || payment <= 0) return { months: 0, interestCents: 0, paysOff: false };
  while (balance > .01 && months < 1200) {
    const charge = balance * rate;
    balance -= Math.min(balance, payment - charge);
    interest += charge;
    months++;
  }
  return { months, interestCents: Math.round(interest * 100), paysOff: balance <= .01 };
}
export function retirementEstimate({ age, retirementAge, balanceCents, monthlyCents, realReturn }) {
  if (![age, retirementAge, balanceCents, monthlyCents, realReturn].every(Number.isFinite)
      || !Number.isInteger(age) || !Number.isInteger(retirementAge) || age < 18 || retirementAge < age || retirementAge > 100
      || balanceCents < 0 || monthlyCents < 0 || realReturn < -10 || realReturn > 15) throw new RangeError('Check the ages, amounts, and return assumption.');
  let balance = balanceCents / 100;
  const points = [{ age, cents: Math.round(balance * 100) }];
  for (let next = age + 1; next <= retirementAge; next++) {
    // End-of-year contribution timing matches the app's projection loop.
    balance = balance * (1 + realReturn / 100) + monthlyCents / 100 * 12;
    if (!Number.isSafeInteger(Math.round(balance * 100))) throw new RangeError('This projection exceeds the supported amount. Try smaller sample inputs.');
    points.push({ age: next, cents: Math.round(balance * 100) });
  }
  return { cents: Math.round(balance * 100), contributionsCents: monthlyCents * 12 * (retirementAge - age), points };
}
export function deletionPolicy({ owner = false, memberCount = 1, freshIdentity = false }) {
  if (owner && memberCount > 1) return { allowed: false, reason: 'transfer_ownership' };
  if (!freshIdentity) return { allowed: false, reason: 'reauthenticate' };
  return { allowed: true, reason: null };
}
