# Google sign-in integration

## Local setup

Use `http://localhost:5173/` and `yarn.cmd dev --port 5173 --strictPort`.
The supplied backend configuration uses this exact callback:

`http://localhost:5173/oauth/google/callback`

Put the public client ID in `.env.local` as `VITE_GOOGLE_CLIENT_ID` and the
callback as `VITE_GOOGLE_REDIRECT_URI`. Restart Vite after changing these values.
Only the public client ID belongs in the frontend. Never add a Google client
secret, mail password, database password or JWT signing secret to a Vite variable.

The same callback must be registered in Google Cloud's authorized redirect URIs
and configured as `oauth.google.redirect-uri` on the running backend. The backend
uses its own client ID and secret to exchange the authorization code; changing
the frontend configuration does not update the deployed backend.

Opening the local site using 127.0.0.1 is supported: clicking Google sign-in first
moves to localhost, then creates the authorization state there. Browser storage
is origin-specific, so preferences previously saved under 127.0.0.1 are separate.

## Flow and API contracts

1. Google sign-in requests only `openid email profile`, with random state.
2. The callback validates state and its ten-minute lifetime, removes the code
   from the address bar, then sends `{code}` to `POST /api/v1/auth/oauth/google`.
3. The response is `{success:true,data:{accessToken,refreshToken}}`. The access
   token stays in memory. Refresh token and user ID are persisted locally.
4. Reloads use `POST /api/v1/auth/reissue` with `{refreshToken}`. An expired access
   token is refreshed before expiry, or once after an API 401 response.
5. Sign-out clears local authentication and calls `POST /api/v1/auth/logout`.

The JWT user ID determines the local preference key. New accounts choose their
interests before For You. Returning accounts restore their saved choices. These
preferences are local to this browser, not synced across devices. Favorites and
server-side preference persistence are not implemented by this change.

## Deployment checks

- Use HTTPS for the production frontend and API. The current HTTP API address
  is a development setup, not a secure production authentication transport.
- Set production callback settings separately; do not deploy localhost callbacks.
- Configure SPA fallback for `/oauth/google/callback` (for example Nginx
  `try_files $uri $uri/ /index.html`).
- Allow the frontend's exact origin in backend CORS.
- `.env.local` is ignored by Git. Build-time Vite variables require a rebuild.
- Rotate credentials shared outside the server's secret storage.

## Verification

Run `yarn.cmd build`, `yarn.cmd lint`, and `yarn.cmd test`.
`artifacts/auth-flow-check.mjs` exercises the UI with mocked auth responses and
synthetic tokens, not a real Google account. Real login still requires the user
to choose a Google account and consent, plus matching deployed backend settings.
