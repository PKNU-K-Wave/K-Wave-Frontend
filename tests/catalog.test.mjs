import { loadTypescript } from './load-typescript.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const api = await loadTypescript('../src/api/backend.ts');
const recommendations = await loadTypescript('../src/utils/recommendations.ts');
const chat = await loadTypescript('../src/utils/chatAnswers.ts');
const citations = await loadTypescript('../src/utils/chatCitations.ts');
const videoPresentation = await loadTypescript('../src/utils/videoPresentation.ts');

test('streaming availability is not overwritten with a filming-location answer', () => {
  const response = { answer: 'I do not have verified streaming availability.', suggestions: [], responseMode: 'catalog' };
  assert.equal(chat.clarifyCatalogAnswer(response, 'where can I watch this movie?', 'en', { kind: 'movie', title: 'Film' }), response);
});

test('web citations are clickable safe segments with Unicode offsets', () => {
  const answer = '😀 Place [1]';
  const sources = [{ url: 'https://example.org/place', title: 'Tourism', startIndex: 8, endIndex: 11 }];
  assert.deepEqual(citations.citedAnswerSegments(answer, sources), [{ text: '😀 Place ' }, { text: '[1]', url: sources[0].url, title: 'Tourism' }]);
  assert.deepEqual(citations.citedAnswerSegments(answer, [{ ...sources[0], url: 'javascript:alert(1)' }]), [{ text: answer }]);
  assert.deepEqual(citations.citedAnswerSegments(answer, [{ ...sources[0], endIndex: 100 }]), [{ text: answer }]);
  assert.equal(citations.citedAnswerSegments(answer, [...sources, ...sources]).filter(segment => segment.url).length, 1);
  assert.deepEqual(citations.citedAnswerSegments('Old server answer'), [{ text: 'Old server answer' }]);
});

test('location questions explain missing evidence without repeating a title card', () => {
  const context = { kind: 'movie', title: 'Example' };
  const response = { answer: 'Open a card', responseMode: 'catalog', suggestions: [{ title: 'Example' }] };
  for (const [language, question] of [['en', "I want to know about this movie's places"], ['zh', '拍摄地在哪里'], ['ja', 'ロケ地を教えて']]) {
    const result = chat.clarifyCatalogAnswer(response, question, language, context);
    assert.notEqual(result.answer, response.answer);
    assert.deepEqual(result.suggestions, []);
  }
  assert.equal(chat.clarifyCatalogAnswer(response, 'Who is the director?', 'en', context), response);
  assert.equal(chat.clarifyCatalogAnswer({ ...response, responseMode: 'llm' }, 'Where was it filmed?', 'en', context).answer, response.answer);
});

test('video page preserves server metadata and encodes filters', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      const params = new URL(url).searchParams;
      assert.equal(params.get('lang'), 'ja');
      assert.equal(params.get('page'), '2');
      assert.equal(params.get('type'), 'DRAMA');
      assert.equal(params.get('genre'), 'Romance & Comedy');
      return { ok: true, json: async () => ({ success: true, data: { content: [], number: 2, totalPages: 3, totalElements: 24 } }) };
    };
    const result = await api.fetchVideoPage('ja', { type: 'DRAMA', genre: 'Romance & Comedy', sort: 'releaseDate' }, 2, new AbortController().signal);
    assert.equal(result.number, 2);
    assert.equal(result.totalPages, 3);
    assert.deepEqual(result.content, []);
  } finally { globalThis.fetch = original; }
});

test('API failure envelopes remain errors', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: false, data: null, message: 'Failed' }) });
    await assert.rejects(api.searchContent('aespa', 'en', '', 0, new AbortController().signal), /Failed/);
  } finally { globalThis.fetch = original; }
});

test('unloaded recommendation retains navigation IDs', () => {
  const item = api.recommendationToContent({ id: 'artist-21', contentType: 'idol', domainId: 21, contentId: 201, title: 'aespa', subtitle: 'Group', tags: ['Group'], description: '' });
  assert.equal(item.id, 'artist-21');
  assert.equal(item.contentId, 201);
  assert.equal(item.kind, 'idol');
});

test('local recommendations honor category, tags and reset', () => {
  const movie = { id: 'v1', kind: 'movie', title: 'Film', subtitle: '', description: '', tags: ['Thriller'], ostIds: ['song'] };
  const song = { id: 's1', kind: 'song', title: 'Track', subtitle: '', description: '', tags: ['Romance'], relatedIdolIds: ['idol'] };
  assert.deepEqual(recommendations.calculateRecommendations([movie, song], { categories: ['movie'], tags: ['Romance'] }), []);
  assert.deepEqual(recommendations.calculateRecommendations([movie, song], { categories: [], tags: [] }), []);
  const result = recommendations.calculateRecommendations([movie, song], { categories: ['movie'], tags: ['Thriller'] });
  assert.equal(result.length, 1);
  assert.equal(result[0].item.id, 'v1');
});

test('new K-POP page contract preserves metadata and music preview fields', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.get('page'), '1');
      assert.equal(parsed.searchParams.get('size'), '24');
      assert.equal(parsed.searchParams.get('sort'), 'releaseDate');
      return { ok: true, json: async () => ({ success: true, data: { content: [{ songId: 25, contentId: 125, title: 'New track', artistId: 7, artistName: 'Group', releaseDate: '2026-10-01', previewUrl: 'https://example.com/preview.m4a', trackSeconds: 185, recordType: 'single', isTitleTrack: true, genre: 'Dance' }], number: 1, totalPages: 5, totalElements: 100 } }) };
    };
    const result = await api.fetchKPopPage('songs', 1);
    assert.equal(result.totalElements, 100);
    assert.equal(result.number, 1);
    assert.equal(result.content[0].previewUrl, 'https://example.com/preview.m4a');
    assert.equal(result.content[0].trackSeconds, 185);
    assert.ok(result.content[0].tags.includes('Title track'));
    assert.equal(result.content[0].challengeUrl, undefined);
    assert.deepEqual(result.content[0].relatedIdolIds, ['artist-7']);
    await assert.rejects(api.fetchKPopPage('songs', 417), /range/);
  } finally { globalThis.fetch = original; }
});

test('artist detail retains profiles and songs outside the home preview', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => ({ ok: true, json: async () => ({ success: true, data: url.endsWith('/songs') ? [{ songId: 909, contentId: 1909, title: 'Hidden song', artistId: 77 }] : url.endsWith('/members') ? [] : { artistId: 77, contentId: 177, name: 'New group', isGroup: true, debutYear: 2020, agency: 'Label', generation: '4', description: 'Real biography', fandomCulture: 'Fan traditions', instagramUrl: 'https://instagram.com/example' } }) });
    const result = await api.fetchSearchDetail({ resultType: 'ARTIST', domainId: 77 }, 'en', new AbortController().signal);
    assert.equal(result.description, 'Real biography');
    assert.equal(result.agency, 'Label');
    assert.equal(result.fandomCulture, 'Fan traditions');
    assert.equal(result.connectedItems[0].id, 'song-909');
    assert.equal(result.challengeUrl, undefined);
    assert.equal(result.connectedItems[0].connectedItems[0].id, 'artist-77');
  } finally { globalThis.fetch = original; }
});

test('video detail retains ratings, thumbnails, resolved language and cast role', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: { contentId: 9, type: 'MOVIE', title: 'Film', summary: 'Short summary', posterUrl: 'original.jpg', posterThumbUrl: 'thumb.jpg', voteAverage: 8.4, voteCount: 523, resolvedLanguage: 'ko', culturalBackground: 'Culture', actors: [{ actorId: 2, name: 'Actor', characterName: 'Lead role', profileThumbUrl: 'actor-small.jpg' }] } }) });
    const result = await api.fetchVideoDetailContent(9, 'en');
    assert.equal(result.description, 'Short summary');
    assert.equal(result.imageUrl, 'original.jpg');
    assert.equal(result.thumbnailUrl, 'thumb.jpg');
    assert.equal(result.voteAverage, 8.4);
    assert.equal(result.resolvedLanguage, 'ko');
    assert.equal(result.cast[0].role, 'Lead role');
    assert.equal(result.cast[0].imageUrl, 'actor-small.jpg');
    assert.equal(result.year, 0);
  } finally { globalThis.fetch = original; }
});

test('shared API display cleanup covers video prose, quotes, cast and image URL preservation', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: { contentId: 9, type: 'MOVIE', title: 'Film &amp; Star', description: 'First<br>Second', culturalBackground: '<p>Culture &amp; history</p>', posterUrl: 'https://example.test/image?a=1&amp;b=2', actors: [{ actorId: 2, name: 'Actor &amp; Name', characterName: '<b>Lead</b>' }], famousLines: [{ lineText: 'Hello&nbsp;world' }] } }) });
    const result = await api.fetchVideoDetailContent(9, 'en');
    assert.equal(result.title, 'Film & Star');
    assert.equal(result.description, 'First\nSecond');
    assert.equal(result.culturalBackground, 'Culture & history');
    assert.equal(result.cast[0].name, 'Actor & Name');
    assert.equal(result.cast[0].role, 'Lead');
    assert.deepEqual(result.famousLines, ['Hello world']);
    assert.equal(result.imageUrl, 'https://example.test/image?a=1&amp;b=2');
  } finally { globalThis.fetch = original; }
});

test('food pages use server filters, shared content IDs and preserve null metadata', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      const parsed = new URL(url);
      assert.equal(parsed.pathname, '/api/v1/foods');
      assert.equal(parsed.searchParams.get('page'), '2');
      assert.equal(parsed.searchParams.get('category'), 'SOUP');
      assert.equal(parsed.searchParams.get('exclude'), 'PORK,SEAFOOD');
      assert.equal(parsed.searchParams.get('vegetarian'), 'true');
      assert.equal(parsed.searchParams.get('lang'), 'ja');
      return { ok: true, json: async () => ({ success: true, data: { content: [{ foodId: 17043, name: 'Soup', categoryName: 'Soups', isVegetarian: true, caloriesKcal: null }], number: 2, totalPages: 3, totalElements: 50 } }) };
    };
    const result = await api.fetchFoodPage('ja', { category: 'SOUP', vegetarian: true, exclude: ['PORK', 'SEAFOOD'] }, 2);
    assert.equal(result.content[0].id, 'food-17043');
    assert.equal(result.content[0].contentId, 17043);
    assert.equal(result.content[0].foodInfo.caloriesKcal, null);
    assert.equal(result.content[0].cookTime, undefined);
    assert.equal(result.content[0].difficulty, undefined);
    await assert.rejects(api.fetchFoodPage('en', { category: '', vegetarian: false, exclude: [] }, 417), /range/);
  } finally { globalThis.fetch = original; }
});

test('recipes have distinct deep-link IDs and never masquerade as central food IDs', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      const parsed = new URL(url);
      if (parsed.pathname === '/api/v1/recipes') {
        assert.equal(parsed.searchParams.get('lang'), 'en');
        assert.equal(parsed.searchParams.get('dishType'), 'SIDE');
        assert.equal(parsed.searchParams.get('cookingMethod'), 'STEAM');
        return { ok: true, json: async () => ({ success: true, data: { content: [{ recipeId: 1, name: 'Recipe', foodId: 17158 }], number: 0, totalPages: 1, totalElements: 1 } }) };
      }
      assert.equal(parsed.pathname, '/api/v1/recipes/1');
      assert.equal(parsed.searchParams.get('lang'), 'en');
      return { ok: true, json: async () => ({ success: true, data: { recipeId: 1, name: 'Recipe', ingredients: 'tofu', steps: [{ order: 1, description: 'Steam' }] } }) };
    };
    const result = await api.fetchRecipePage({ dishType: 'SIDE', cookingMethod: 'STEAM' }, 0, 'en');
    assert.equal(result.content[0].id, 'food-recipe-1');
    assert.equal(result.content[0].contentId, undefined);
    const detail = await api.fetchContentDetail({ ...result.content[0], recipeId: undefined }, 'en', new AbortController().signal);
    assert.equal(detail.recipe.steps[0].description, 'Steam');
  } finally { globalThis.fetch = original; }
});

test('food details preserve translation, recipe links, dietary data and attribution', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      assert.equal(new URL(url).pathname, '/api/v1/foods/17043');
      assert.equal(new URL(url).searchParams.get('lang'), 'zh');
      return { ok: true, json: async () => ({ success: true, data: { foodId: 17043, name: 'Food', resolvedLanguage: 'ko', description: 'Info', ingredients: 'Rice', imageLicense: 'CC BY-SA', imageSourceUrl: 'https://example.org/image', recipes: [{ recipeId: 168, name: 'Recipe' }] } }) };
    };
    const item = await api.fetchContentDetail({ id: 'food-17043', kind: 'food' }, 'zh', new AbortController().signal);
    assert.equal(item.foodInfo.resolvedLanguage, 'ko');
    assert.equal(item.foodInfo.recipes[0].recipeId, 168);
    assert.equal(item.foodInfo.imageLicense, 'CC BY-SA');
    assert.deepEqual(item.ingredients, ['Rice']);
  } finally { globalThis.fetch = original; }
});

test('music capability detection rejects unavailable or silently ignored popularity', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ message: 'Unsupported sort' }) });
    assert.equal(await api.musicDiscoveryAvailable('artists'), false);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: { content: [{ artistId: 1 }] } }) });
    assert.equal(await api.musicDiscoveryAvailable('artists'), false);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: { content: [{ artistId: 1, lastfmListeners: null }] } }) });
    assert.equal(await api.musicDiscoveryAvailable('artists'), true);
  } finally { globalThis.fetch = original; }
});

test('extra music filters follow collection boundaries and require explicit capability metadata', async () => {
  const original = globalThis.fetch;
  try {
    const calls = [];
    globalThis.fetch = async url => {
      calls.push(new URL(url));
      return { ok: true, json: async () => ({ success: true, data: { content: [], number: 0, totalPages: 0, totalElements: 0 } }) };
    };
    await api.fetchKPopPage('songs', 0, undefined, { sort: 'popularity', ostOnly: true, generation: '4세대', genre: 'Ballad', mood: 'calm' });
    assert.equal(calls.at(-1).searchParams.get('mood'), 'calm');
    assert.equal(calls.at(-1).searchParams.get('ostOnly'), 'true');
    assert.equal(calls.at(-1).searchParams.has('generation'), false);
    await api.fetchKPopPage('artists', 0, undefined, { sort: 'popularity', ostOnly: true, generation: '4세대', mood: 'calm' });
    assert.equal(calls.at(-1).searchParams.has('mood'), false);
    assert.equal(calls.at(-1).searchParams.get('generation'), '4세대');
    assert.equal(calls.at(-1).searchParams.has('ostOnly'), false);
    globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
    assert.deepEqual(await api.fetchKPopFilters('artists'), { generation: false, generations: [], ostOnly: false });
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: { generation: true, generations: ['3세대', '4세대'], ostOnly: true } }) });
    assert.deepEqual(await api.fetchKPopFilters('artists'), { generation: true, generations: ['3세대', '4세대'], ostOnly: false });
  } finally { globalThis.fetch = original; }
});

test('music discovery sends server sorting and genre filters without reordering records', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      const params = new URL(url).searchParams;
      assert.equal(params.get('sort'), 'popularity');
      assert.equal(params.get('genre'), 'R&B');
      assert.equal(params.get('lang'), 'ja');
      return { ok: true, json: async () => ({ success: true, data: { content: [{ songId: 99, title: 'First', genreMain: 'R&B', genreSub: 'Soul' }, { songId: 1, title: 'Second' }], number: 0, totalPages: 2, totalElements: 30 } }) };
    };
    const result = await api.fetchKPopPage('songs', 0, undefined, { sort: 'popularity', genre: 'R&B', language: 'ja' });
    assert.deepEqual(result.content.map(item => item.id), ['song-99', 'song-1']);
    assert.deepEqual(result.content[0].genres, ['R&B', 'Soul']);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: [] }) });
    await assert.rejects(api.fetchKPopPage('songs', 0, undefined, { sort: 'popularity' }), /does not support/);
  } finally { globalThis.fetch = original; }
});

test('legacy deployments preserve received order and are locally paged without repeated full downloads', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async () => { calls++; return { ok: true, json: async () => ({ success: true, data: Array.from({ length: 30 }, (_, i) => ({ songId: i + 1, title: `Old ${i}`, releaseDate: `2026-${String((i % 12) + 1).padStart(2, '0')}-01` })) }) }; };
    const [first, simultaneous] = await Promise.all([api.fetchKPopPage('songs', 0), api.fetchKPopPage('songs', 0)]);
    const initialCalls = calls;
    const second = await api.fetchKPopPage('songs', 1);
    assert.equal(first.content.length, 24);
    assert.equal(second.content.length, 6);
    assert.equal(first.totalPages, 2);
    assert.equal(first.content[0].id, 'song-1');
    assert.equal(simultaneous.content[0].id, first.content[0].id);
    assert.equal(calls, initialCalls);
    assert.equal(new Set([...first.content, ...second.content].map(item => item.id)).size, 30);
  } finally { globalThis.fetch = original; }
});

test('video filter parameters follow the verified controller contract', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      const q = new URL(url).searchParams;
      assert.equal(q.get('genre'), 'ACTION');
      assert.equal(q.get('yearFrom'), '2010');
      assert.equal(q.get('yearTo'), '2019');
      assert.equal(q.get('direction'), 'asc');
      assert.equal(q.get('hasOst'), 'true');
      return { ok: true, json: async () => ({ success: true, data: { content: [], number: 0, totalPages: 0, totalElements: 0 } }) };
    };
    await api.fetchVideoPage('en', { type: 'DRAMA', genre: 'ACTION', sort: 'releaseDate', direction: 'asc', yearFrom: 2010, yearTo: 2019, hasOst: true }, 0, new AbortController().signal);
    await assert.rejects(api.fetchVideoPage('en', { type: '', genre: '', sort: 'voteAverage' }, 834, new AbortController().signal), /range/);
  } finally { globalThis.fetch = original; }
});

test('genre choices come from the server rather than translated display-name guesses', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      assert.equal(new URL(url).pathname, '/api/v1/videos/genres');
      assert.equal(new URL(url).searchParams.get('type'), 'DRAMA');
      return { ok: true, json: async () => ({ success: true, data: [{ code: 'ACTION', name: 'アクション', count: 8 }] }) };
    };
    assert.deepEqual(await api.fetchVideoGenres('ja', 'DRAMA', new AbortController().signal), [{ code: 'ACTION', name: 'アクション', count: 8 }]);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: '<html>' }) });
    await assert.rejects(api.fetchVideoGenres('en', '', new AbortController().signal), /Invalid/);
  } finally { globalThis.fetch = original; }
});

test('connection pages preserve shared-actor evidence and actual totals', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async url => {
      assert.equal(new URL(url).pathname, '/api/v1/videos/419/related');
      assert.equal(new URL(url).searchParams.get('page'), '1');
      assert.equal(new URL(url).searchParams.get('size'), '12');
      return { ok: true, json: async () => ({ success: true, data: { content: [{ contentId: 500, type: 'MOVIE', title: 'Connected film', relationType: 'CO_STAR', sharedActors: [{ actorId: 2, name: 'Actor A' }] }], number: 1, totalPages: 2, totalElements: 13 } }) };
    };
    const result = await api.fetchVideoConnections(419, 'related', 'en', 1, new AbortController().signal);
    assert.equal(result.totalElements, 13);
    assert.equal(result.content[0].sharedActors[0].name, 'Actor A');
    assert.equal(videoPresentation.relatedReason(result.content[0], 'en'), 'Shared cast: Actor A');
    assert.equal(videoPresentation.relatedReason({ relationType: 'UNKNOWN' }, 'en'), null);
  } finally { globalThis.fetch = original; }
});

test('seasons and translation status do not invent missing content', () => {
  assert.equal(videoPresentation.seasonLabel({ number: 2, name: '시즌 2' }, 'en'), 'Season 2');
  assert.equal(videoPresentation.seasonLabel({ number: 2, name: null }, 'ja'), 'シーズン 2');
  assert.equal(videoPresentation.seasonLabel({ number: 1, name: 'Special edition' }, 'en'), 'Special edition');
  assert.equal(videoPresentation.translationNotice('en', 'en'), null);
  assert.equal(videoPresentation.translationNotice('en', undefined), null);
  assert.match(videoPresentation.translationNotice('en', 'ko'), /Translation pending/);
});

test('video metadata preserves season data and suppresses the verified placeholder', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: { contentId: 1354, type: 'DRAMA', title: 'Test drama', director: null, seasonCount: 1, totalEpisodes: 12, seasons: [{ number: 1, name: null, episodes: 12 }], ostCount: 60, relatedCount: 25, famousLines: [{ lineText: '현재준비중' }, { lineText: 'An actual line' }] } }) });
    const result = await api.fetchVideoDetailContent(1354, 'en');
    assert.equal(result.director, '');
    assert.equal(result.totalEpisodes, 12);
    assert.equal(result.seasons[0].episodes, 12);
    assert.equal(result.ostCount, 60);
    assert.equal(result.relatedCount, 25);
    assert.deepEqual(result.famousLines, ['An actual line']);
  } finally { globalThis.fetch = original; }
});

test('capability detection does not trust silently ignored year parameters', async () => {
  const original = globalThis.fetch;
  try {
    let old = true;
    let ignoreYears = true;
    globalThis.fetch = async url => ({ ok: true, json: async () => ({ success: true, data: new URL(url).searchParams.has('yearFrom') && !ignoreYears ? { content: [], totalElements: 0 } : { content: [{ releaseDate: '2026-04-18', ...(old ? {} : { resolvedLanguage: 'ko', ostCount: 1, relatedCount: 2 }) }], totalElements: 1914 } }) });
    assert.deepEqual(await api.fetchVideoCapabilities(new AbortController().signal), { years: false, direction: false, ost: false });
    old = false;
    assert.equal((await api.fetchVideoCapabilities(new AbortController().signal)).years, false);
    ignoreYears = false;
    assert.deepEqual(await api.fetchVideoCapabilities(new AbortController().signal), { years: true, direction: true, ost: true });
  } finally { globalThis.fetch = original; }
});
