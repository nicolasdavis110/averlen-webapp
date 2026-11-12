// Coming up: a line-by-line port of MoneyAhead.swift, MoneyAheadSnapshots.swift
// and the merchant matching in RecurringDetector.swift on iOS. Keep the two in
// step: the same history must give the same estimates on the web as on the
// phone. Dates are whole days (days since 1970-01-01 on the calendar), which
// is how the iPhone compares them (startOfDay on both sides).
import { listedPatterns, guaranteedPatterns, everydayWordBrands, brandEndings } from './subscription-patterns.js?v=c5729769d0';

// MARK: merchant names (RecurringDetector.swift)

const WORD = '[\\p{Alphabetic}\\p{M}\\p{Nd}\\p{Pc}\\u200c\\u200d]';
const processorPrefix = new RegExp(`^(?:paypal|pp|google|goog|sq|tst) ?\\* ?(${WORD}+)$`, 'u');
const trailingCode = new RegExp(`\\*${WORD}*$`, 'u');
const noiseSuffixes = ['llc', 'inc', 'co', 'corp', 'ltd', 'online', 'payment', 'autopay', 'recurring', 'subscription'];

function normalize(raw, unwrappingProcessor) {
  let name = String(raw).trim().toLowerCase().replace(/\s+/gu, ' ');
  name = name.replace(/\s*#\p{Nd}+$/u, '');
  if (unwrappingProcessor) {
    const match = processorPrefix.exec(name);
    if (match) name = match[1];
  }
  name = name.replace(trailingCode, '').trim();
  for (const suffix of noiseSuffixes) {
    if (name.endsWith(` ${suffix}`)) name = name.slice(0, -(suffix.length + 1));
  }
  return name.trim();
}
export const normalizeMerchant = raw => normalize(raw, true);
export const legacyMerchantKey = raw => normalize(raw, false);

function matchableMerchant(raw) {
  return normalizeMerchant(raw)
    .replace(/\+/g, ' plus ')
    .replace(/(?<=[a-z]{3})com$/, ' com')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function normalizePattern(raw) {
  return raw.toLowerCase().split('*').map(part => part.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()).join('*');
}
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const everyday = new Set(everydayWordBrands);
function compile(patterns, guaranteed) {
  const endings = brandEndings.join('|');
  const alternatives = [];
  for (const raw of patterns) {
    const pattern = normalizePattern(raw);
    const parts = pattern.split('*').filter(Boolean).map(escapeRegex);
    if (!parts.length) continue;
    if (parts.length === 1 && everyday.has(pattern)) {
      if (guaranteed) continue;
      alternatives.push(`^${parts[0]}(?: (?:${endings}))*$`);
    } else {
      alternatives.push(`\\b${parts.join('(?:\\b.*\\b)?')}\\b`);
    }
  }
  return new RegExp(alternatives.join('|'));
}
let compiled = null;
const matchMemo = new Map();
/** 'guaranteed', 'listed' or 'none', as RecurringDetector.subscriptionMatch. */
export function subscriptionMatch(merchantName) {
  const merchant = matchableMerchant(merchantName);
  if (!merchant) return 'none';
  if (matchMemo.has(merchant)) return matchMemo.get(merchant);
  compiled ||= { guaranteed: compile(guaranteedPatterns, true), listed: compile(listedPatterns, false) };
  const match = compiled.guaranteed.test(merchant) ? 'guaranteed' : compiled.listed.test(merchant) ? 'listed' : 'none';
  if (matchMemo.size >= 20000) matchMemo.clear();
  matchMemo.set(merchant, match);
  return match;
}

const genericFirstWords = new Set(['american', 'bank', 'city', 'credit', 'first', 'great', 'national', 'new', 'north', 'south', 'state', 'united', 'west', 'east']);
/** One name per company, as MoneyAhead.brandKey. */
export function brandKey(merchant) {
  const normalized = normalizeMerchant(merchant);
  const words = normalized.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
  if (words[0] === 'the') words.shift();
  const first = words[0];
  if (!first || [...first].length < 3) return normalized;
  return genericFirstWords.has(first) ? words.slice(0, 2).join(' ') : first;
}

// MARK: calendar days

export const dayNumber = key => Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10))) / 86400000;
export const dayKey = n => new Date(n * 86400000).toISOString().slice(0, 10);
const parts = n => { const d = new Date(n * 86400000); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() }; };
const dayOfMonth = n => parts(n).d;
const daysInMonth = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const isMonthEnd = n => { const p = parts(n); return p.d === daysInMonth(p.y, p.m); };
const isWeekend = n => [0, 6].includes(new Date(n * 86400000).getUTCDay());
function monthDate(anchor, offset, day) {
  const p = parts(anchor);
  const first = new Date(Date.UTC(p.y, p.m + offset, 1));
  const count = daysInMonth(first.getUTCFullYear(), first.getUTCMonth());
  return first.getTime() / 86400000 + Math.min(day, count) - 1;
}
const days = (a, b) => b - a;

// MARK: schedules

const isAnnual = cycle => cycle.type === 'months' && cycle.months === 12;
const overdueGraceDays = cycle => cycle.type === 'days' ? Math.min(Math.floor(cycle.days / 2), 7) : 7;
function estimatedAmount(cycle, occurrence, rows) {
  if (cycle.type === 'twice' && occurrence % 2 === 1 && rows.length >= 2) return rows[rows.length - 2].amount;
  return rows.at(-1)?.amount ?? 0;
}
function cycleDate(cycle, anchor, occurrence) {
  if (cycle.type === 'days') return anchor + cycle.days * occurrence;
  if (cycle.type === 'months') {
    let due = null;
    for (const offset of [-1, 0, 1]) {
      const candidate = monthDate(anchor, offset, cycle.day);
      if (due == null || Math.abs(days(candidate, anchor)) < Math.abs(days(due, anchor))) due = candidate;
    }
    return monthDate(due, cycle.months * occurrence, cycle.day);
  }
  const covered = anchor + 3;
  const dates = [0, 1, 2].flatMap(offset => [cycle.first, cycle.second].map(day => monthDate(anchor, offset, day)))
    .filter(date => date > covered).sort((a, b) => a - b);
  return occurrence - 1 < dates.length ? dates[occurrence - 1] : null;
}

const byDateThenId = (a, b) => a.date !== b.date ? a.date - b.date : a.idKey < b.idKey ? -1 : a.idKey > b.idKey ? 1 : 0;
const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0;

/**
 * inputs: [{ id, date (day number), merchant, amount (dollars), kind: 'bill'|'income'|'refund', isKnownBill }]
 * today: day number. Returns { events, changes } like MoneyAhead.Report.
 */
export function generate(inputs, today) {
  const end = today + 30, cutoff = today - 760, recent = today - 31, changedSince = today - 62;
  const seen = new Set();
  const clean = inputs.filter(row => Number.isFinite(row.amount) && row.amount > 0 && row.date >= cutoff && row.date <= today && !seen.has(row.id) && seen.add(row.id))
    .map(row => ({ isKnownBill: true, ...row, idKey: String(row.id).toUpperCase() }));
  const window = { today, end, recent, changedSince, dataIsCurrent: clean.some(row => days(row.date, today) <= 10) };
  const groups = new Map();
  for (const row of clean) {
    const key = brandKey(row.merchant) + (row.kind === 'income' ? '|income' : '|bill');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const result = { events: [], changes: [] };
  for (const key of [...groups.keys()].sort(compareText)) {
    if (key.startsWith('|')) continue;
    const group = groups.get(key);
    const refunds = group.filter(row => row.kind === 'refund');
    const all = group.filter(row => row.kind !== 'refund').sort(byDateThenId);
    const latest = all.at(-1);
    if (!latest) continue;
    let rows = all.slice();
    let duplicate = null;
    const wasRefunded = isRefunded(latest, refunds);
    if (rows.length >= 4 && latest.kind === 'bill' && latest.date >= recent && !wasRefunded) {
      const previous = rows[rows.length - 2];
      const gap = days(previous.date, latest.date);
      const history = rows.slice(0, -1);
      if (gap >= 0 && gap <= 3 && Math.abs(previous.amount - latest.amount) < 0.01 && cadence(history)) {
        duplicate = duplicateChange(previous, latest);
        rows.pop();
      }
    }
    if (wasRefunded) {
      const previous = rows.length >= 2 ? rows[rows.length - 2] : null;
      const gap = previous ? days(previous.date, latest.date) : -1;
      if (previous && Math.abs(previous.amount - latest.amount) < 0.01 && gap >= 0 && gap <= 3) rows.pop();
      else if (cadence(rows.slice(-6))) continue;
    }
    const tail = rows.slice(-6);
    const cycle = cadence(tail);
    if (cycle && !looksLikeTwoServices(tail, cycle)) {
      if (qualifies(tail)) {
        if (duplicate) result.changes.push(duplicate);
        add(tail, cycle, overdueGraceDays(cycle), window, result);
      }
      continue;
    }
    const pay = newPaySchedule(all, window);
    if (pay) {
      result.changes.push({ id: `newDeposit|${latest.id}`, merchant: usualName(all), date: latest.date, amount: latest.amount, previousAmount: null, reason: 'newDeposit', transactionIDs: all.slice().reverse().map(row => row.id), isIncome: true });
      add(all, pay, overdueGraceDays(pay), window, result);
      continue;
    }
    const explained = new Set();
    let reportedStoppedPay = false;
    const found = monthlySeries(all, today).filter(series => monthlyPattern(series.slice(-7)) != null && qualifies(series.slice(-7)))
      .map((series, index) => ({ series, index }))
      // Swift's sort isn't stable; ties here would need two series ending on one day.
      .sort((a, b) => (b.series.at(-1)?.date ?? -Infinity) - (a.series.at(-1)?.date ?? -Infinity) || a.index - b.index)
      .map(entry => entry.series);
    const payWentQuiet = latest.kind === 'income' && found.length >= 2 && days(latest.date, today) > 20;
    for (const series of found) {
      const recentRows = series.slice(-7);
      const missedMonth = monthlyPattern(recentRows);
      const last = recentRows.at(-1);
      if (missedMonth == null || !last) continue;
      for (const row of series) explained.add(row.id);
      if (isRefunded(last, refunds) && !twin(last, all)) continue;
      if (last.kind === 'bill' && last.date >= recent && !isRefunded(last, refunds)) {
        const other = twin(last, all);
        if (other && !series.some(row => row.id === other.id)) {
          const lastIsLater = last.date > other.date;
          result.changes.push(duplicateChange(lastIsLater ? other : last, lastIsLater ? last : other));
        }
      }
      const monthly = { type: 'months', months: 1, day: anchorDay(recentRows) };
      const grace = payWentQuiet ? -1 : missedMonth ? 38 : overdueGraceDays(monthly);
      const stopped = add(recentRows, monthly, grace, window, result, !(last.kind === 'income' && reportedStoppedPay));
      reportedStoppedPay = reportedStoppedPay || stopped;
    }
    const remaining = all.filter(row => !explained.has(row.id));
    const sameAmount = new Map();
    for (const row of remaining) {
      const cents = Math.round(row.amount * 100);
      if (!sameAmount.has(cents)) sameAmount.set(cents, []);
      sameAmount.get(cents).push(row);
    }
    for (const amount of [...sameAmount.keys()].sort((a, b) => a - b)) {
      const stream = sameAmount.get(amount).slice(-6);
      const last = stream.at(-1);
      const streamCycle = cadence(stream);
      if (!last || !streamCycle || !qualifies(stream) || isRefunded(last, refunds)) continue;
      add(stream, streamCycle, overdueGraceDays(streamCycle), window, result);
    }
  }
  result.events.sort((a, b) => a.date - b.date || compareText(a.id, b.id));
  result.changes.sort((a, b) => b.date - a.date || compareText(a.id, b.id));
  return result;
}

function add(rows, cycle, grace, window, result, reportStopped = true) {
  const last = rows.at(-1);
  if (!last) return false;
  const isIncome = last.kind === 'income';
  const name = usualName(rows);
  const ids = rows.slice().reverse().map(row => row.id);
  const anchor = last.date;
  const next = cycleDate(cycle, anchor, 1);
  if (next == null) return false;
  const overdue = days(next, window.today);
  if (overdue > grace) {
    if (!reportStopped || !window.dataIsCurrent || isAnnual(cycle) || overdue > 60 || rows.length < (isIncome ? 3 : 4)) return false;
    result.changes.push({ id: `stopped|${last.id}`, merchant: name, date: last.date, amount: last.amount, previousAmount: null, reason: 'stopped', transactionIDs: ids, isIncome });
    return true;
  }
  const found = amountChange(rows, window.changedSince, isIncome);
  if (found) {
    const row = rows[found.index];
    result.changes.push({
      id: `amount|${row.id}|${row.amount}|${found.baseline}`, merchant: name, date: row.date, amount: row.amount,
      previousAmount: found.baseline, reason: 'amount', transactionIDs: rows.slice(found.index - 2, found.index + 1).reverse().map(r => r.id), isIncome,
    });
  }
  for (let occurrence = 1; occurrence <= 7; occurrence++) {
    const due = cycleDate(cycle, anchor, occurrence);
    if (due == null) break;
    const date = isIncome ? fridayBeforeIfWeekend(due) : due;
    if (date >= window.end) break;
    if (date < window.today) continue;
    result.events.push({ id: `${last.id}|${occurrence}`, merchant: name, date, amount: estimatedAmount(cycle, occurrence, rows), isIncome, isAnnual: isAnnual(cycle), transactionIDs: ids });
    if (isAnnual(cycle) && !isIncome) {
      result.changes.push({ id: `renewal|${last.id}`, merchant: name, date, amount: last.amount, previousAmount: null, reason: 'renewal', transactionIDs: ids, isIncome: false });
    }
  }
  return false;
}

function monthlySeries(rows, today) {
  if (!rows.length) return [];
  const dom = rows.map(row => dayOfMonth(row.date));
  const busy = rows.filter(row => days(row.date, today) <= 180).length > 15;
  const series = [];
  rows.forEach((row, position) => {
    let best = null;
    series.forEach((candidate, index) => {
      const lastPosition = candidate.at(-1);
      const gap = days(rows[lastPosition].date, row.date);
      if (gap < 24 || gap > 95) return;
      const last = rows[lastPosition];
      const dayGap = monthDistance(dom[lastPosition], dom[position]);
      if (dayGap > 3) return;
      const same = Math.abs(last.amount - row.amount) <= Math.max(1, last.amount * 0.03);
      const ratio = Math.max(last.amount, row.amount) / Math.min(last.amount, row.amount);
      if (!(same || (!busy && (dayGap <= 1 || ratio <= 2)))) return;
      if (best && ((best.sameAmount && !same) || (best.sameAmount === same && best.dayGap <= dayGap))) return;
      best = { index, sameAmount: same, dayGap };
    });
    if (best) series[best.index].push(position); else series.push([position]);
  });
  return series.map(list => list.map(position => rows[position]));
}

function monthlyPattern(rows) {
  if (rows.length < 3) return null;
  const gaps = rows.slice(1).map((row, i) => days(rows[i].date, row.date));
  const onTime = gaps.filter(gap => gap >= 24 && gap <= 36).length;
  const missed = gaps.length - onTime;
  return onTime >= 2 && onTime > missed ? missed > 0 : null;
}

function newPaySchedule(rows, window) {
  const last = rows.at(-1);
  if (rows.length < 2 || rows.length > 3 || !last || last.kind !== 'income' || days(last.date, window.today) > 21) return null;
  const previous = rows[rows.length - 2];
  const gap = days(previous.date, last.date);
  if (gap < 12 || gap > 17 || Math.abs(last.amount - previous.amount) > previous.amount * 0.25) return null;
  if (gap === 14) return { type: 'days', days: 14 };
  const first = dayOfMonth(previous.date), second = dayOfMonth(last.date);
  return first === second ? null : { type: 'twice', first: Math.min(first, second), second: Math.max(first, second) };
}

function amountChange(rows, since, isIncome) {
  if (rows.length < 3) return null;
  let index = rows.length - 1;
  while (index >= 2 && rows[index].date >= since) {
    const row = rows[index];
    const prior = rows.slice(index - 2, index).map(r => r.amount);
    const baseline = prior.reduce((sum, value) => sum + value, 0) / 2;
    const steadyBefore = prior.every(value => Math.abs(value - baseline) <= (isIncome ? baseline * 0.02 : Math.max(0.50, baseline * 0.01)));
    if (steadyBefore && Math.abs(row.amount - baseline) >= Math.max(1, baseline * (isIncome ? 0.10 : 0.03))) return { index, baseline };
    if (Math.abs(rows[index - 1].amount - row.amount) > Math.max(0.50, row.amount * 0.01)) return null;
    index -= 1;
  }
  return null;
}

function looksLikeTwoServices(rows, cycle) {
  if (cycle.type !== 'twice' || rows.at(-1)?.kind !== 'bill') return false;
  return new Set(rows.map(row => normalizeMerchant(row.merchant))).size > 1;
}

function qualifies(rows) {
  if (rows.some(row => row.isKnownBill)) return true;
  const last = rows.at(-1);
  if (rows.length < 4 || !last) return false;
  return rows.every(row => Math.abs(row.amount - last.amount) <= Math.max(1, last.amount * 0.01));
}

function usualName(rows) {
  const counts = new Map();
  for (const row of rows) counts.set(row.merchant, (counts.get(row.merchant) || 0) + 1);
  const most = Math.max(0, ...counts.values());
  const name = rows.findLast(row => counts.get(row.merchant) === most)?.merchant ?? rows.at(-1)?.merchant ?? '';
  return name.replace(/\s+(PPD|WEB|CCD|TEL) ID:.*$/i, '');
}

const isRefunded = (row, refunds) => refunds.some(refund => refund.date >= row.date && Math.abs(refund.amount - row.amount) < 0.01);
const twin = (row, rows) => rows.findLast(other => other.id !== row.id && Math.abs(other.amount - row.amount) < 0.01 && Math.abs(days(other.date, row.date)) <= 3);
const duplicateChange = (first, second) => ({ id: `duplicate|${first.id}|${second.id}`, merchant: second.merchant, date: second.date, amount: second.amount, previousAmount: null, reason: 'possibleDuplicate', transactionIDs: [second.id, first.id], isIncome: false });
function fridayBeforeIfWeekend(date) {
  const weekday = new Date(date * 86400000).getUTCDay();
  return weekday === 6 ? date - 1 : weekday === 0 ? date - 2 : date;
}
function monthDistance(a, b) { const gap = Math.abs(a - b); return Math.min(gap, 31 - gap); }

function anchorDay(rows) {
  if (rows.every(row => isMonthEnd(row.date))) return 31;
  const sorted = rows.map(row => dayOfMonth(row.date)).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function isWithinOneWorkingDay(date, due) {
  const gap = days(due, date);
  if (Math.abs(gap) > 3) return false;
  if (gap === 0) return true;
  let moved = 0;
  for (let step = 1; step <= Math.abs(gap); step++) if (!isWeekend(due + (gap < 0 ? -step : step))) moved += 1;
  return moved <= 1;
}
function dueDay(dates) {
  if (dates.every(isMonthEnd)) return 31;
  const counts = new Map();
  for (const date of dates) counts.set(dayOfMonth(date), (counts.get(dayOfMonth(date)) || 0) + 1);
  const candidates = [...counts.keys()].sort((a, b) => (counts.get(b) - counts.get(a)) || (b - a));
  return candidates.find(day => dates.every(date => [-1, 0, 1].some(offset => isWithinOneWorkingDay(date, monthDate(date, offset, day))))) ?? null;
}
function cadence(rows) {
  if (rows.length < 2) return null;
  const gaps = rows.slice(1).map((row, i) => days(rows[i].date, row.date));
  const all = (low, high) => gaps.every(gap => gap >= low && gap <= high);
  if (all(350, 380)) return { type: 'months', months: 12, day: anchorDay(rows) };
  if (rows.length < 3) return null;
  if (all(6, 8)) return { type: 'days', days: 7 };
  if (rows.length >= 4 && all(12, 19) && !gaps.every(gap => gap === 14)) {
    const dates = rows.map(row => row.date);
    const first = dueDay(dates.filter((_, i) => i % 2 === 0)), second = dueDay(dates.filter((_, i) => i % 2 === 1));
    if (first != null && second != null && first !== second) return { type: 'twice', first: Math.min(first, second), second: Math.max(first, second) };
  }
  if (all(12, 16)) {
    if (gaps.every(gap => gap === 14)) return { type: 'days', days: 14 };
    const span = days(rows[0].date, rows.at(-1).date);
    const steady = rows.length >= 4 && all(13, 15) && Math.abs(span - 14 * gaps.length) <= 1;
    return steady ? { type: 'days', days: 14 } : null;
  }
  for (const [low, high, months] of [[26, 35, 1], [57, 65, 2], [85, 95, 3], [175, 190, 6]]) {
    if (all(low, high)) return { type: 'months', months, day: anchorDay(rows) };
  }
  return null;
}

// MARK: inputs (MoneyAheadSnapshots.swift)

const FIXED_SLUGS = new Set(['housing', 'bills_utilities', 'debt', 'childcare']);
/**
 * transactions: web rows ({ id, date 'YYYY-MM-DD', merchantName, amount (signed dollars as synced),
 * flow: 'spending'|'refund'|'income'|'excluded', slug, incomeCategory }).
 */
export function moneyAheadInputs(transactions, { dismissed = [], manual = [] } = {}) {
  const dismissedKeys = new Set(dismissed), manualKeys = new Set(manual);
  const eligibility = new Map(), knownBrands = new Set(), rowCounts = new Map();
  const candidates = [];
  for (const tx of transactions) {
    if (tx.flow === 'excluded') continue;
    const key = normalizeMerchant(tx.merchantName);
    if (!key) continue;
    const brand = brandKey(tx.merchantName);
    if (tx.flow === 'income') {
      if (!tx.incomeCategory) continue;
      candidates.push({ tx, brand, known: true });
      continue;
    }
    if (dismissedKeys.has(key) || dismissedKeys.has(legacyMerchantKey(tx.merchantName))) continue;
    if (!eligibility.has(key)) eligibility.set(key, manualKeys.has(key) || subscriptionMatch(tx.merchantName) !== 'none');
    const known = eligibility.get(key) || FIXED_SLUGS.has(tx.slug || '');
    if (known) knownBrands.add(brand);
    rowCounts.set(brand, (rowCounts.get(brand) || 0) + 1);
    candidates.push({ tx, brand, known });
  }
  return candidates.flatMap(({ tx, brand, known }) => {
    const base = { id: tx.id, date: dayNumber(tx.date), merchant: tx.merchantName, amount: tx.amount };
    if (tx.flow === 'income') return [{ ...base, kind: 'income', isKnownBill: true }];
    if (!(known || knownBrands.has(brand) || (rowCounts.get(brand) || 0) >= 4)) return [];
    return [{ ...base, kind: tx.flow === 'refund' ? 'refund' : 'bill', isKnownBill: known }];
  });
}

/** The web app's rows (app/data.js or the sample) as Coming up reads them. */
export function webTransactions(rows, { categoryOf, flowOf }) {
  return rows.map(tx => {
    const category = categoryOf(tx.category) || {};
    return {
      id: tx.id, date: tx.date, merchantName: tx.merchantName ?? tx.merchant, amount: (tx.signedCents ?? tx.cents) / 100,
      flow: flowOf(tx), slug: category.slug || '',
      // Only an assigned Income category counts as pay, as isIncomeCategory on iOS.
      incomeCategory: tx.category !== 'uncategorized' && category.income === true,
    };
  });
}
