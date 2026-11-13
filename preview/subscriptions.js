// Subscriptions: a line-by-line port of RecurringDetector.detect on iOS, with
// the input rules from its DerivedTransactionStore overload. Keep the two in
// step. Unlike Coming up, this works on exact moments, not calendar days: the
// iPhone measures gaps with timeIntervalSince, so a gap can be 30.96 days.
import { normalizeMerchant, legacyMerchantKey, subscriptionMatch } from './money-ahead.js?v=3b1d95276f';

const DAY = 86400000;
const gapDays = (newer, older) => (newer.at - older.at) / DAY;
// calendar.date(byAdding: .day, ...) keeps the wall-clock time across DST.
const addDays = (at, count) => { const date = new Date(at); date.setDate(date.getDate() + count); return date.getTime(); };
const monthOf = at => { const date = new Date(at); return `${date.getFullYear()}-${date.getMonth()}`; };

const billingCycles = [[6, 8], [13, 16], [26, 35], [57, 65], [85, 95], [175, 190], [350, 380]];
const longCycleDays = 150;

/** Median days between consecutive charges, given newest first. */
function medianGapDays(charges) {
  if (charges.length < 2) return null;
  const gaps = charges.slice(1).map((older, i) => gapDays(charges[i], older)).sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}
function billsOnCycle(charges) {
  const cycle = medianGapDays(charges);
  if (cycle == null) return false;
  if (charges.length === 2) return billingCycles.some(([low, high]) => cycle >= low && cycle <= high);
  const band = billingCycles.map(([low, high]) => [low * 0.9, high * 1.1]).find(([low, high]) => cycle >= low && cycle <= high);
  if (!band) return false;
  const gaps = charges.slice(1).map((older, i) => gapDays(charges[i], older));
  const onCycle = gaps.filter(gap => (gap >= band[0] && gap <= band[1]) || Math.abs(gap - cycle) <= Math.max(4, cycle * 0.2));
  return onCycle.length * 3 >= gaps.length * 2;
}
const isLongCycle = charges => (medianGapDays(charges) ?? 0) >= longCycleDays;
function hasExactPrice(charges) {
  if (!charges.length) return false;
  const amounts = charges.map(charge => charge.amount);
  const low = Math.min(...amounts), high = Math.max(...amounts);
  return high - low <= Math.max(0.10, Math.abs(low) * 0.005);
}
const continuesCycle = (gap, cycle) => Math.abs(gap - cycle) <= Math.max(5, cycle * 0.35);
function isActive(charges, referenceAt) {
  const latest = charges[0];
  if (charges.length < 2 || !latest) return false;
  if (new Set(charges.map(charge => monthOf(charge.at))).size < 2) return false;
  const cycle = medianGapDays(charges) ?? 0;
  const windowDays = Math.max(45, Math.min(cycle * 1.6, cycle + 60));
  return latest.at >= addDays(referenceAt, -Math.trunc(windowDays));
}

/** Charges grouped by price, each group newest first. */
function priceStreams(charges) {
  const streams = [];
  let previous = 0, lowest = 0;
  for (const charge of charges.slice().sort((a, b) => a.amount - b.amount)) {
    if (streams.length && charge.amount - previous <= Math.max(0.50, Math.abs(previous) * 0.01) && charge.amount - lowest <= Math.max(1.00, Math.abs(lowest) * 0.03)) {
      streams.at(-1).push(charge);
    } else {
      streams.push([charge]);
      lowest = charge.amount;
    }
    previous = charge.amount;
  }
  return streams.map(stream => stream.sort((a, b) => b.at - a.at));
}
/** Each result is one subscription's charges, newest first. */
export function subscriptionChains(charges) {
  const streams = priceStreams(charges).sort((a, b) => b[0].at - a[0].at);
  const chains = [];
  for (const stream of streams) {
    const streamEnd = stream[0].at;
    let best = null;
    const cycle = medianGapDays(stream);
    if (cycle != null && cycle < longCycleDays) {
      chains.forEach((chain, index) => {
        const chainStart = chain.at(-1)?.at;
        if (chainStart == null) return;
        const gap = (chainStart - streamEnd) / DAY;
        if (!(gap > 0) || !continuesCycle(gap, cycle) || !(gap < (best?.gap ?? Infinity))) return;
        best = { index, gap };
      });
    }
    if (best) chains[best.index].push(...stream); else chains.push(stream);
  }
  return chains;
}

/**
 * transactions: [{ at (ms), amount (signed dollars as synced), merchantName, logo, isIncome, category }]
 * already without transfers, excluded categories and uncounted investments.
 * Returns RecurringItem-like rows, largest first.
 */
export function detectSubscriptions(transactions, { categories = [], referenceAt, dismissed = [], manual = [], skipCategoryIds = [] }) {
  const dismissedKeys = new Set(dismissed), manualKeys = new Set(manual), skip = new Set(skipCategoryIds);
  const catLookup = new Map(categories.map(category => [category.id, category]));
  const lookbackStart = addDays(referenceAt, -760), shortCycleStart = addDays(referenceAt, -425);
  const withinWindow = chain => isLongCycle(chain) ? chain : chain.slice(0, (index => index < 0 ? chain.length : index)(chain.findIndex(charge => charge.at < shortCycleStart)));
  const groups = new Map(), matchCache = new Map();
  for (const tx of transactions) {
    if (tx.at < lookbackStart || tx.at > referenceAt || tx.isIncome) continue;
    if (tx.category != null && skip.has(tx.category)) continue;
    const rawName = String(tx.merchantName).trim();
    const key = normalizeMerchant(rawName);
    if (!key || dismissedKeys.has(key)) continue;
    const isManual = manualKeys.has(key);
    if (!isManual && rawName.includes('*') && dismissedKeys.has(legacyMerchantKey(rawName))) continue;
    const match = matchCache.get(key) ?? subscriptionMatch(rawName);
    matchCache.set(key, match);
    if (!isManual && match === 'none') continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tx);
  }
  const results = [];
  for (const [key, charges] of groups) {
    const chains = subscriptionChains(charges).map(withinWindow).filter(chain => chain.length)
      .map((chain, index) => ({ chain, index }))
      .sort((a, b) => (b.chain.length - a.chain.length) || (b.chain[0].at - a.chain[0].at) || (a.index - b.index))
      .map(entry => entry.chain);
    let active = [];
    for (const chain of chains) {
      if (!(active.length === 0 || (chain.length >= 4 && !isLongCycle(chain)))) continue;
      if (billsOnCycle(chain) && isActive(chain, referenceAt) && (!isLongCycle(chain) || hasExactPrice(chain))) active.push(chain);
    }
    if (!active.length) {
      if (manualKeys.has(key) && chains.length) active = [chains[0]];
      else if (matchCache.get(key) === 'guaranteed') {
        const all = charges.filter(charge => charge.at >= shortCycleStart).sort((a, b) => b.at - a.at);
        if (isActive(all, referenceAt)) active = [all];
      }
    }
    for (const chain of active) {
      const latest = chain[0];
      const category = latest.category != null ? catLookup.get(latest.category) : null;
      results.push({
        merchantName: latest.merchantName, amount: latest.amount, lastAt: latest.at, logo: latest.logo || '',
        category: latest.category, categoryIcon: category?.icon ?? null, categoryColor: category?.color ?? null,
        intervalDays: medianGapDays(chain),
      });
    }
  }
  return results.sort((a, b) => a.amount === b.amount
    ? a.merchantName.localeCompare(b.merchantName, undefined, { sensitivity: 'accent' })
    : b.amount - a.amount);
}

/** The "/mo" rollup: monthly-ish cadences pass through, others are scaled. */
export function monthlyEquivalent(item) {
  const interval = item.intervalDays;
  if (interval == null || (interval >= 25 && interval <= 35)) return item.amount;
  return item.amount * (30.44 / Math.max(7, interval));
}

/** The web app's rows as the iPhone's DerivedTransactionStore overload feeds them in. */
export function subscriptionInputs(rows) {
  return rows.filter(tx => !tx.transfer && !tx.excluded).map(tx => ({
    at: tx.at ?? new Date(`${tx.date}T12:00:00`).getTime(), amount: (tx.signedCents ?? tx.cents) / 100,
    merchantName: tx.merchantName ?? tx.merchant, logo: tx.logo || '', isIncome: tx.income === true,
    category: tx.category === 'uncategorized' ? null : tx.category,
  }));
}
