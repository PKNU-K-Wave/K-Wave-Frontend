# Video frontend verification

Verified on 2026-10-24 against the supplied video-domain plan.

## Evidence and limits

- Backend develop snapshot: `aedb58babaf6dd715215fb1e4a9358f6d347f656`.
- Data main snapshot: `6a1573b6dc4236971da368d656a09cf52084cd3a`.
- Read the complete supplied HTML document, not just its frontend summary.
- Read controller/DTO contracts and the video, genre, related-video and season services.
- Inspected source CSV headers and samples; parsed the Parasite source record with
  PowerShell's CSV parser and compared it with the running API.
- This is NOT a direct SQL audit. The document's whole-DB counts and percentages
  have not been independently reconfirmed and are not treated as established facts.
- No DB mutation, import API call, credential change or backend deployment was performed.

## Frontend handoff items

| Plan item | Frontend change | Remaining dependency |
| --- | --- | --- |
| Video filters | Compact type selector and sorting; expandable release-period, server-provided genre-code and OST filters; filter changes reset/abort the feed | Current genre endpoint returns 500. Genre choices require that endpoint; other new controls require the audited response schema, and years also require a read-only year-range probe to succeed. Old deployments silently ignoring parameters cannot enable the year control. No guessed genre translations |
| Cultural context and seasons | Render actual background text, season/episode counts and season rows; localize generic season numbers | Missing/translatable data must be supplied by backend/data owners |
| Cast character names | Render characterName as returned, preserving server order | Correct cast order needs backend migration/backfill; frontend does not guess lead actors |
| Missing director/streaming | Hide empty facts rather than show permanent Not available cells | No provider/runtime/rating/trailer fields exist in the verified VideoResponse contract |
| Uneven cards | Prefer summary for card text, full description for detail; clamp title/synopsis and reserve video text space | Current server still returns the old full-description list shape |
| Unbounded related titles | Initially render 12; preserve sharedActors evidence; page related/OST results using actual count and page metadata | Current server lacks those counts/endpoints. Old previews expand locally without inventing connection names or total counts |
| Translation fallback | Use resolvedLanguage when present and label translation pending; never infer a resolved language when metadata is absent | Original-language data is not translated by this change |
| English search returns zero | Keep the truthful empty result; no mock aliases or fabricated matches | Foreign-title translations/aliases must be loaded into the actual search dataset |

## Runtime checks

- `GET /api/v1/videos?lang=en&page=0&size=1`: 200, old response fields and Korean title.
- `GET /api/v1/videos/1354?lang=en`: 200, culturalBackground,
  seasonCount=1, totalEpisodes=12, seasons[0].number=1, and characterName present.
- Korean Parasite search resolves backend contentId=419, NOT its source TMDB ID 496243.
  Detail agrees with the sampled CSV: director Bong Joon-ho, actor Song Kang-ho,
  character Kim Ki-taek (the source/API values are Korean). Cultural context is present.
- The Parasite response has no watchProviders field. Do not invent streaming links.
- `GET /api/v1/videos/genres?lang=en`: 500 on the current deployment.
- `/v3/api-docs` currently returns HTML rather than the expected OpenAPI JSON.
- A 1900-1901 year filter still returns a 2026 release and total=1914, confirming
  that the current deployment silently ignores the new year parameters.
- Related/OST page endpoints under `/videos/1354/related` and `/videos/1354/osts`
  both return 500 on the current deployment. The frontend uses the existing preview
  locally instead of treating those endpoints as available.
- English `Parasite` video search returns zero; Korean Squid Game search returns one.
- CSV video-base headers contain season/cast data, but no dedicated foreign-title alias fields.
- Quotes CSV samples contain the exact placeholder `현재준비중`; suppress that exact
  placeholder rather than generically removing real lines containing similar words.

## Not implemented or claimed fixed

- Foreign-title data, curated romance tags, missing directors, series/spinoff links,
  watch providers, actor disambiguation, favorites, food links, actor/director search.
- Composer-vs-idol domain typing is not inferred from names. The frontend uses the
  neutral ARTIST badge; the API still needs an explicit artist-type field.
- Raw DB counts, SQL performance, production OAuth and external LLM quality.
- Backend authentication issues from the previous audit remain separate work.

## Verification commands

- `yarn.cmd test`: API contract/mapping, pagination, season labels and fallback status.
- `yarn.cmd build` and `yarn.cmd lint`.
- Browser contract replay: `artifacts/video-plan-check.mjs` (mock server responses).
- Actual-server browser check: `artifacts/video-plan-live-check.mjs`; search to
  detail, culture/seasons/roles, hidden absent streaming facts, 12 initial related
  titles, visible poster loading, unsupported controls and zero runtime errors passed.
- Existing K-POP browser replay and live-catalog check remain separate tests.

Deployment must use the matching backend commit and populate the relevant fields.
Frontend changes alone cannot make old endpoints or missing translations exist.
