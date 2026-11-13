import { configuration } from './config.js?v=3b1d95276f';
import { createFirebaseAdapter } from './firebase.js?v=3b1d95276f';
import { createConnection, safeMessage } from './connection.js?v=3b1d95276f';
import { attachLiveConnection } from '../preview/app.js?v=3b1d95276f';
import { createIdleGuard } from './idle.js?v=3b1d95276f';

async function deviceId(uid) {
  const key = `averlen.web.device.${uid}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing && /^[\da-f-]{36}$/i.test(existing)) return existing;
    const value = crypto.randomUUID(); localStorage.setItem(key, value); return value;
  } catch { return crypto.randomUUID(); }
}
// No live credentials in embedded frames, file previews, development origins,
// or unverified domains. The separate sample preview is always network-isolated.
if (!configuration.enabled || window.top !== window.self || !configuration.allowedOrigins.includes(location.origin)) {
  attachLiveConnection({ ...configuration, enabled: false }, null, safeMessage);
} else {
  try {
    const auth = await createFirebaseAdapter(configuration.firebase);
    let storage = null; try { storage = localStorage; } catch { /* blocked */ }
    const idle = createIdleGuard({ storage, onExpire: () => { void auth.signOut().catch(() => {}); } });
    // A tab reopened after the limit starts signed out, before any data loads.
    if (idle.expired()) await auth.signOut().catch(() => {});
    idle.touch(true);
    for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
      addEventListener(type, () => idle.touch(), { passive: true, capture: true });
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !idle.check()) idle.touch(); });
    setInterval(() => idle.check(), 60 * 1000);
    attachLiveConnection(configuration, onState => createConnection({
      auth, baseUrl: configuration.backendUrl, deviceId, onState,
    }), safeMessage);
  } catch {
    attachLiveConnection({ ...configuration, enabled: false }, null, safeMessage);
  }
}
