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
