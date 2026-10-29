# Deferred frontend review

Recorded at the user's request on 2026-10-25. These are follow-up ideas, not authorization to implement all items now.

Update 2026-10-29: the user authorized the first frontend UX pass. Navigation,
restoration, save continuation, shared UI localization, detail accessibility,
chat placement, home ordering, compact search/recent searches, image placeholders
and loading/error states were implemented and tested. See FRONTEND_RELEASE_CHECK.md
for the verified scope and remaining backend/data limitations. Recently viewed,
recipe tools, server favorites sync and full-catalog personalization remain future work.

## Priority

1. Reconcile local frontend work with remote develop before publishing.
2. URL-based navigation, detail deep links, browser back/forward, reload restoration.
3. Restore category filters, paging and scroll position across navigation.
4. Remember a guest's save intent and return location through Google sign-in.
5. Complete UI localization and persist language; missing translated content requires backend/data work.
6. Detail dialog Escape handling, focus trapping/restoration, accessible naming.
7. Prevent the floating chat launcher from obscuring mobile cards/save controls.
8. Explicit home curation, consistent video ordering and fewer duplicated featured cards.
9. Compact search results, clear search, recent searches.
10. Neutral missing-image placeholders and failed-image handling.
11. Consistent loading, retry, live/sample/offline states.
12. Recently viewed, sharing, saved-list search/sort/undo, recipe ingredient/step checks and timers.
13. Artist-diverse music discovery without inventing popularity/chart claims.

## Backend/data dependencies

- Authenticated per-account saved-content persistence and ownership enforcement.
- Server-side personal recommendation profile, recency weighting, diversity and pagination.
- Access/refresh token purpose separation and production authentication/security review.
- Translation coverage, source metadata completeness and deployment verification.
- Real Google consent and token exchange still require end-to-end verification; mocked frontend auth tests are not proof of it.

## Challenge feature under discussion

- Prefer a Challenges subtab inside K-POP, not another bottom-navigation item.
- Curated official source URLs first; do not assume unrestricted Instagram feed scraping or automatic ingestion.
- Use official platform embeds where allowed, with a new-tab source fallback.
- A unified autoplay/swipe player cannot be promised across Instagram and YouTube embeds.
- Link clips to existing song/artist IDs; record source, publisher, date, availability and permitted cover metadata.
- No challenge implementation requested yet.
