import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { test } from 'node:test';

async function loadTypescript(file) {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8').replace('import.meta.env.VITE_API_BASE_URL', 'undefined');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}
const api = await loadTypescript('../src/api/backend.ts');
const recommendations = await loadTypescript('../src/utils/recommendations.ts');
const chat = await loadTypescript('../src/utils/chatAnswers.ts');
const citations = await loadTypescript('../src/utils/chatCitations.ts');
const videoPresentation = await loadTypescript('../src/utils/videoPresentation.ts');

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

test('legacy deployments are locally paged without repeated full downloads', async () => {
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
    assert.equal(first.content[0].id, 'song-12');
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
