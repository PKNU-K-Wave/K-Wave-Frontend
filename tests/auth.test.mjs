import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { test } from 'node:test';

async function moduleFrom(file) {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}
const auth = await moduleFrom('../src/utils/authSession.ts');
const preferences = await moduleFrom('../src/utils/preferenceStorage.ts');
const now = 1_000_000;
const jwt = claims => ['header', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'signature'].join('.');

test('loopback sign-in moves to the configured host without accepting remote redirects', () => {
  const callback = 'http://localhost:5173/oauth/google/callback';
  assert.equal(auth.localSignInEntry(callback, 'http://127.0.0.1:5173'), 'http://localhost:5173/?google-sign-in=1');
  assert.equal(auth.localSignInEntry(callback, 'http://localhost:5173'), null);
  assert.throws(() => auth.localSignInEntry(callback, 'https://kwave.example'));
  assert.throws(() => auth.localSignInEntry('https://evil.example/callback', 'http://localhost:5173'));
  assert.throws(() => auth.localSignInEntry(callback, 'http://localhost:5174'));
});

test('identity uses server token userId and rejects expired/malformed responses', () => {
  const session = auth.sessionFromTokens({ accessToken: jwt({ userId: 101, sub: '사용자', exp: 2000 }), refreshToken: 'refresh' }, now);
  assert.equal(session.user.userId, 101);
  assert.equal(session.user.username, '사용자');
  for (const claims of [{ userId: 0, sub: 'a', exp: 2000 }, { userId: 101, sub: 'a', exp: 999 }, { sub: 'a', exp: 2000 }]) {
    assert.throws(() => auth.sessionFromTokens({ accessToken: jwt(claims), refreshToken: 'r' }, now));
  }
  assert.throws(() => auth.sessionFromTokens({ accessToken: 'anything', refreshToken: 'r' }, now));
});

test('Google authorization requests only sign-in scopes and a matching callback', () => {
  const url = new URL(auth.googleAuthorizationUrl('test.apps.googleusercontent.com', 'http://127.0.0.1:5173/auth/google/callback', 'a'.repeat(64), 'http://127.0.0.1:5173'));
  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('scope'), 'openid email profile');
  assert.equal(url.searchParams.get('state'), 'a'.repeat(64));
  assert.equal(url.searchParams.has('client_secret'), false);
  assert.throws(() => auth.googleAuthorizationUrl('', 'http://127.0.0.1:5173/auth/google/callback', 'a', 'http://127.0.0.1:5173'), /not configured/);
  assert.throws(() => auth.googleAuthorizationUrl('id', 'https://evil.example/callback', 'a', 'http://127.0.0.1:5173'));
  assert.throws(() => auth.googleAuthorizationUrl('id', 'http://13.209.94.227/auth/google/callback', 'a', 'http://13.209.94.227'));
});

test('callback validates state, age, origin and provider cancellation before exchanging code', () => {
  const pending = { state: 'a'.repeat(64), createdAt: now, redirectUri: 'http://localhost:5173/auth/google/callback' };
  const url = pending.redirectUri + '?code=google-code&state=' + pending.state;
  assert.equal(auth.googleCallbackCode(url, pending, now + 1000), 'google-code');
  assert.throws(() => auth.googleCallbackCode(url.replace(pending.state, 'invalid'), pending, now + 1000), /verified/);
  assert.throws(() => auth.googleCallbackCode(url, pending, now + 600_001), /verified/);
  assert.throws(() => auth.googleCallbackCode(url, null, now), /verified/);
  assert.throws(() => auth.googleCallbackCode(url.replace('localhost', '127.0.0.1'), pending, now), /verified/);
  assert.throws(() => auth.googleCallbackCode(pending.redirectUri + '?error=access_denied&state=' + pending.state, pending, now), /cancelled/);
});

test('preferences are isolated by user and do not migrate guest/shared choices', () => {
  const data = new Map([['kwave-recommendation-preference', JSON.stringify({ categories: ['food'], tags: ['Quick'] })]]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  assert.equal(preferences.readUserPreference(101, storage), null);
  preferences.saveUserPreference(101, { categories: ['movie'], tags: ['Romance'] }, storage);
  preferences.saveUserPreference(202, { categories: ['song'], tags: ['Group'] }, storage);
  assert.deepEqual(preferences.readUserPreference(101, storage), { categories: ['movie'], tags: ['Romance'] });
  assert.deepEqual(preferences.readUserPreference(202, storage), { categories: ['song'], tags: ['Group'] });
});

test('invalid preference data and unavailable storage fail safely', () => {
  assert.equal(preferences.readUserPreference(101, { getItem: () => '{broken' }), null);
  assert.deepEqual(preferences.readUserPreference(101, { getItem: () => JSON.stringify({ categories: ['movie', 'fake', 'movie'], tags: ['Romance', 4, 'Romance'] }) }), { categories: ['movie'], tags: ['Romance'] });
  assert.equal(preferences.saveUserPreference(101, { categories: [], tags: [] }, { setItem: () => { throw new Error('blocked'); } }), false);
});
