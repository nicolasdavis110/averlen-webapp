# Averlen web foundation

`preview/index.html` is the source page and is what GitHub Pages serves at
`/preview/` (no build step). For a single file that opens directly from disk, run
`python3 scripts/build-preview.py`; it writes the parent workspace's
`AVERLEN_WEB_PREVIEW.html`. For browser QA, serve the website folder over
loopback HTTP and open `/preview/`.

The palette, four main tabs, category names, synthetic transactions, and account
balances come from the iPhone app. Sample changes live in memory only. The CSP
blocks outgoing API connections; this preview cannot sign in or access live data.

Implemented: sign-in design and sample-session entry; responsive navigation;
monthly spending, income and net; cumulative spending chart; category drilldowns;
transaction search, filters and sample categorization; same-day category change
comparisons and monthly reports; net worth history with 1M/3M/6M controls; manual
asset/liability add/edit/remove; a uniform ownership display share; retirement
and debt payoff illustrations; saved-data export; account management and a
sample-only deletion walkthrough; light/dark appearance and accessible dialogs.

The login fields and live sign-in controls are disabled. Entry uses the explicit
sample-account action, not a fake authentication success. Deletion simulates a
fresh-identity step and final confirmation and then clears the sample session.
The pure deletion policy blocks shared owners pending ownership transfer, but is
not a replacement for the server's authorization and deletion safeguards.

Planning is an initial subset of the app: fixed solo retirement contributions
and return, and a single fixed-rate debt with extra/lump-sum scenarios. No live
benefit, tax, healthcare, or household retirement modeling is provided. The
ownership view applies one percentage to all accounts. Real app parity remains
future work. All new scenario inputs remain in memory only.

Next: use existing Firebase identity, the server-authoritative billing status,
and household-scoped sync read API. Check the deployed server source before
integration; the sibling server checkout may lag production. Keep real records
out of static assets and logs. Initially use a read-only integration. The sync
pull endpoint updates device cursor metadata even though it uses GET. Browser
origins, Firebase authorized domains, Apple web sign-in, fresh-auth actions,
cache clearing on sign-out, concurrent household/account switching, subscription
states, and deleted/purged transaction handling need explicit implementation and
verification before enabling live access. Never derive access from client state.

Public hosting is unchanged by this local preview revision.
