import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypescript } from './load-typescript.mjs';

const api = await loadTypescript('../src/api/backend.ts');
const { favoriteId } = await loadTypescript('../src/utils/savedContent.ts');
const { personalReason } = await loadTypescript('../src/utils/personalReason.ts');
const signal = new AbortController().signal;
const ok = data => ({ ok: true, json: async () => ({ success: true, data }) });
const page = (content, number = 0, totalPages = 1) => ({ content, number, totalPages, totalElements: content.length });

test('favorites use bearer auth, paginate, and distinguish content and domain IDs', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    const u = new URL(url);
    if (options.method === 'POST') {
      assert.equal(u.pathname, '/api/v1/favorites');
      assert.deepEqual(JSON.parse(options.body), { contentId: 16074 });
      return ok(null);
    }
    if (options.method === 'DELETE') {
      assert.equal(u.pathname, '/api/v1/favorites/16074');
      return ok(null);
    }
    const number = Number(u.searchParams.get('page'));
    return ok(page([number === 0
      ? { contentId: 16074, domainId: 13571, contentType: 'song', title: 'Spring Snow' }
      : { contentId: 1511, domainId: 1511, contentType: 'drama', title: 'Lovely Runner' }], number, 2));
  });
  const favorites = await api.fetchFavorites('test-token', signal);
  assert.deepEqual(favorites.map(x => [x.id, favoriteId(x)]), [['song-13571', 16074], ['video-1511', 1511]]);
  assert.equal(favoriteId({ id: 'food-recipe-10', contentId: 10 }), undefined);
  await api.changeFavorite(16074, true, 'test-token', signal);
  await api.changeFavorite(16074, false, 'test-token', signal);
});

test('recommendation endpoints use selected language without rewriting saved tags', async t => {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async url => {
    const u = new URL(url);
    seen.push([u.pathname, u.searchParams.get('lang'), u.searchParams.get('tags'), u.searchParams.get('type')]);
    return ok(u.pathname.endsWith('/me') ? page([{ contentId: 16074, type: 'song', title: 'Spring Snow', reason: 'TASTE', reasonGenre: 'Pop', genres: ['Pop'] }]) : []);
  });
  const preference = { categories: ['movie'], tags: ['로맨스'] };
  for (const lang of ['en', 'zh', 'ja']) {
    await api.fetchRecommendationTags(preference.categories, lang, signal, 'token');
    await api.fetchRecommendations(preference, lang, signal);
  }
  const [pick] = await api.fetchPersonalRecommendations('song', 'ja', 'token', signal);
  assert.equal(api.personalPickToContent(pick).id, 'song-content-16074');
  assert.deepEqual(seen.map(row => row.slice(1)), [
    ['en', null, null], ['en', '로맨스', null], ['zh', null, null], ['zh', '로맨스', null],
    ['ja', null, null], ['ja', '로맨스', null], ['ja', null, 'song'],
  ]);
  assert.deepEqual(preference.tags, ['로맨스']);
  for (const lang of ['ko', 'en', 'zh', 'ja']) {
    assert.ok(personalReason('TASTE', 'Pop', lang).includes('Pop'));
    assert.notEqual(personalReason('EXPLORE', null, lang), personalReason('POPULAR', null, lang));
  }
});

test('personalized song opens exact content match, not another song sharing its title', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    const u = new URL(url);
    if (u.pathname.startsWith('/api/v1/contents/')) return ok({ title: '봄눈' });
    if (u.pathname.endsWith('/search')) return ok(page([{ contentId: 200, domainId: 12 }, { contentId: 16074, domainId: 13571, resultType: 'SONG' }]));
    assert.equal(u.pathname, '/api/v1/songs/13571');
    assert.equal(u.searchParams.get('lang'), 'ja');
    return ok({ songId: 13571, contentId: 16074, title: 'Spring Snow', genre: 'K-Pop', genreMain: '팝' });
  });
  const detail = await api.fetchContentDetail(api.personalPickToContent({ contentId: 16074, type: 'song', title: 'Spring Snow' }), 'ja', signal);
  assert.equal(detail.id, 'song-13571');
  assert.deepEqual(detail.genres, ['Pop']);
  assert.ok(detail.tags.includes('K-POP'));
});

test('artist displays generationName separately from the filter key', async t => {
  t.mock.method(globalThis, 'fetch', async () => ok(page([{ artistId: 1, contentId: 2, name: 'Group', isGroup: true, generation: '5세대', generationName: '第5世代' }])));
  const result = await api.fetchKPopPage('artists', 0, signal, { sort: 'popularity', language: 'ja' });
  assert.equal(result.content[0].generation, '5세대');
  assert.equal(result.content[0].generationName, '第5世代');
});
