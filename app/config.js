// Firebase browser identifiers are public; never add server credentials here.
// Keep off until HTTPS, exact CORS origins, Firebase authorized domains, and
// provider configuration have been verified. This is a deployment readiness flag.
export const configuration = {
  enabled: true,
  appleEnabled: true,
  backendUrl: 'https://candor-plaid-server-production.up.railway.app',
  allowedOrigins: ['https://app.averlen.app'],
  firebase: {
    apiKey: 'AIzaSyB3Y7v3VJ0IjQPKzhMItKb7dQ2SGyYJcuI',
    projectId: 'candor-85672',
    authDomain: 'auth.averlen.app',
  },
};
