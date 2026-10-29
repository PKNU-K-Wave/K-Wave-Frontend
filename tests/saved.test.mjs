import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const source = fs.readFileSync(new URL('../src/utils/savedContent.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const saved = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const item = (id, kind, tags, genres) => ({ id, kind, tags, genres, title: id, subtitle: '', description: '', imageUrl: 'https://example.test/image.jpg' });
test('saved collections persist per account and reject malformed storage', () => {
  const map = new Map(); const storage = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  saved.writeSaved(1, [{ ...item('v', 'movie', ['Romance']), connectedItems: [item('x', 'song', [])] }], storage);
  assert.equal(saved.readSaved(1, storage).length, 1);
  assert.equal(saved.readSaved(1, storage)[0].connectedItems, undefined);
  assert.equal(saved.readSaved(2, storage).length, 0);
  map.set(saved.savedKey(1), '{bad'); assert.deepEqual(saved.readSaved(1, storage), []);
  map.set(saved.savedKey(1), JSON.stringify([{ id: 'bad', kind: 'unknown' }])); assert.deepEqual(saved.readSaved(1, storage), []);
});
test('similar picks rank shared genres and exclude saved titles and other categories', () => {
  const favorites = [item('v1', 'movie', ['Movie', '로맨스']), item('v2', 'drama', ['Drama', 'Romance'])];
  const candidates = [...favorites, item('v3', 'drama', ['Romance']), item('v4', 'movie', ['Action']), item('s1', 'song', ['Romance'])];
  const matches = saved.similarSaved(candidates, favorites, 'video');
  assert.deepEqual(matches.map(value => value.item.id), ['v3']); assert.equal(matches[0].score, 2);
  assert.deepEqual(matches[0].matches, ['romance']);
});
test('generic category and fandom tags are not fabricated as music genres', () => {
  assert.deepEqual(saved.tasteTags(item('a', 'idol', ['Group', 'Fans fandom'], [])), []);
  assert.deepEqual(saved.tasteTags(item('b', 'song', ['K-POP', 'Title track'])), []);
  assert.deepEqual(saved.tasteTags(item('c', 'movie', ['Drama'], ['Drama'])), ['drama']);
});
test('food uses food tags and never video genres', () => {
  const favorite = item('f1', 'food', ['Quick', 'One Pan']);
  assert.deepEqual(saved.similarSaved([item('f2', 'food', ['Quick']), item('v1', 'movie', ['Quick'])], [favorite], 'food').map(value => value.item.id), ['f2']);
});
