# For You implementation

- K-Video defaults to voteCount descending (Most voted).
- Google callback success opens For You directly; taste editing is optional inside the same page.
- A still-valid access token is retained in sessionStorage for same-tab reloads. Refresh tokens remain in the existing account session storage and are rotated through the backend on expiry/new-tab restoration.
- Temporary refresh server/network failures do not discard a valid in-memory access token. Failed restoration with a retained refresh token offers an explicit retry instead of requiring Google consent again. Invalid/expired tokens still require sign-in.
- Cards and detail dialogs share a heart control. Guests are asked to sign in without losing access to public browsing.
- Server favorites are isolated by the authenticated account and use the shared content ID for add/remove. Detail links retain domain IDs where available. Previously stored server-eligible favorites are migrated after the first successful signed-in read; successful entries are removed from legacy storage. Local-only recipes have no server heart.
- For You separates saved titles from similar picks, with K-Video / K-POP / K-Food tabs, bounded initial saved rendering, counts and empty states.
- Movie, drama, song and artist picks come from the authenticated `/api/v1/recommendations/me` endpoint. The frontend retains server ordering and renders the returned reason; it does not calculate the taste/exploration ratio.
- Food stays on local shared-tag matching against loaded food candidates. Explicit taste settings use the tag-based recommendation API and remain browser-local.

## Backend boundary

The selected language is sent to the tag lookup, tag-based recommendation and personal recommendation endpoints. Tag responses do not overwrite stored selections on language changes. Music recommendations without a domain ID resolve through catalog search and match by shared content ID, never by title alone.

## Verification boundary

Automated browser tests simulate backend-issued JWTs and API responses to verify restoration, saved lists, sorting and genre matching without accessing the user's Google account. This does not certify a real Google consent/code exchange or production server configuration. If Google sign-in still fails, inspect the callback's auth API status and deployed OAuth redirect configuration. No client secret is exposed to the frontend.
