import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypescript } from './load-typescript.mjs';

const { fetchPresentationCards } = await loadTypescript('../src/api/presentationCards.ts');
const signal = () => new AbortController().signal;
const seed = id => ({ id: `video-${id}`, contentId: id, kind: 'movie', title: 'Stored title', subtitle: '드라마, 범죄', tags: ['DRAMA'], description: '' });
const ok = data => ({ ok: true, json: async () => ({ success: true, data }) });

test('card details are localized before opening a modal, preserve order and bound concurrent requests', async t => {
  let active = 0, maximum = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    active++; maximum = Math.max(maximum, active);
    const u = new URL(url), id = Number(u.pathname.split('/').pop());
    assert.equal(u.searchParams.get('lang'), 'en');
    await new Promise(resolve => setTimeout(resolve, id % 3));
    active--;
    return ok({ contentId: id, type: 'MOVIE', title: `Localized ${id}`, description: `Description ${id}`, genres: ['Drama', 'Crime'] });
  });
  const { items, failed } = await fetchPresentationCards([5104,5102,5107,5101].map(seed), 'en', signal());
  assert.equal(failed, false);
  assert.ok(maximum <= 3);
  assert.deepEqual(items.map(item => item.contentId), [5104,5102,5107,5101]);
  assert.equal(items[0].description, 'Description 5104');
  assert.equal(items[0].subtitle, 'Drama, Crime');
  assert.deepEqual(items[0].genres, ['Drama','Crime']);
});

test('public detail cache is language-scoped and does not replace selected-language text with stored subtitles', async t => {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async url => {
    const lang = new URL(url).searchParams.get('lang'); seen.push(lang);
    return ok({ contentId: 5201, type: 'MOVIE', title: lang, description: `${lang} description`, genres: [lang] });
  });
  await fetchPresentationCards([seed(5201)], 'en', signal());
  await fetchPresentationCards([seed(5201)], 'en', signal());
  const result = await fetchPresentationCards([seed(5201)], 'ja', signal());
  assert.deepEqual(seen, ['en','ja']);
  assert.equal(result.items[0].title, 'ja');
  assert.equal(result.items[0].subtitle, 'ja');
});

test('one failed detail keeps the other cards and does not display untranslated metadata as localized', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.includes('/5301?')) throw new Error('Unavailable');
    return ok({ contentId: 5302, type: 'MOVIE', title: 'Available', genres: ['Comedy'] });
  });
  const result = await fetchPresentationCards([seed(5301),seed(5302)], 'en', signal());
  assert.equal(result.failed, true);
  assert.equal(result.items[0].contentId, 5301);
  assert.equal(result.items[0].subtitle, '');
  assert.deepEqual(result.items[0].tags, []);
  assert.equal(result.items[1].title, 'Available');
});

test('aborted card hydration rejects instead of committing a partial stale-language list', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchPresentationCards([seed(5401)], 'en', controller.signal), { name: 'AbortError' });
});

test('music cards do not eagerly fetch full artist discographies or member lists', async t => {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async url => {
    const u = new URL(url); seen.push(u.pathname);
    assert.equal(u.searchParams.get('lang'), 'zh');
    if (u.pathname === '/api/v1/artists/5501') return ok({ artistId: 5501, contentId: 6501, name: 'Localized group', isGroup: true, description: 'Localized biography' });
    assert.equal(u.pathname, '/api/v1/songs/5502');
    return ok({ songId: 5502, contentId: 6502, title: 'Localized song', artistName: 'Localized singer', genre: 'Pop' });
  });
  const result = await fetchPresentationCards([
    { ...seed(6501), id: 'artist-5501', kind: 'idol' },
    { ...seed(6502), id: 'song-5502', kind: 'song' },
  ], 'zh', signal());
  assert.equal(result.failed, false);
  assert.deepEqual(seen.sort(), ['/api/v1/artists/5501','/api/v1/songs/5502']);
  assert.equal(result.items[0].description, 'Localized biography');
  assert.equal(result.items[1].subtitle, 'Localized singer');
});
