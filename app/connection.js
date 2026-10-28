import { normalizeSnapshot, normalizeBankAccounts } from './data.js?v=db98a177cd';

export class ConnectionError extends Error {
  constructor(code, status = 0) { super(code); this.code = code; this.status = status; }
}
export function safeMessage(error) {
  const messages = {
    'auth/invalid-credential': 'The email or password was not recognized.',
    'auth/wrong-password': 'The email or password was not recognized.',
    'auth/user-not-found': 'The email or password was not recognized.',
    'auth/too-many-requests': 'Too many attempts. Please wait a little and try again.',
    'auth/network-request-failed': 'Could not reach sign-in. Check your connection and try again.',
    'auth/popup-closed-by-user': 'Sign-in was closed. You can try again.',
    'auth/popup-blocked': 'Allow the sign-in window and try again.',
    'auth/unauthorized-domain': 'Web sign-in is still being configured for this address.',
    'auth/operation-not-allowed': 'This sign-in method is not ready on the website yet.',
    'auth/account-exists-with-different-credential': 'Use the sign-in method originally used for your Averlen account.',
    NETWORK: 'Could not reach Averlen. Check your connection and try again.',
    NOT_REGISTERED: 'No existing Averlen account was found. Use the iPhone app to finish setup, then try signing in again.',
    EMAIL_NOT_VERIFIED: 'Verify your email using the link from Averlen, then try again.',
    HOUSEHOLD_CHANGED: 'Your household changed. Reload your account before continuing.',
    SESSION_CHANGED: 'Your sign-in changed. Please try again with the current account.',
    TRANSFER_OWNERSHIP_FIRST: 'Transfer household ownership to your partner in the iPhone app before deleting your account.',
    ACCOUNT_DELETION_FINALIZING: 'Your previous account deletion is still finishing. Try again shortly.',
    REAUTH_REQUIRED: 'Please confirm your identity again before continuing.',
    WEB_NOT_READY: 'Web sign-in is being prepared. You can explore the sample preview for now.',
  };
  return messages[error?.code] || (error?.status === 401 ? 'Your sign-in expired. Please sign in again.' : 'Could not finish this request. Please try again.');
}

// auth is an injected Firebase adapter. This separation keeps credentials,
// account races, and destructive request ordering independently testable.
export function createConnection({ auth, baseUrl, fetchImpl = fetch, deviceId, onState, timeoutMs = 20000 }) {
  if (!/^https:\/\/[^/]+\/?$/.test(baseUrl)) throw new ConnectionError('INVALID_BACKEND');
  let generation = 0, controller = new AbortController(), current = null, snapshot = null, busy = false;
  function clear(phase = 'signed-out') {
    generation++; controller.abort(); controller = new AbortController(); current = null; snapshot = null;
    onState({ phase });
  }
  function capture() {
    const user = auth.currentUser();
    if (!user || !current || user.uid !== current.uid) throw new ConnectionError('SESSION_CHANGED');
    return { user, generation, signal: controller.signal };
  }
  function assertCurrent(context) {
    if (context.signal.aborted || context.generation !== generation || auth.currentUser()?.uid !== context.user.uid || current?.uid !== context.user.uid) throw new ConnectionError('SESSION_CHANGED');
  }
  async function request(path, { method = 'GET', context = capture(), fresh = false, body: payload } = {}) {
    assertCurrent(context);
    const token = await auth.token(context.user, fresh); assertCurrent(context);
    let response;
    const deadline = new AbortController(), timer = setTimeout(() => deadline.abort(), timeoutMs);
    const abort = () => deadline.abort(); context.signal.addEventListener('abort', abort, { once: true });
    try {
      response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method, headers: { Authorization: `Bearer ${token}`, 'X-App-Version': 'web-0.1', 'X-Device-Platform': 'web', ...(payload ? { 'Content-Type': 'application/json' } : {}) },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
        credentials: 'omit', cache: 'no-store', redirect: 'error', signal: deadline.signal,
      });
      assertCurrent(context);
      // Proxies and rate limits can answer with HTML; keep the status meaningful.
      const body = await response.json().catch(() => { if (response.ok) throw new ConnectionError('INVALID_RESPONSE', response.status); return {}; });
      assertCurrent(context);
      if (!response.ok) {
        const code = typeof body.code === 'string' ? body.code : response.status === 404 ? 'NOT_REGISTERED' : 'REQUEST_FAILED';
        throw new ConnectionError(code, response.status);
      }
      return body;
    } catch (error) {
      assertCurrent(context);
      if (error instanceof ConnectionError) throw error;
      throw new ConnectionError('NETWORK');
    } finally { clearTimeout(timer); context.signal.removeEventListener('abort', abort); }
  }
  async function load(user) {
    if (user?.uid !== auth.currentUser()?.uid) return;
    clear(user ? 'loading' : 'signed-out');
    if (!user) return;
    current = user;
    const context = capture();
    try {
      const profile = await request('/api/auth/me', { context });
      let billing, payload, recordError = null;
      const canKeepAccount = error => error.code === 'NETWORK' || error.status >= 500;
      const emptyPayload = () => ({ household_id: profile.household?.id, changes: { transactions: [], categories: [], manual_accounts: [], net_worth_snapshots: [], user_preferences: [], transaction_purges: [] } });
      try { billing = await request('/api/billing/status', { context }); }
      catch (error) {
        if (!canKeepAccount(error)) throw error;
        billing = { household_id: profile.household?.id, has_access: false, status: 'unavailable' };
      }
      try { payload = await request(`/api/sync/pull?device_id=${encodeURIComponent(await deviceId(user.uid))}`, { context }); }
      catch (error) { if (!canKeepAccount(error)) throw error; payload = emptyPayload(); recordError = { code: error.code, status: error.status }; }
      assertCurrent(context);
      let normalized;
      try { normalized = normalizeSnapshot(profile, billing, payload); }
      catch (error) {
        if (error.code === 'HOUSEHOLD_CHANGED') throw error;
        normalized = normalizeSnapshot(profile, billing, emptyPayload()); recordError = { code: error.code };
      }
      normalized.recordsUnavailable = recordError;
      // Bank balances are read-only and optional: saved records still show if
      // a bank or the plan check fails. The app caps households at 10 banks.
      if (normalized.billing.hasAccess) {
        try {
          const listed = await request('/list_connected_accounts', { method: 'POST', context, body: {} });
          if (!Array.isArray(listed.items)) throw new ConnectionError('INVALID_BALANCES');
          const items = [];
          for (const item of listed.items.slice(0, 10)) items.push({ item, response: await request('/get_balances', { method: 'POST', context, body: { item_id: item.item_id } }) });
          normalized.bankAccounts = normalizeBankAccounts(items);
        } catch (error) {
          if (error.code === 'SESSION_CHANGED') throw error;
          normalized.bankAccounts = []; normalized.banksUnavailable = { code: error.code || 'REQUEST_FAILED' };
        }
      }
      snapshot = normalized; onState({ phase: 'ready', data: normalized });
    } catch (error) {
      if (context.generation !== generation || context.signal.aborted) return;
      snapshot = null; onState({ phase: 'error', error: { code: error.code || 'REQUEST_FAILED', status: error.status || 0 } });
    }
  }
  const unsubscribe = auth.subscribe(user => { void load(user); });
  async function reauthenticate(password = '') {
    const context = capture();
    await auth.reauthenticate(context.user, password); assertCurrent(context);
    // Force a new token containing the fresh auth_time, not a cached ID token.
    await auth.token(context.user, true); assertCurrent(context);
    return context;
  }
  return {
    async signIn(email, password) { await auth.signIn(email, password); },
    async signInApple() { await auth.signInApple(); },
    async resetPassword(email) { await auth.resetPassword(email); },
    async refresh() { return load(auth.currentUser()); },
    async signOut() { clear(); await auth.signOut(); },
    provider() { return auth.provider(auth.currentUser()); },
    async exportData(password = '') {
      const context = await reauthenticate(password);
      return request('/api/auth/export', { context, fresh: true });
    },
    async deleteAccount(password = '') {
      if (busy) throw new ConnectionError('REQUEST_BUSY');
      if (!snapshot) throw new ConnectionError('SESSION_CHANGED');
      const expectedUser = snapshot.profile.user.id, expectedHousehold = snapshot.householdId;
      busy = true;
      try {
        if (snapshot.profile.household.is_owner && snapshot.profile.members.length > 1) throw new ConnectionError('TRANSFER_OWNERSHIP_FIRST');
        const context = await reauthenticate(password);
        const latest = await request('/api/auth/me', { context, fresh: true });
        if (latest.user?.id !== expectedUser || latest.household?.id !== expectedHousehold) throw new ConnectionError('HOUSEHOLD_CHANGED');
        if (latest.household.is_owner && latest.members.length > 1) throw new ConnectionError('TRANSFER_OWNERSHIP_FIRST');
        // The server erases data and durably queues Plaid/Firebase cleanup.
        // Never delete the Firebase identity first; that would orphan records.
        let result;
        try { result = await request('/api/auth/account', { method: 'DELETE', context, fresh: true }); }
        catch (error) {
          if (error.code === 'NETWORK' || error.status >= 500) {
            assertCurrent(context); clear('deletion-unconfirmed');
            try { await auth.signOut(); } catch { /* no automatic deletion retry */ }
          }
          throw error;
        }
        assertCurrent(context);
        clear('deleted');
        // Server deletion is already committed. A local sign-out failure must
        // not report that deletion failed or invite a second deletion attempt.
        try { await auth.signOut(); } catch { /* cleared locally; server owns cleanup */ }
        return result;
      } finally { busy = false; }
    },
    dispose() { unsubscribe(); clear(); },
  };
}
