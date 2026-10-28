import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnection, safeMessage } from '../connection.js';
import { fixture, fakeAuth, fakeServer } from './fixtures.mjs';

const delay = () => new Promise(resolve => setTimeout(resolve, 0));
async function until(predicate) { for (let i = 0; i < 100; i++) { if (predicate()) return; await delay(); } assert.fail('Expected state transition did not occur'); }
async function setup(data = fixture(), overrides = {}) {
  const auth = fakeAuth(), server = fakeServer(data), events = [];
  const connection = createConnection({ auth, baseUrl: 'https://backend.example', deviceId: async () => '00000000-0000-4000-8000-000000000001', onState: event => events.push(event), fetchImpl: server.fetchImpl, ...overrides });
  auth.switchUser('firebase-test'); await until(() => events.at(-1)?.phase === 'ready');
  return { auth, server, events, connection };
}
test('existing-account loading only reads saved-data endpoints and uses no-store authenticated requests', async () => {
  const { server, connection } = await setup();
  assert.deepEqual(server.requests.map(row => row.path), ['/api/auth/me', '/api/billing/status', '/api/sync/pull', '/list_connected_accounts', '/get_balances']);
  assert.ok(server.requests.every(row => row.cache === 'no-store' && row.credentials === 'omit' && row.headers.Authorization.startsWith('Bearer test-token')));
  assert.ok(server.requests.slice(0, 3).every(row => row.method === 'GET'));
  // Balance reads are POSTs only because the server routes take item_id in a JSON body.
  assert.deepEqual(server.requests.slice(3).map(row => [row.method, row.headers['Content-Type'], row.body]), [['POST', 'application/json', {}], ['POST', 'application/json', { item_id: 'item-1' }]]);
  connection.dispose();
});
test('bank balances load read-only and match the app\'s asset and liability buckets', async () => {
  const { events, connection } = await setup();
  const data = events.at(-1).data;
  assert.equal(data.banksUnavailable, null);
  assert.deepEqual(data.bankAccounts.map(account => [account.id, account.asset, account.balance, account.institution]), [['acct-checking', true, 2500.5, 'Example Bank'], ['acct-card', false, 420.25, 'Example Bank']]);
  connection.dispose();
});
test('no plan means no bank balance requests', async () => {
  const { server, events, connection } = await setup(fixture({ hasAccess: false }));
  assert.ok(!server.requests.some(row => ['/list_connected_accounts', '/get_balances'].includes(row.path)));
  assert.deepEqual(events.at(-1).data.bankAccounts, []);
  connection.dispose();
});
test('a failed bank read keeps saved records available', async () => {
  const data = fixture(); data.balances = {};
  const { events, connection } = await setup(data);
  assert.equal(events.at(-1).phase, 'ready');
  assert.equal(events.at(-1).data.transactions.length, 2);
  assert.deepEqual(events.at(-1).data.bankAccounts, []);
  assert.ok(events.at(-1).data.banksUnavailable);
  connection.dispose();
});
test('sign-out clears ready state before awaiting Firebase completion', async () => {
  const { auth, events, connection } = await setup();
  let finish; auth.signOut = () => new Promise(resolve => { finish = resolve; });
  const signOut = connection.signOut();
  assert.equal(events.at(-1).phase, 'signed-out'); assert.equal(events.at(-1).data, undefined);
  finish(); await signOut; connection.dispose();
});
test('a delayed response from the old account cannot reappear after switching accounts', async () => {
  const auth = fakeAuth(), events = [], first = fixture(), second = fixture({ suffix: '-second' });
  let releaseFirst;
  const deferred = new Promise(resolve => { releaseFirst = resolve; });
  const connection = createConnection({ auth, baseUrl: 'https://backend.example', deviceId: async () => 'device', onState: event => events.push(event), fetchImpl: async (url, options) => {
    const isFirst = options.headers.Authorization.endsWith('first'); const data = isFirst ? first : second;
    const path = new URL(url).pathname;
    if (isFirst && path === '/api/sync/pull') await deferred; // Deliberately ignores abort to exercise the generation check.
    const body = path === '/api/auth/me' ? data.profile : path === '/api/billing/status' ? data.billing : data.payload;
    return new Response(JSON.stringify(body));
  } });
  auth.switchUser('first'); await delay(); auth.switchUser('second');
  await until(() => events.at(-1)?.phase === 'ready'); releaseFirst(); await delay();
  assert.equal(events.at(-1).data.householdId, second.profile.household.id);
  assert.ok(events.filter(event => event.phase === 'ready').every(event => event.data.householdId === second.profile.household.id));
  connection.dispose();
});
test('expired subscriptions can still read and export saved data after fresh authentication', async () => {
  const { auth, server, events, connection } = await setup(fixture({ hasAccess: false }));
  assert.equal(events.at(-1).data.billing.hasAccess, false);
  await connection.exportData('sample-password');
  assert.equal(server.requests.at(-1).path, '/api/auth/export');
  const reauth = auth.calls.indexOf('reauthenticate');
  assert.ok(reauth >= 0 && auth.calls.slice(reauth + 1).includes('fresh-token'));
  connection.dispose();
});
test('shared owners cannot send a deletion request and must transfer ownership first', async () => {
  const { auth, server, connection } = await setup(fixture({ owner: true, members: 2 }));
  await assert.rejects(connection.deleteAccount('sample-password'), { code: 'TRANSFER_OWNERSHIP_FIRST' });
  assert.ok(!server.requests.some(row => row.method === 'DELETE'));
  assert.ok(!auth.calls.includes('reauthenticate')); connection.dispose();
});
test('deletion refreshes identity, revalidates the current household, deletes server data first, then signs out', async () => {
  const { auth, server, events, connection } = await setup();
  const result = await connection.deleteAccount('sample-password');
  assert.equal(result.provider_cleanup, 'queued');
  assert.deepEqual(server.requests.slice(-2).map(row => [row.path, row.method]), [['/api/auth/me', 'GET'], ['/api/auth/account', 'DELETE']]);
  assert.ok(auth.calls.indexOf('fresh-token') > auth.calls.indexOf('reauthenticate'));
  assert.equal(auth.calls.at(-1), 'sign-out'); assert.ok(events.some(event => event.phase === 'deleted'));
  connection.dispose();
});
test('a new shared owner restriction discovered after reauthentication blocks deletion', async () => {
  const data = fixture(), { auth, server, connection } = await setup(data);
  auth.beforeReauthenticate = async () => { data.profile.members.push({ id: 'new-member' }); };
  await assert.rejects(connection.deleteAccount('sample-password'), { code: 'TRANSFER_OWNERSHIP_FIRST' });
  assert.ok(!server.requests.some(row => row.method === 'DELETE')); connection.dispose();
});
test('switching identity while confirming deletion never deletes the replacement account', async () => {
  const { auth, server, connection } = await setup();
  auth.beforeReauthenticate = async () => auth.switchUser('other-account');
  await assert.rejects(connection.deleteAccount('sample-password'), { code: 'SESSION_CHANGED' });
  assert.ok(!server.requests.some(row => row.method === 'DELETE')); connection.dispose();
});
test('an uncertain deletion clears private state and does not automatically retry the request', async () => {
  const data = fixture(), server = fakeServer(data);
  const { events, connection } = await setup(data, { fetchImpl: async (url, options) => {
    if (options.method === 'DELETE') { server.requests.push({ method: 'DELETE' }); throw new TypeError('network'); }
    return server.fetchImpl(url, options);
  } });
  await assert.rejects(connection.deleteAccount('sample-password'), { code: 'NETWORK' });
  assert.equal(server.requests.filter(row => row.method === 'DELETE').length, 1);
  assert.ok(events.some(event => event.phase === 'deletion-unconfirmed'));
  assert.ok(events.at(-1).phase !== 'ready'); connection.dispose();
});
test('provider and backend error text cannot leak into visible messages', () => {
  assert.equal(safeMessage({ code: 'unrecognized', message: 'private record or token' }), 'Could not finish this request. Please try again.');
  assert.equal(safeMessage({ code: 'auth/invalid-credential' }), 'The email or password was not recognized.');
});
test('billing and saved-data outages do not block account management or deletion', async () => {
  const data = fixture(), server = fakeServer(data);
  const { events, connection } = await setup(data, { fetchImpl: async (url, options) => {
    if (['/api/billing/status', '/api/sync/pull'].includes(new URL(url).pathname)) return new Response(JSON.stringify({ code: 'TEMPORARY_FAILURE' }), { status: 503 });
    return server.fetchImpl(url, options);
  } });
  assert.equal(events.at(-1).phase, 'ready');
  assert.equal(events.at(-1).data.billing.hasAccess, false);
  assert.equal(events.at(-1).data.recordsUnavailable.status, 503);
  assert.equal(events.at(-1).data.transactions.length, 0);
  await connection.deleteAccount('sample-password');
  assert.ok(server.requests.some(row => row.method === 'DELETE'));
  connection.dispose();
});
test('an HTML gateway error on records keeps account controls and marks records unavailable', async () => {
  const data = fixture(), server = fakeServer(data);
  const fetchImpl = async (url, options) => new URL(url).pathname === '/api/sync/pull'
    ? new Response('<html>Bad gateway</html>', { status: 502 }) : server.fetchImpl(url, options);
  const { events, connection } = await setup(data, { fetchImpl });
  assert.equal(events.at(-1).data.recordsUnavailable.status, 502);
  assert.equal(events.at(-1).data.transactions.length, 0);
  connection.dispose();
});
