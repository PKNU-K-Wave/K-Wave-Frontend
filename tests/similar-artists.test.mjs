import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypescript } from './load-typescript.mjs';

const { similarArtists } = await loadTypescript('../src/utils/similarArtists.ts');
test('artist similarity uses real generation, agency and genre, excludes source and duplicates', () => {
  const source = {id:'artist-1',generation:'4세대',agency:' Agency ',genres:['Dance']};
  const same = {id:'artist-2',generation:'4세대',agency:'agency',genres:['Dance']};
  const agency = {id:'artist-3',agency:'AGENCY'};
  const unrelated = {id:'artist-4',generation:'3세대',agency:'Other'};
  const results = similarArtists(source,[source,agency,same,same,unrelated]);
  assert.deepEqual(results.map(result=>result.item.id),['artist-2','artist-3']);
  assert.equal(results[0].generation,true);
  assert.equal(results[0].agency,true);
  assert.deepEqual(results[0].sharedGenres,['Dance']);
});
test('missing metadata does not create similarities and limits are respected', () => {
  assert.deepEqual(similarArtists({id:'a'},[{id:'b'}]),[]);
  assert.deepEqual(similarArtists({id:'a',agency:'Unknown'},[{id:'b',agency:'unknown'}]),[]);
  assert.equal(similarArtists({id:'a',generation:'4세대'},Array.from({length:10},(_,i)=>({id:String(i),generation:'4세대'}))).length,6);
});
