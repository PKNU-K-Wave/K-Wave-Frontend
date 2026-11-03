# Music catalog handoff (2026-11-03)

## Confirmed source and deployment

Backend develop 64a1797207aef3a26590c0c64a72fdfed3173bf8 supports song/artist sort=popularity and song genre filtering. Both response DTOs include lastfmListeners. Song sorting puts null values last, as does artist sorting. Artist metric semantics must follow the actual importer; the current DTO describes a top-five-song average, not unique artist listeners.

The deployed https://kwavepknu.me API still returns HTTP 400 for sort=popularity (artist error lists only debutYear, trackTotal and name). Source merge does not mean deployment or CSV import has completed.

## Frontend implemented

- Runtime probe per collection checks popularity support and the lastfmListeners response field. No build flag is needed.
- When available, home previews and K-POP default to server popularity order. Catalog permits newest order too.
- Songs offer the controller's exact genre codes: Dance, Ballad, Hip-Hop, Rock, R&B, Indie, Other. Filtering is server-side before pagination, never filtering a downloaded page.
- Genre/sort changes reset the page. Request cancellation prevents stale results. There is no frontend popularity sort.
- If popularity is unavailable, catalog shows a notice and keeps current newest-first browsing, with a capability retry button.
- No songs/genres endpoint is required by the current implementation.

## Backend requests still required: artist discovery

The current artist controller accepts only page, size, sort, direction and lang. It does NOT support generation, idol-only filtering or group-first ordering. Do not enable frontend controls against silently ignored parameters.

Proposed additions, to agree with the backend team:
- generation: filter exact stored generation codes; offer actual supported values or return metadata.
- idolOnly=true: include only artists with an actual generation classification. Do not infer idol status solely from isGroup or debut year; solo idols can exist and non-idol groups can exist. Confirm classification completeness with the data team.
- groupsFirst=true: order groups before solo artists across the entire query, then listeners descending with nulls last, then stable artistId. Apply before pagination. Maintain ordinary artists in the unfiltered list, not silently exclude them.
- With generation selected, enforce idolOnly on the backend. Page totals must reflect all filters.
- Apply the same ranking policy to the home artist preview when requested.

Deploy the latest popularity/genre API and verify CSV values are imported. Then implement the remaining artist API conditions. Frontend must not download all artists or reorder a single page to imitate global group priority.

## Review attachment: review only

Valid follow-ups: token cookie/rotation design, production sample fallback policy, favorites cross-device sync, explicit search domain IDs, failure/deep-link/auth-expiry tests. Performance and hidden-page memory concerns require runtime measurements. Broad library replacements are options, not automatically release blockers. These unrelated recommendations were not implemented in this pass.
