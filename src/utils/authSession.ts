export type AuthUser = { userId: number; username: string };
export type SessionTokens = { accessToken: string; refreshToken: string };
export type AuthSession = SessionTokens & { user: AuthUser; expiresAt: number };
export type PendingGoogleLogin = { state: string; createdAt: number; redirectUri: string };
export const GOOGLE_LOGIN_STORAGE_KEY = 'kwave-google-login';
export const AUTH_STORAGE_KEY = 'kwave-auth-session';

export function localSignInEntry(redirectUri: string, origin: string): string | null {
  const redirect = new URL(redirectUri);
  const current = new URL(origin);
  const loopback = (host: string) => ['localhost', '127.0.0.1', '[::1]'].includes(host);
  if (redirect.origin === current.origin) return null;
  if (!loopback(redirect.hostname) || !loopback(current.hostname) || redirect.port !== current.port || redirect.protocol !== current.protocol) throw new Error('Google sign-in is unavailable at this address. Please use the configured sign-in site.');
  return `${redirect.origin}/?google-sign-in=1`;
}

// These claims are used for UI identity only; protected API authorization remains on the server.
export function sessionFromTokens(tokens: SessionTokens, now = Date.now()): AuthSession {
  if (typeof tokens?.accessToken !== 'string' || typeof tokens?.refreshToken !== 'string' || !tokens.refreshToken) throw new Error('Invalid sign-in response.');
  const parts = tokens.accessToken.split('.');
  if (parts.length !== 3 || !parts[2]) throw new Error('Invalid sign-in response.');
  const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')), character => character.charCodeAt(0));
  const claims = JSON.parse(new TextDecoder().decode(bytes));
  if (!Number.isSafeInteger(claims.userId) || claims.userId <= 0 || typeof claims.sub !== 'string' || !claims.sub || !Number.isFinite(claims.exp) || claims.exp * 1000 <= now) throw new Error('Invalid or expired sign-in response.');
  return { ...tokens, user: { userId: claims.userId, username: claims.sub }, expiresAt: claims.exp * 1000 };
}

export function googleAuthorizationUrl(clientId: string, redirectUri: string, state: string, origin: string): string {
  if (!clientId.trim()) throw new Error('Google sign-in is not configured yet. Please try again later.');
  const redirect = new URL(redirectUri);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(redirect.hostname);
  if (redirect.origin !== origin || redirect.search || redirect.hash || (redirect.protocol !== 'https:' && !(redirect.protocol === 'http:' && local))) throw new Error('Google sign-in is unavailable at this address. Please use the configured sign-in site.');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: clientId.trim(), redirect_uri: redirect.href, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' }).toString();
  return url.href;
}

export function googleCallbackCode(url: string, pending: PendingGoogleLogin | null, now = Date.now()): string {
  const callback = new URL(url);
  const expected = pending ? new URL(pending.redirectUri) : null;
  if (!pending || !expected || typeof pending.state !== 'string' || pending.state.length < 32 || callback.origin !== expected.origin || callback.pathname !== expected.pathname || !Number.isFinite(pending.createdAt) || now - pending.createdAt > 10 * 60_000 || now < pending.createdAt || callback.searchParams.get('state') !== pending.state) throw new Error('Sign-in could not be verified. Please start again.');
  if (callback.searchParams.has('error')) throw new Error('Google sign-in was cancelled or denied. You can try again or continue exploring.');
  const code = callback.searchParams.get('code');
  if (!code || code.length > 4096) throw new Error('Google did not return a valid sign-in code.');
  return code;
}
