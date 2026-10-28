// Only server-filtered household rows enter this adapter. Never infer access
// from purchase metadata or read directly from Firebase/SQL financial stores.
export class DataError extends Error {
  constructor(code) { super(code); this.code = code; }
}
export function cents(value) {
  const input = typeof value === 'number' ? String(value) : value;
  if (typeof input !== 'string' || !/^-?\d+(?:\.\d{1,2})?$/.test(input)) throw new DataError('INVALID_FINANCIAL_VALUE');
  const negative = input.startsWith('-'), [whole, fraction = ''] = input.replace('-', '').split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount)) throw new DataError('INVALID_FINANCIAL_VALUE');
  return negative ? -amount : amount;
}
const text = value => typeof value === 'string' ? value : '';
const flag = value => { if (value == null) return false; if (typeof value !== 'boolean') throw new DataError('INVALID_SYNC_RESPONSE'); return value; };
// Timestamps (transactions.date) display on the browser's local calendar, as
// iOS does. Postgres DATE columns (snapshots) carry no time: node-pg serializes
// them as UTC midnight, so the local conversion would move US users back a day.
function day(value, { calendarDate = false } = {}) {
  if (typeof value !== 'string') throw new DataError('INVALID_DATE');
  if (calendarDate && /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.0+)?Z$/.test(value)) return day(value.slice(0, 10));
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const instant = new Date(value);
    if (!Number.isFinite(instant.getTime())) throw new DataError('INVALID_DATE');
    return `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, '0')}-${String(instant.getDate()).padStart(2, '0')}`;
  }
  const date = value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) throw new DataError('INVALID_DATE');
  return date;
}
// Same rule as PlaidRemoteLogo on iOS: only https artwork served by Plaid.
function plaidLogo(value) {
  if (typeof value !== 'string' || !value) return '';
  try { const url = new URL(value); const host = url.hostname.toLowerCase(); return url.protocol === 'https:' && (host === 'plaid.com' || host.endsWith('.plaid.com')) ? url.href : ''; } catch { return ''; }
}
const plainObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
function rows(value) { if (!Array.isArray(value)) throw new DataError('INVALID_SYNC_RESPONSE'); return value; }
function belongs(row, householdId) {
  if (!row || typeof row.id !== 'string' || row.household_id !== householdId) throw new DataError('HOUSEHOLD_CHANGED');
  return true;
}
export function normalizeSnapshot(profile, billing, payload) {
  const householdId = profile?.household?.id;
  if (!householdId || !profile.user?.id || !Array.isArray(profile.members) || billing?.household_id !== householdId || payload?.household_id !== householdId) throw new DataError('HOUSEHOLD_CHANGED');
  const changes = payload.changes;
  if (!changes) throw new DataError('INVALID_SYNC_RESPONSE');
  const categoryRows = rows(changes.categories);
  const categories = categoryRows.filter(row => belongs(row, householdId) && !flag(row.is_deleted)).map(row => ({
    id: row.id, name: text(row.name) || 'Unnamed category',
    color: /^[\da-f]{6}$/i.test(text(row.color_hex).replace('#', '')) ? `#${row.color_hex.replace('#', '')}` : '#6C6E73',
    icon: text(row.icon) || 'bag', excluded: flag(row.is_excluded), income: row.default_slug === 'income',
    transfer: row.default_slug === 'internal_transfers', order: Number(row.sort_order) || 0,
  })).sort((a, b) => a.order - b.order);
  const categoryMap = new Map(categories.map(row => [row.id, row]));
  const preferences = new Map();
  for (const row of rows(changes.user_preferences || [])) {
    belongs(row, householdId);
    if (row.user_id != null && row.user_id !== profile.user.id) throw new DataError('HOUSEHOLD_CHANGED');
    if (flag(row.is_deleted)) continue;
    // iOS stores every preference as {"v": value} (SyncManager.encodePreferenceValue).
    let value = row.pref_value;
    if (typeof value === 'string') { try { value = JSON.parse(value); } catch { throw new DataError('INVALID_SYNC_RESPONSE'); } }
    if (value && typeof value === 'object' && !Array.isArray(value) && 'v' in value) value = value.v;
    preferences.set(row.pref_key, value);
  }
  const trendExclusions = preferences.get('candor_trends_excluded_ids') || [];
  if (!Array.isArray(trendExclusions)) throw new DataError('INVALID_SYNC_RESPONSE');
  const trendExcludedIds = new Set(trendExclusions.map(id => String(id).toLowerCase()));
  const includeInvestments = preferences.get('candor_include_investments') === true;
  const purges = new Set(rows(changes.transaction_purges || []).map(row => row.id));
  let needsUncategorized = false;
  const transactions = rows(changes.transactions).filter(row => belongs(row, householdId) && !flag(row.is_deleted) && !purges.has(row.id)).map(row => {
    const category = categoryMap.get(row.category_id);
    if (!category) needsUncategorized = true;
    return {
      id: row.id, date: day(row.date), merchant: text(row.merchant_name) || 'Transaction',
      cents: Math.abs(cents(row.amount)), category: category?.id || 'uncategorized',
      income: flag(row.is_income),
      transfer: flag(row.is_internal_transfer) || category?.transfer === true,
      excluded: category?.excluded === true || (!flag(row.is_income) && categoryRows.find(cat => cat.id === row.category_id)?.default_slug === 'investments' && !includeInvestments),
      trendExcluded: trendExcludedIds.has(row.id.toLowerCase()), note: text(row.note), logo: plaidLogo(row.merchant_logo_url),
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
  if (needsUncategorized) categories.push({ id: 'uncategorized', name: 'Uncategorized', color: '#6C6E73', icon: 'bag' });
  const accounts = rows(changes.manual_accounts).filter(row => belongs(row, householdId) && !flag(row.is_deleted)).map(row => ({
    id: row.id, name: text(row.name) || 'Manual account', cents: flag(row.is_asset) ? cents(row.balance) : Math.abs(cents(row.balance)),
    asset: flag(row.is_asset), manual: true, type: flag(row.is_asset) ? 'Other Assets' : 'Other Liabilities',
    updatedAt: text(row.last_updated), institution: 'Manual', mask: '', icon: text(row.icon),
  }));
  const historyByDate = new Map();
  for (const row of rows(changes.net_worth_snapshots)) {
    belongs(row, householdId);
    if (flag(row.is_deleted)) continue;
    const assets = cents(row.total_assets) + cents(row.manual_assets);
    const liabilities = cents(row.total_liabilities) + cents(row.manual_liabilities);
    const date = day(row.date, { calendarDate: true });
    const prior = historyByDate.get(date);
    if (!prior || Number(row.version) >= prior.version) historyByDate.set(date, { date, assets, liabilities, cents: assets - liabilities, version: Number(row.version) || 0 });
  }
  return {
    profile, billing: { hasAccess: billing.has_access === true, status: text(billing.status), expiresAt: billing.access_expires_at || null, isPurchaser: billing.is_purchaser === true ? true : billing.is_purchaser === false ? false : null, productId: text(billing.product_id), trialEndsAt: billing.trial_ends_at || null },
    transactions, categories, accounts, history: [...historyByDate.values()].sort((a, b) => a.date.localeCompare(b.date)), householdId,
    // Planning blobs are parsed by preview/planning.js, which rejects any
    // shape the app itself would not accept.
    plans: {
      retirement: preferences.get('candor_retirement_plan') ?? null, loans: preferences.get('candor_debt_loans') ?? null,
      ownership: preferences.get('candor_ownership_split') ?? null,
      nicknames: plainObject(preferences.get('candor_account_nicknames')), hideIdle: preferences.get('candor_hide_idle_accounts') === true,
    },
    bankAccounts: [], banksUnavailable: null,
  };
}

// Balances from /get_balances (Plaid accounts/get, cached, no extra charge).
// Same buckets as the app: depository and investment are assets; credit and
// loan are liabilities; anything else is left out of net worth, as on iOS.
export function normalizeBankAccounts(items) {
  const accounts = [];
  for (const { item, response } of items) {
    if (!item || typeof item.item_id !== 'string' || !Array.isArray(response?.accounts)) throw new DataError('INVALID_BALANCES');
    for (const account of response.accounts) {
      if (!account || typeof account.id !== 'string') throw new DataError('INVALID_BALANCES');
      const type = text(account.type), current = account.balances?.current;
      if (!['depository', 'investment', 'credit', 'loan'].includes(type)) continue;
      if (current != null && (typeof current !== 'number' || !Number.isFinite(current))) throw new DataError('INVALID_BALANCES');
      accounts.push({
        id: account.id, itemId: item.item_id, institution: text(item.institution_name) || 'Connected bank', name: text(account.name) || 'Account',
        mask: text(account.mask), type, subtype: text(account.subtype), currency: text(account.balances?.iso_currency_code),
        balance: current ?? 0, asset: type === 'depository' || type === 'investment',
      });
    }
  }
  return accounts;
}
