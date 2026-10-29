# Frontend deployment

## Shared domain

API origin: `https://kwavepknu.me`. Keep `/api/` routed to the backend; frontend
static files must not replace that route.

Vite embeds environment variables at build time. An existing `.env.local` or
deployment environment containing the old IP overrides the code default and must
be updated **before rebuilding**:

```text
VITE_API_BASE_URL=https://kwavepknu.me
```

The Google client ID is public frontend configuration. Never put a client secret,
JWT signing secret, database password or provider API key in a VITE variable.
For Google login on the public site, the frontend redirect URI, backend redirect
URI and Google Console authorized redirect must agree on the public HTTPS callback
(`https://kwavepknu.me/oauth/google/callback` if this domain hosts the frontend).
A localhost callback is for local testing only. See GOOGLE_AUTH.md.

## Server operator steps

1. Pull the approved frontend `develop` commit in the frontend checkout.
2. Update build environment variables. Check old `.env.local` files as well.
3. Run `yarn install --frozen-lockfile`, `yarn lint`, `yarn test`, `yarn build`.
4. Back up the existing frontend static directory and publish the **contents of
   `dist/`** to its existing Nginx frontend document root, using the team's normal
   atomic deployment procedure. Do not copy `.env*`, source files, backend folders
   or node_modules into the public directory.
5. Preserve `/api/` reverse proxying and SPA fallback for `/oauth/google/callback`.
   Public content links use hash URLs and do not need per-content server routes.
6. Verify the page references the newly generated asset filenames, then smoke test
   video browsing, search, detail/related/OST, music paging/preview, languages and
   navigation. Test real Google login separately.

Do not assume Git push performs deployment: this repository currently has no
automatic server deployment workflow. The assistant has no configured server SSH
identity or frontend document-root path. Server file replacement must be performed
by the operator unless that access is explicitly supplied.

## Known boundaries

Saved collections currently use account-scoped browser storage. Do not advertise
cross-device saved-content sync until the authenticated favorites API is deployed,
integrated and tested. Missing content translations are not frontend translations.
Consult FRONTEND_RELEASE_CHECK.md and PERSONALIZATION.md for verification limits.
