# Averlen connected web candidate

This is the connected client, separate from the offline sample at `/preview/`.
`config.js` defaults to `enabled: false` and `appleEnabled: false`. Neither the
candidate has been published or enabled. The approved production origin settings
were applied and verified separately.

## Verified server source

The live `/ready` endpoint was checked October 25, 2026 and matched
`ff54af8baa426fd19da22f9aafe46649c53ba295`, deployment
`bd8c77e4-2727-4774-b81d-dd899b4d0f7c` after the approved origin change.
The restart reused the existing build/image. The older sibling server checkout is not
the deployed source. The reference copy `.web-server` in the parent workspace is
an isolated checkout of that exact commit and contains no runtime secrets.

## Scope

- Existing Firebase accounts only. Email/password and Apple adapter methods;
  no registration, automatic account linking, or subscription purchase.
- SDK authentication persists across restarts, as the product requires.
  Financial records, account snapshots, plan state, and form passwords are not
  written to browser storage. Only the SDK's authentication state and a random
  device identifier per account are persisted. Do not add service workers or
  cache authenticated responses.
- Profile, billing status, and a full initial sync pull are used. No push, bank
  refresh, direct financial database, or Plaid request. The server's sync GET
  records device cursor metadata and authenticated requests may update activity
  timestamps; "read-only" refers to the financial records.
- Household identity is checked across profile, billing, sync envelope, and
  each row. Soft-deleted/purged records are removed. Transfer/exclusion flags,
  investment setting, and personal Trends exclusions are honored. Activity can
  still show transfers and excluded records while totals exclude them.
- Saved Wealth shows actual saved snapshots and manual accounts, not synthetic
  bank balances or invented history. No complete live planning editor yet.
- Failed record or plan loading does not block account controls after a valid
  profile load. Bad household identities and authentication failures fail closed.
- Sign-out and account changes synchronously clear financial data and abort
  outstanding requests. Generation/identity checks discard late responses.
- Export and deletion require SDK reauthentication and a forced fresh ID token.
  Deletion rechecks household/owner context and uses the existing server deletion
  endpoint before signing out; it never deletes the Firebase identity first.
  The server durably queues provider cleanup. Unknown deletion outcomes clear
  the session and never trigger an automatic second deletion attempt.
- All labels, names, notes and provider errors are escaped or mapped to bounded
  safe text. Password fields clear on submit/close. Confirmation cannot be
  dismissed while its request is in progress.

## Activation requirements

1. A normally validated HTTPS response for averlen.app and www.averlen.app,
   with GitHub HTTPS enforcement enabled. No certificate-warning bypass.
2. Completed with Nick's explicit approval on October 25: added averlen.app and
   www.averlen.app to Firebase authorized domains, preserving the old domains.
   Set `ALLOWED_ORIGINS=https://averlen.app,https://www.averlen.app` and restarted
   the verified production build. Exact-origin preflights pass; unrelated and
   localhost origins receive no browser access. Unauthenticated profile requests
   still return 401. `/ready` confirms the same source and a healthy database.
3. Email/password is already enabled. Apple is enabled for iOS, but Firebase's
   Services ID was empty when inspected October 25. Configure a correctly grouped
   Apple web Services ID and callback before setting appleEnabled. Never reuse
   a StoreKit signing key or change account ownership to make sign-in work.
4. Enable the client only at its explicit HTTPS origins after public API
   preflight verification and source review. Bootstrapping is blocked in frames,
   file URLs, and unapproved origins. Keep sample mode fully separate.
5. Test an existing user's real email sign-in and, after setup, Apple sign-in.
   The owner should enter credentials themselves. Local tests use synthetic
   accounts only. Do not claim live recovery, export, or deletion was tested.

## Verification

`node --test app/test/*.test.mjs preview/*.test.mjs`

## Releasing

GitHub Pages lets browsers cache every file for ten minutes. Before each push
to `main`, run `node scripts/stamp-version.mjs`: it gives every local script and
stylesheet URL a `?v=` hash of the app's code, so browsers fetch a release as a
complete new set of files instead of mixing old and new modules. The
`version.test.mjs` test fails when the stamps are out of date. Pages themselves
can still be cached for up to ten minutes; a reload shows the new release.

The local-only `app/test/qa.js` harness injects a fake Firebase adapter and
synthetic server responses and refuses to run outside loopback hosts. It does
not call Firebase or the production backend. Do not present its screenshots as
proof of a real customer login or deletion.

October 25 result: 27 tests passed. Local browser checks covered synthetic sign-in,
Home/Activity/Wealth, category drilldown, server-first deletion, cleared sessions,
HTML-like record labels rendered as text, and phone layouts at 390px without
horizontal overflow. Disabled production configuration rejects credential entry.
No real customer sign-in, export, or deletion was performed. GitHub's certificate
remains `authorization_created`, and normal HTTPS fails hostname verification.
Evidence is under the parent workspace's
`review-evidence/2026-10-25/web-foundation/`.

The offline sample still builds with `python3 scripts/build-preview.py`.
