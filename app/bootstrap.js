import { configuration } from './config.js?v=f6e114719d';
import { createFirebaseAdapter } from './firebase.js?v=f6e114719d';
import { createConnection, safeMessage } from './connection.js?v=f6e114719d';
import { attachLiveConnection } from '../preview/app.js?v=f6e114719d';

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
    attachLiveConnection(configuration, onState => createConnection({
      auth, baseUrl: configuration.backendUrl, deviceId, onState,
    }), safeMessage);
  } catch {
    attachLiveConnection({ ...configuration, enabled: false }, null, safeMessage);
  }
}
