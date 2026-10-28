// Development-only synthetic harness. Never invokes Firebase or a real backend.
import { attachLiveConnection } from '../../preview/app.js';
import { createConnection, safeMessage } from '../connection.js';
import { fakeAuth, fakeServer, fixture } from './fixtures.mjs';

if (!['127.0.0.1', 'localhost'].includes(location.hostname)) throw new Error('Local QA only');
const data = fixture();
if (location.search === '?escape-test') {
  data.payload.changes.categories[0].name = '<em>Groceries</em>';
  data.payload.changes.transactions[0].merchant_name = '<em>Example market</em>';
}
data.payload.changes.transactions.push({ ...data.payload.changes.transactions[0], id: 'test-transfer', merchant_name: 'Example savings transfer', amount: '500.00', is_internal_transfer: true });
const auth = fakeAuth(), server = fakeServer(data);
attachLiveConnection({ enabled: true, appleEnabled: true }, onState => createConnection({
  auth, baseUrl: 'https://backend.example', fetchImpl: server.fetchImpl, deviceId: async () => 'local-qa',
  onState: event => { onState(event); document.querySelector('.preview-banner>span').prepend('LOCAL QA · SYNTHETIC DATA · '); },
}), safeMessage);
