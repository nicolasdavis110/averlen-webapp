# Averlen web app

The signed-in web app at https://app.averlen.app and the sample preview at
https://app.averlen.app/preview/. The marketing site and legal pages live in
the separate `averlen-site` repository (averlen.app).

- `index.html` – the live app shell (sign-in, saved records, read-only).
- `app/` – connection, data normalizing, Firebase adapter, config, tests.
  `app/index.html` only forwards old `/app/` links to `/`.
- `preview/` – the shared views (`app.js`), styles, sample data, and the
  planning math ported from the iPhone app.
- `scripts/stamp-version.mjs` – run before every push to `main`; see
  `app/README.md` → Releasing.

Tests: `node --test app/test/*.test.mjs preview/*.test.mjs`
