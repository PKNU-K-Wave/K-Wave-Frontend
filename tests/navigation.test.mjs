import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { test } from 'node:test';
async function moduleFrom(file) { const source=fs.readFileSync(new URL(file,import.meta.url),'utf8'); const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});return import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64')); }
const nav=await moduleFrom('../src/utils/navigation.ts');
const state=await moduleFrom('../src/utils/browserState.ts');
test('hash routes round-trip Unicode queries and stable detail identifiers',()=>{
  const route={view:'search',query:'기생충 & romance',detail:'video-419',contentId:419};
  assert.deepEqual(nav.readRoute(nav.routeHash(route)),route);
  assert.equal(nav.readRoute('#/for-you').view,'recommendations');
  assert.equal(nav.readRoute('#/unknown').view,'home');
  assert.equal(nav.readRoute('#/video?detail=javascript:alert(1)').detail,null);
  assert.equal(nav.readRoute('#/video?contentId=-4').contentId,undefined);
});
test('deep-link seeds preserve artist/song domain and content IDs without guessing artist content IDs',()=>{
  assert.equal(nav.detailSeed('artist-7',77).kind,'idol');
  assert.equal(nav.detailSeed('artist-7',77).contentId,77);
  assert.equal(nav.detailSeed('song-8').contentId,undefined);
  assert.equal(nav.detailSeed('video-419').contentId,419);
});
test('optional session storage rejects malformed and incompatible persisted state',()=>{
  const data=new Map();globalThis.sessionStorage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  state.writeState('page',3);assert.equal(state.readState('page',0),3);
  data.set('kwave:page','-1');assert.equal(state.readState('page',0),0);
  data.set('kwave:filters','{"sort":4}');assert.deepEqual(state.readState('filters',{sort:'voteCount'}),{sort:'voteCount'});
  data.set('kwave:recent','["Movie",{"bad":true}]');assert.deepEqual(state.readState('recent',[]),['Movie']);
  data.set('kwave:page','{bad');assert.equal(state.readState('page',0),0);
  globalThis.sessionStorage={getItem(){throw Error('disabled');},setItem(){throw Error('disabled');}};
  assert.equal(state.readState('page',0),0);assert.doesNotThrow(()=>state.writeState('page',3));
});
