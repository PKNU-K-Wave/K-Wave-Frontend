import { ApiError, apiBaseUrl } from './backend';
import { AUTH_STORAGE_KEY, GOOGLE_LOGIN_STORAGE_KEY, googleAuthorizationUrl, googleCallbackCode, localSignInEntry, sessionFromTokens, type AuthSession, type PendingGoogleLogin, type SessionTokens } from '../utils/authSession';

type AuthSnapshot = { status: 'loading' | 'guest' | 'signed-in'; session: AuthSession | null; error: string | null; completedGoogleLogin: boolean };
let snapshot: AuthSnapshot = { status: 'loading', session: null, error: null, completedGoogleLogin: false };
const listeners = new Set<() => void>();
let bootstrap: Promise<void> | null = null;
let refreshing: Promise<string> | null = null;
let refreshTimer: number | undefined;
let generation = 0;
const TAB_SESSION_KEY = 'kwave-tab-session';
export const configuredRedirectUri = (import.meta.env.VITE_GOOGLE_REDIRECT_URI as string | undefined)?.trim() || `${window.location.origin}/oauth/google/callback`;
const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '';
function callbackPath() {
  try { return new URL(configuredRedirectUri).pathname; } catch { return '/oauth/google/callback'; }
}
export const isGoogleCallback = window.location.pathname === callbackPath();
export const isGoogleSignInEntry = new URLSearchParams(window.location.search).get('google-sign-in') === '1';

export function getAuthSnapshot() { return snapshot; }
export function subscribeAuth(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

function update(next: AuthSnapshot) { snapshot = next; listeners.forEach(listener => listener()); }

async function authPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new ApiError(response.status, response.status === 401 ? 'Your sign-in has expired. Please sign in again.' : response.status >= 500 ? 'The sign-in server could not complete the request. Please try again later.' : 'Sign-in could not be completed. Please start again.');
  const body = await response.json();
  if (!body.success) throw new Error('Sign-in could not be completed.');
  return body.data as T;
}

function savedSession(): { refreshToken: string; userId: number } | null {
  try {
    const value = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
    return value && typeof value.refreshToken === 'string' && value.refreshToken && Number.isSafeInteger(value.userId) && value.userId > 0 ? value : null;
  } catch { return null; }
}

function acceptSession(session: AuthSession, completedGoogleLogin = false) {
  try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ refreshToken: session.refreshToken, userId: session.user.userId })); } catch { /* The in-memory session remains usable when storage is blocked. */ }
  try { sessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify({ accessToken: session.accessToken, refreshToken: session.refreshToken })); } catch { /* Reload recovery is unavailable when tab storage is blocked. */ }
  update({ status: 'signed-in', session, error: null, completedGoogleLogin });
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => { void refreshSession().catch(() => undefined); }, Math.max(1000, session.expiresAt - Date.now() - 60_000));
}

function forgetSession(error: string | null = null, removeSaved = true) {
  window.clearTimeout(refreshTimer);
  if (removeSaved) { try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* Storage may be unavailable. */ } }
  try { sessionStorage.removeItem(TAB_SESSION_KEY); } catch { /* Storage may be unavailable. */ }
  update({ status: 'guest', session: null, error, completedGoogleLogin: false });
}

async function revoke(token: string) { try { await authPost('logout', { refreshToken: token }); } catch { /* Local sign-out must complete even if the server is unavailable. */ } }

export function refreshSession(): Promise<string> {
  if (refreshing) return refreshing;
  const version = generation;
  const stored = savedSession();
  const previous = stored ?? (snapshot.session ? { refreshToken: snapshot.session.refreshToken, userId: snapshot.session.user.userId } : null);
  refreshing = (async () => {
    if (!previous) throw new Error('Please sign in to view your picks.');
    const tokens = await authPost<SessionTokens>('reissue', { refreshToken: previous.refreshToken });
    if (version !== generation) { await revoke(tokens.refreshToken); throw new Error('Sign-in was cancelled.'); }
    const session = sessionFromTokens(tokens);
    if (session.user.userId !== previous.userId) throw new Error('The account could not be verified. Please sign in again.');
    acceptSession(session, snapshot.completedGoogleLogin);
    return session.accessToken;
  })().catch(error => {
    const removeSaved = error instanceof ApiError ? error.status === 400 || error.status === 401 || error.status === 403 : !(error instanceof TypeError || error?.name === 'TimeoutError');
    if (version === generation) {
      if (!removeSaved && snapshot.session && snapshot.session.expiresAt > Date.now()) {
        // Keep a still-valid access token during a temporary refresh outage.
        refreshTimer = window.setTimeout(() => { void refreshSession().catch(() => undefined); }, Math.min(30_000, snapshot.session.expiresAt - Date.now()));
      } else forgetSession(error instanceof Error ? error.message : 'Please sign in again.', removeSaved);
    }
    throw error;
  }).finally(() => { refreshing = null; });
  return refreshing;
}

export function initializeAuth(): Promise<void> {
  if (bootstrap) return bootstrap;
  bootstrap = (async () => {
    if (isGoogleCallback) {
      const callbackUrl = window.location.href;
      let pending: PendingGoogleLogin | null = null;
      try { pending = JSON.parse(sessionStorage.getItem(GOOGLE_LOGIN_STORAGE_KEY) || 'null'); } catch { /* Invalid pending state is rejected below. */ }
      try { sessionStorage.removeItem(GOOGLE_LOGIN_STORAGE_KEY); } catch { /* The pending-state check still rejects blocked storage. */ }
      window.history.replaceState(null, '', '/');
      const version = generation;
      try {
        const code = googleCallbackCode(callbackUrl, pending);
        const tokens = await authPost<SessionTokens>('oauth/google', { code });
        if (version !== generation) { await revoke(tokens.refreshToken); return; }
        acceptSession(sessionFromTokens(tokens), true);
      } catch (error) { if (version === generation) forgetSession(error instanceof Error ? error.message : 'Sign-in failed.'); }
    } else if (isGoogleSignInEntry) {
      window.history.replaceState(null, '', '/');
      try { startGoogleSignIn(); } catch (error) { forgetSession(error instanceof Error ? error.message : 'Sign-in failed.'); }
    } else if (savedSession()) {
      try {
        const tokens = JSON.parse(sessionStorage.getItem(TAB_SESSION_KEY) || 'null');
        const session = sessionFromTokens(tokens);
        const stored = savedSession();
        if (stored?.userId === session.user.userId && stored.refreshToken === session.refreshToken && session.expiresAt > Date.now() + 60_000) { acceptSession(session); return; }
      } catch { /* Expired tab tokens are restored through the server refresh endpoint. */ }
      try { await refreshSession(); } catch { /* The refresh handler updates the visible auth status. */ }
    } else forgetSession();
  })();
  return bootstrap;
}

export function canRestoreSession() { return Boolean(savedSession()); }
export async function retrySession() {
  update({ status: 'loading', session: null, error: null, completedGoogleLogin: false });
  try { await refreshSession(); } catch { /* Keep the actionable error from refreshSession. */ }
}

export function startGoogleSignIn() {
  if (!clientId) throw new Error('Google sign-in is not configured yet. Please try again later.');
  // Use the configured loopback host before creating state; storage is origin-scoped.
  const entry = localSignInEntry(configuredRedirectUri, window.location.origin);
  if (entry) { window.location.assign(entry); return; }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const state = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const url = googleAuthorizationUrl(clientId, configuredRedirectUri, state, window.location.origin);
  try { sessionStorage.setItem(GOOGLE_LOGIN_STORAGE_KEY, JSON.stringify({ state, createdAt: Date.now(), redirectUri: configuredRedirectUri })); }
  catch { throw new Error('Please allow browser storage to sign in with Google.'); }
  window.location.assign(url);
}

export async function signOut() {
  const token = savedSession()?.refreshToken ?? snapshot.session?.refreshToken;
  generation++;
  forgetSession();
  if (token) await revoke(token);
}

export async function withAccessToken<T>(operation: (token: string) => Promise<T>): Promise<T> {
  if (snapshot.status !== 'signed-in' || !snapshot.session) throw new Error('Please sign in.');
  const token = snapshot.session.expiresAt > Date.now() + 30_000 ? snapshot.session.accessToken : await refreshSession();
  try { return await operation(token); }
  catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    return operation(await refreshSession());
  }
}

window.addEventListener('storage', event => {
  if (event.key !== AUTH_STORAGE_KEY) return;
  if (!event.newValue) { generation++; forgetSession(null, false); }
  else if (savedSession()?.userId !== snapshot.session?.user.userId) {
    generation++;
    const pending = refreshing;
    forgetSession(null, false);
    if (pending) void pending.catch(() => undefined).then(() => refreshSession()).catch(() => undefined);
    else void refreshSession().catch(() => undefined);
  }
});
