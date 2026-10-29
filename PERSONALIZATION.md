# For You implementation

- K-Video defaults to voteCount descending (Most voted).
- Google callback success opens For You directly; taste editing is optional inside the same page.
- A still-valid access token is retained in sessionStorage for same-tab reloads. Refresh tokens remain in the existing account session storage and are rotated through the backend on expiry/new-tab restoration.
- Temporary refresh server/network failures do not discard a valid in-memory access token. Failed restoration with a retained refresh token offers an explicit retry instead of requiring Google consent again. Invalid/expired tokens still require sign-in.
- Cards and detail dialogs share a heart control. Guests are asked to sign in without losing access to public browsing.
- Saved snapshots are isolated by backend JWT userId. Storage errors are shown, not silently reported as successful. Large related-content lists are omitted from snapshots and fetched on opening details.
- For You separates saved titles from similar picks, with K-Video / K-POP / K-Food tabs, bounded initial saved rendering, counts and empty states.
- Genre scoring counts matching genres across saved titles, ranks candidates by that frequency, excludes saved IDs and never mixes category groups. Recognized Korean video genre labels normalize to English. Category/Group/Solo labels are not treated as genres; missing genre data produces an honest empty state.
- Video candidates use the existing backend recommendation endpoint, limit 20, and loaded catalog titles. Music candidates use at most three song pages (72 tracks on the current paginated contract), plus loaded music/artists. Food currently uses sample recipes and shared food tags. This is a bounded discovery pool, not a full-catalog or machine-learning recommender.

## Backend boundary

Backend develop aedb58babaf6dd715215fb1e4a9358f6d347f656 was inspected. It provides OAuth token issuance and reissue, but no saved-content/preferences persistence endpoint. Saves here are **per account on this browser**, not cross-device DB synchronization. A production saved-content API needs authenticated user identity, a unique user/content relation, listing by category with paging, add/remove operations, and appropriate authorization.

The existing backend music recommendation response does not include music genres in its candidate tags; the frontend therefore uses actual song genre metadata from catalog pages instead of treating Group/Solo as genre recommendations. Old deployments or missing source genres can still limit results.

## Verification boundary

Automated browser tests simulate backend-issued JWTs and API responses to verify restoration, saved lists, sorting and genre matching without accessing the user's Google account. This does not certify a real Google consent/code exchange or production server configuration. If Google sign-in still fails, inspect the callback's auth API status and deployed OAuth redirect configuration. No client secret is exposed to the frontend.
