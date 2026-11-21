# K-Trend home preview

Reviewed backend PRs #93 (issue #92), #95 (issue #94), #97 (issue #96), including public DTOs, classification, scheduling, candidate approval and source-link handling.

- Public read APIs only: GET /api/v1/trends?lang=en|zh|ja, GET /api/v1/trends/items/{id}?lang=...
- Two visible tabs: Hot now (ACTIVE with RISING or STEADY) and Past trends (PAST, regardless of badge). ACTIVE/FADING and unmeasured items are not relabelled as hot or past.
- Preserve approved-item order. Show a 216px, three-row viewport with a hidden scrollbar and keyboard-focusable scrolling. No load-more button, rank numbers, Source label or Updated date is displayed.
- Fetch reference details for the active tab, with three workers and successful results cached. Missing/failed/unsafe source links use Naver news search, identified in the accessible link label, never a fabricated article.
- Every external link uses target=_blank with rel=noopener noreferrer. No external HTML is embedded. No admin/candidate API is called.
- Actual article headlines are not exposed by the public DTO. The preview shows approved names and descriptions, not made-up news titles. To display exact article headlines, expose approved evidence title/source/URL in the public API.
- Candidate collection is daily at 08:00 KST and search-state refresh is weekly Monday 07:00 KST. This is not a real-time news feed. Keep the weekly-data notice; the requested UI omits the update date.
- Mark machine-translated/unreviewed content and Korean fallbacks. External sources may be Korean. Do not use Wikimedia thumbnails here, avoiding unattributed CC BY/SA reuse.
- Hot now also includes Apple Music Korea and Netflix Korea chart entries, interleaved by the server-provided rank after approved items. Rank is used for ordering only. Newspaper, Music2 and Clapperboard icons distinguish rows. Subtitle source names remain visible.
- Chart URLs are validated HTTP(S). Netflix entries without individual URLs link to the official Korean TV Top 10 page, not a fabricated title link. Current chart entries are never inserted into Past trends.

Last live data check (November 18, 2026): production returned 200 in EN/ZH/JA, with three hot items, three past items and ten entries in each chart. Mobile/desktop grouping, hidden-scrollbar scrolling and real article new-tab opening were checked. Counts are a snapshot, not fixed UI assumptions. Empty/error states still offer refresh/retry without mock stories.

Separate backend security concern: PR #97 says the admin page and mutation APIs have no authentication. A secret URL/noindex does not authorize requests; restrict those endpoints before public production use. This frontend change does not alter backend access control.
