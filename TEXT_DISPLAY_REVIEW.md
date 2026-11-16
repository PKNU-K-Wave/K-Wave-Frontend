# Content text display review (2026-11-16)

## Correction

Recipe 760 (열무톳김치) contained literal <br> markup in its ingredients. Display-only HTML is now converted to plain text, preserving real line breaks and decoding named/numeric HTML entities. Source newlines next to <br> no longer produce duplicate blank lines. Script/style/embedded-element contents are discarded. Parsing does not use a live DOM, execute HTML, or load embedded URLs.

The same normalization applies at the shared content API boundary to explicit display fields: titles, names, subtitles, descriptions, summaries, cultural background, quotes, cast roles, genres/tags, food ingredients, recipes/steps/tips and image-author/license text. Nested related content/search/recommendation responses use the same path.

URLs, identifiers, filter codes, auth tokens and raw chat citation offsets are NOT rewritten. Assistant answers are normalized only after citation segmentation; user-authored questions remain unchanged. Old browser-saved collections and pending save intents are normalized when read, without changing account ownership or IDs.

## Verification scope

- Live API audit: 62 responses across food lists/categories/details, all 1,156 recipe list entries, selected recipe details including recipe760, video lists/details, song/artist lists/details and searches; English/Chinese/Japanese samples included. Two fields required cleanup; no unresolved HTML markers remained in the selected display-field samples.
- Live browser: exact recipe760 and home/video/K-POP/food/search/login at 320, 390 and 1440px; no raw markup visible in inspected screens. Recipe ingredients retain readable line breaks.
- Controlled browser fixtures: signed-in For You with previously saved encoded titles, assistant HTML-formatted text and preservation of the user's literal HTML question. Synthetic test tokens were intercepted locally, not used to access a real account.
- Regression tests cover tags, line-break variants, double encoding, entities, Unicode, ordinary comparisons, unsafe tags, nested fields, citation metadata and URL preservation.

This is a review of rendering paths plus the stated live samples, not manual inspection of every detail record or a guarantee of all possible source-data quality. No source database content or backend API contract was modified for this correction.
