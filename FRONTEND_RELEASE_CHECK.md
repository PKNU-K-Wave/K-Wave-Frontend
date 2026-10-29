# Frontend UX readiness check - 2026-10-29

## Implemented

- Hash URLs for pages, Unicode searches and content detail links. Browser back/forward opens and closes detail states. Hash routing avoids a production SPA path-rewrite dependency for shared content links; the existing OAuth callback path still needs its own deployment routing.
- Visited public category screens remain mounted. Video filters and a bounded 15-minute video snapshot survive reloads; music tab/page and search filters/page persist in session storage. Per-view scroll restoration waits briefly for content and cancels on user input.
- Guest save intent and return location are stored for up to 30 minutes. A successful app login adds the item once to the existing browser-local collection and returns to the original route. Leaving login through ordinary navigation cancels the pending intent. This is not server-side favorite synchronization.
- Central UI translation dictionary/context for English, Chinese and Japanese, persistent language and document language. Content translations still depend on backend data; missing translations are not fabricated.
- Detail dialogs render outside the app root, make the background inert, trap keyboard focus, close on Escape and restore focus. Detail URLs can be copied, with a visible URL fallback when clipboard access is denied.
- The chat launcher lives in the header rather than covering mobile cards. Existing contextual chat behavior remains.
- Home uses most-voted videos and fewer repeated featured/list items. Carousel has explicit pause/resume, larger dot hit areas and reduced-motion support.
- Compact search rows, clear input, per-session recent searches with individual/all removal, preserved query navigation, explicit offline results and retry. A successful empty result remains distinct from an unavailable search service.
- Missing/failed imagery uses a neutral placeholder, not unrelated stock photos. Shared skeletons stabilize first-page loading; sample recipes and unavailable-live sample content are identified.
- Current navigation/language controls expose selection state and global keyboard focus styles are visible.

## Verification

- Unit tests cover existing catalog/auth contracts plus route round trips, deep-link IDs and malformed/disabled browser storage.
- `artifacts/release-ux-check.mjs` uses controlled API fixtures for hash navigation, direct detail opening in a new tab, back/forward, Escape/focus containment, filters/pages/scroll restoration, language persistence, recent searches, Google-callback save continuation, empty artist lists, offline search and retry, header chat, 320px mobile and 1440px desktop overflow checks.
- `artifacts/for-you-check.mjs` covers account isolation, same-tab session restoration, transient refresh retry and invalid refresh rejection with mocked tokens. These are frontend contract tests, not real Google consent tests.
- Actual shared-server browsing was checked separately: most-voted first video was Parasite (contentId 419), detail routing/Escape worked, and no horizontal overflow was seen at 320, 390 or 1440px. Visible real TMDB/album images were checked after load and had nonzero natural dimensions. No page runtime errors were observed in that pass.

## Not certified by this frontend change

- Real Google OAuth exchange/deployed server configuration. A previously reproduced 500 requires server-side diagnosis.
- Deployment and successful authenticated use of the new favorites API. Current collection persistence remains per account in this browser.
- Full-catalog personalized ranking, cross-device preferences, food backend data, missing content translations, and full artist/member photo coverage.
- Completing this UX pass is not a claim that backend authentication/security or production operations have been audited and approved.

No private credentials or real user tokens are included in this document or the controlled test fixtures.
