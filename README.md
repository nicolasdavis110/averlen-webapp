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

## Shared design system

`preview/styles.css` owns the app frame, components, light/dark tokens, and
responsive layouts. Keep breakpoint rules together at the bottom rather than
adding another override layer. Both HTML shells must retain the same header
controls and IDs; the shared views are rendered by `preview/app.js`.

Before releasing visual changes, inspect Home, Activity, Trends, Wealth,
Settings, and sign-in at phone and desktop widths in both themes. Use sample
data or the loopback-only QA harness, then update version stamps and run tests.
