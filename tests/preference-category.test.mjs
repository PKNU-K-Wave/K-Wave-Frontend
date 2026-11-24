import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypescript } from './load-typescript.mjs';

const { selectPreferenceCategory, normalizePreferenceCategory } = await loadTypescript('../src/utils/recommendations.ts');
const { readUserPreference, saveUserPreference } = await loadTypescript('../src/utils/preferenceStorage.ts');

test('switching broad category replaces the category and clears incompatible taste selections', () => {
  const video = { categories: ['movie','drama'], tags: ['Action','Romance'] };
  const pop = selectPreferenceCategory(video, 'kpop');
  assert.deepEqual(pop, { categories: ['song','idol'], tags: [] });
  assert.deepEqual(selectPreferenceCategory({ ...pop, tags: ['Group'] }, 'food'), { categories: ['food'], tags: [] });
  assert.deepEqual(video.tags, ['Action','Romance']);
});

test('clicking the selected category again preserves its selected tastes', () => {
  const selected = { categories: ['song','idol'], tags: ['Group'] };
  assert.equal(selectPreferenceCategory(selected, 'kpop'), selected);
});

test('first category selection is exclusive and unknown categories do not change preferences', () => {
  const empty = { categories: [], tags: [] };
  assert.deepEqual(selectPreferenceCategory(empty, 'video'), { categories: ['movie','drama'], tags: [] });
  assert.equal(selectPreferenceCategory(empty, 'unknown'), empty);
});

test('legacy multi-category preferences keep the first group and clear mixed tags', () => {
  assert.deepEqual(normalizePreferenceCategory({ categories: ['movie','song','drama','food'], tags: ['Action','Group'] }), { categories: ['movie','drama'], tags: [] });
  const stored = { categories: ['food','song'], tags: ['Quick','Group'] };
  assert.deepEqual(readUserPreference(1, { getItem: () => JSON.stringify(stored) }), { categories: ['food'], tags: [] });
});

test('single-category multilingual tastes persist while empty category cannot retain orphaned tags', () => {
  const selected = { categories: ['movie','drama'], tags: ['로맨스','Romance','爱情','ロマンス'] };
  assert.equal(normalizePreferenceCategory(selected), selected);
  const storage = new Map();
  saveUserPreference(1, selected, { setItem: (key,value) => storage.set(key,value) });
  assert.deepEqual(readUserPreference(1, { getItem: key => storage.get(key) }), selected);
  assert.deepEqual(normalizePreferenceCategory({ categories: [], tags: ['Action'] }), { categories: [], tags: [] });
});
