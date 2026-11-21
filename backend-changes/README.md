# K-POP generation and OST filters

Backend source baseline: PKNU-K-Wave/K-Wave-Backend develop `64f1f256375687bb1c9dfcbc9d0dcc4f77a58c6a`. Existing mood filtering is preserved.

The authoritative backend change is PR https://github.com/PKNU-K-Wave/K-Wave-Backend/pull/87. It was merged on November 16, 2026, with subsequent conflict-resolution updates. This patch and the baseline above are historical fallback references, not a new pending backend task. Do not reapply them to current develop or merge the same work again. A GitHub merge alone does not establish production deployment.

Only when deliberately reconstructing the historical baseline in a separate checkout, after preserving existing changes:

```sh
git apply --check /path/to/kpop-filters.patch
git apply /path/to/kpop-filters.patch
cd K-wave
./gradlew test
```

Do not force-apply if the current backend has overlapping edits; reconcile with the latest source first.

## API contract

- `GET /api/v1/artists?generation=4세대&page=0&size=24&sort=popularity&direction=desc&lang=en`
- `GET /api/v1/artists/filters`: `data: {generation:true,generations:[...actual distinct DB values...]}`
- `GET /api/v1/songs?ostOnly=true&genre=Ballad&page=0&size=24&sort=popularity&direction=desc&lang=en`
- `GET /api/v1/songs/filters`: `data: {ostOnly:true}`

Existing success envelopes and Page metadata remain unchanged. Omitted generation means all artists; omitted/false ostOnly means all songs. Nonempty generation must be a stored-code-shaped value (e.g. 4세대); no matching rows returns an empty page. Generation classification, not group membership or debut year, determines inclusion; classified solo idols are retained. Unsupported/missing generation data is not guessed.

OST uses the existing video-to-song OST_OF relation (targetContentId equals song contentId), matching VideoOstRepository and the CSV importer. EXISTS prevents duplicates when several videos reference the same song. Genre, popularity and paging compose in the database. No CSV changes, schema migration, new production dependency or whole-catalog frontend download is required. H2 was added only as a test dependency.

## Frontend activation

The frontend discovers these capabilities via the two filters endpoints. Old deployed APIs return 404/unsupported responses, so the new controls stay hidden instead of silently ignoring conditions. Deploy the backend first, then deploy the frontend. No environment flag is needed. Refresh the page after backend deployment. Each filter resets its catalog to page one and persists independently in browser session storage.

## Verification

Focused backend controller/repository/regression tests passed again after rebasing (19 tests), including existing mood-filter regressions and genre+mood+OST composition. An earlier broader run on the preceding version passed 253 of 255 tests (contextLoads excluded), with two ApiDocsTest context failures on MySQL-specific Flyway syntax under H2; contextLoads also failed for that environment reason. The full suite has not been reported as passing. An explicit Mockito javaagent was used in this restricted Windows environment to avoid dynamic attach restrictions.

Frontend build/lint and unit tests passed; browser fixtures verify mobile/desktop controls and filter requests. This is not a production DB or deployment verification.
