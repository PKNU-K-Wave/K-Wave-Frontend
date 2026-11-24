import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypescript } from './load-typescript.mjs';

const api = await loadTypescript('../src/api/backend.ts');
const signal = new AbortController().signal;
const ok = data => ({ ok: true, json: async () => ({ success: true, data }) });

test('actor profile and filmography explicitly request the selected language and retain original fields', async t => {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async url => {
    const u = new URL(url), lang = u.searchParams.get('lang'); seen.push([u.pathname, lang]);
    return ok(u.pathname.endsWith('/filmography')
      ? [{ contentId: 1, title: 'Title', characterName: lang === 'ko' ? '장욱' : 'Jang Uk', originalCharacterName: '장욱' }]
      : { actorId: 1, name: lang === 'ko' ? '이재욱' : 'Lee Jae-wook', originalName: '이재욱', filmographyCount: 1 });
  });
  for (const lang of ['en','zh','ja','ko']) {
    const data = await api.fetchActor(1, lang, signal);
    assert.equal(data.profile.name, lang === 'ko' ? '이재욱' : 'Lee Jae-wook');
    assert.equal(data.profile.originalName, '이재욱');
    assert.equal(data.films[0].characterName, lang === 'ko' ? '장욱' : 'Jang Uk');
    assert.equal(data.films[0].originalCharacterName, '장욱');
  }
  assert.deepEqual(seen.map(row => row[1]), ['en','en','zh','zh','ja','ja','ko','ko']);
});

test('video detail uses translated director, actor and character names without replacing them with originals', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(new URL(url).searchParams.get('lang'), 'ja');
    return ok({ contentId: 1, type: 'DRAMA', title: 'Title', director: 'Park Joon-hwa', originalDirector: '박준화',
      actors: [{ actorId: 2, name: 'イ・ジェウク', originalName: '이재욱', characterName: 'Jang Uk', originalCharacterName: '장욱' }],
      sharedActors: [{ actorId: 2, name: 'イ・ジェウク', originalName: '이재욱' }] });
  });
  const video = await api.fetchVideoDetailContent(1, 'ja', signal);
  assert.equal(video.director, 'Park Joon-hwa');
  assert.equal(video.originalDirector, '박준화');
  assert.equal(video.cast[0].name, 'イ・ジェウク');
  assert.equal(video.cast[0].originalName, '이재욱');
  assert.equal(video.cast[0].role, 'Jang Uk');
  assert.equal(video.cast[0].originalCharacterName, '장욱');
  assert.equal(video.sharedActors[0].name, 'イ・ジェウク');
  assert.equal(video.sharedActors[0].originalName, '이재욱');
});

test('legacy video responses without original fields still render existing names', async t => {
  t.mock.method(globalThis, 'fetch', async () => ok({ contentId: 1, type: 'MOVIE', title: 'Title', director: '기존 감독', actors: [{ actorId: 2, name: '기존 배우', characterName: '기존 배역' }] }));
  const video = await api.fetchVideoDetailContent(1, 'en', signal);
  assert.equal(video.director, '기존 감독');
  assert.equal(video.cast[0].name, '기존 배우');
  assert.equal(video.cast[0].role, '기존 배역');
  assert.equal(video.originalDirector, undefined);
  assert.equal(video.cast[0].originalName, undefined);
});

test('original fields are display-cleaned and used only when the primary name is absent', async t => {
  t.mock.method(globalThis, 'fetch', async () => ok({ contentId: 1, type: 'MOVIE', title: 'Title', director: '', originalDirector: 'A &amp; B', actors: [{ actorId: 2, name: '', originalName: 'C &amp; D', characterName: '', originalCharacterName: 'E &amp; F' }] }));
  const video = await api.fetchVideoDetailContent(1, 'en', signal);
  assert.equal(video.director, 'A & B');
  assert.equal(video.cast[0].name, 'C & D');
  assert.equal(video.cast[0].role, 'E & F');
});
