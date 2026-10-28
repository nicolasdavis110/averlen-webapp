export const householdId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export function fixture({ owner = true, members = 1, hasAccess = true, suffix = '' } = {}) {
  const household = householdId + suffix, user = userId + suffix;
  return {
    profile: { user: { id: user, email: 'test@example.com', display_name: `Test account${suffix}` }, household: { id: household, name: `Test household${suffix}`, is_owner: owner }, members: Array.from({ length: members }, (_, i) => ({ id: i ? 'other-member' : user, is_you: !i })) },
    billing: { household_id: household, has_access: hasAccess, status: hasAccess ? 'active' : 'expired' },
    payload: { household_id: household, changes: {
      categories: [{ id: 'groceries', household_id: household, name: 'Groceries', color_hex: '5FAF87', sort_order: 0 }, { id: 'investments', household_id: household, name: 'Investments', default_slug: 'investments' }, { id: 'income', household_id: household, name: 'Income', default_slug: 'income' }],
      transactions: [
        { id: 'tx-1', household_id: household, date: '2026-10-25T12:00:00Z', merchant_name: 'Example market', amount: 123.45, category_id: 'groceries', is_income: false },
        { id: 'tx-2', household_id: household, date: '2026-10-15T12:00:00Z', merchant_name: 'Example salary', amount: 4000, category_id: 'income', is_income: true },
      ],
      manual_accounts: [{ id: 'manual-1', household_id: household, name: 'Example asset', balance: 10000, is_asset: true }],
      net_worth_snapshots: [
        { id: 'snapshot-1', household_id: household, date: '2026-09-25T00:00:00.000Z', total_assets: '2000.00', total_liabilities: '500.00', manual_assets: '9000.00', manual_liabilities: '0.00', version: 1 },
        { id: 'snapshot-2', household_id: household, date: '2026-10-25T00:00:00.000Z', total_assets: '3000.00', total_liabilities: '500.00', manual_assets: '10000.00', manual_liabilities: '0.00', version: 2 },
      ], user_preferences: [], transaction_purges: [],
    } },
    // /list_connected_accounts and /get_balances, as the server returns them.
    items: [{ item_id: `item-1${suffix}`, institution_name: 'Example Bank', can_manage: true }],
    balances: { [`item-1${suffix}`]: { accounts: [
      { id: 'acct-checking', name: 'Checking', type: 'depository', subtype: 'checking', mask: '1111', balances: { current: 2500.5, iso_currency_code: 'USD' } },
      { id: 'acct-card', name: 'Card', type: 'credit', subtype: 'credit card', mask: '2222', balances: { current: 420.25, iso_currency_code: 'USD' } },
      { id: 'acct-other', name: 'Other', type: 'other', subtype: null, mask: null, balances: { current: 5 } },
    ] } },
  };
}
export function fakeAuth() {
  let user = null, watcher = () => {};
  const calls = [];
  return {
    calls, beforeReauthenticate: null,
    currentUser: () => user,
    subscribe(callback) { watcher = callback; queueMicrotask(() => callback(user)); return () => { watcher = () => {}; }; },
    switchUser(uid = null) { user = uid ? { uid, email: 'test@example.com' } : null; watcher(user); },
    async signIn(email, password) { if (password !== 'sample-password') throw { code: 'auth/invalid-credential' }; this.switchUser('firebase-test'); },
    async signInApple() { this.switchUser('firebase-test'); },
    async signOut() { calls.push('sign-out'); this.switchUser(); },
    async token(target, fresh) { calls.push(fresh ? 'fresh-token' : 'token'); return `test-token-${target.uid}`; },
    async reauthenticate(target) { calls.push('reauthenticate'); await this.beforeReauthenticate?.(); },
    provider: () => 'password', async resetPassword() {},
  };
}
export function fakeServer(data = fixture()) {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ path: new URL(url).pathname, method: options.method, headers: options.headers, cache: options.cache, credentials: options.credentials, body: options.body ? JSON.parse(options.body) : undefined });
    const path = new URL(url).pathname;
    let body;
    if (path === '/api/auth/me') body = data.profile;
    else if (path === '/api/billing/status') body = data.billing;
    else if (path === '/api/sync/pull') body = data.payload;
    else if (path === '/list_connected_accounts' && options.method === 'POST') body = { items: data.items };
    else if (path === '/get_balances' && options.method === 'POST') { body = data.balances[JSON.parse(options.body).item_id]; if (!body) return new Response('{}', { status: 500 }); }
    else if (path === '/api/auth/export') body = { transactions: data.payload.changes.transactions };
    else if (path === '/api/auth/account' && options.method === 'DELETE') body = { message: 'Account deleted.', provider_cleanup: 'queued' };
    else throw new Error('Unexpected test request');
    return new Response(JSON.stringify(body), { status: 200 });
  };
  return { requests, fetchImpl };
}
