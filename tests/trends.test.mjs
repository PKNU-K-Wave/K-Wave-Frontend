import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadTypescript} from './load-typescript.mjs';
const utils=await loadTypescript('../src/utils/trends.ts');
const api=await loadTypescript('../src/api/backend.ts');
const item=(id,badge='RISING',status='ACTIVE')=>({trendItemId:id,name:`Item ${id}`,nameKo:'대방어',badge,status,description:'A <b>trend</b>',trendUpdatedOn:'2026-11-16'});

test('trend groups preserve server order and distinguish status from badge',()=>{
 const groups=utils.groupTrends({items:[item(8),item(2,'STEADY'),item(4,'FADING'),item(7,null),item(9,'UNKNOWN'),item(6,'RISING','INVALID')],pastItems:[item(3,'FADING','PAST'),item(5,'RISING','PAST')]});
 assert.deepEqual(groups.hot.map(item=>item.trendItemId),[8,2]);
 assert.deepEqual(groups.cooling.map(item=>item.trendItemId),[4]);
 assert.deepEqual(groups.past.map(item=>item.trendItemId),[3,5]);
 assert.equal(groups.hot[0].description,'A trend');
});
test('trend groups reject unsupported envelopes and deduplicate without inventing categories',()=>{
 assert.throws(()=>utils.groupTrends({songs:[],netflix:[]}),/not supported/);
 assert.deepEqual(utils.groupTrends({items:[],pastItems:[]}),{hot:[],cooling:[],past:[]});
 const groups=utils.groupTrends({items:[item(1),item(-1),{...item(2),name:''}],pastItems:[item(1,'FADING','PAST')]});
 assert.equal(groups.hot.length,0);assert.equal(groups.past.length,1);
});
test('source links allow only safe HTTP(S) and news-search fallback stays explicitly a search',()=>{
 for(const value of ['javascript:alert(1)','data:text/html,test','file:///etc/passwd','/relative','https://name:pass@example.com','not a url',null])assert.equal(utils.safeTrendUrl(value),null);
 assert.equal(utils.safeTrendUrl('https://example.com/a?b=1'),'https://example.com/a?b=1');
 const url=new URL(utils.trendNewsSearch({nameKo:'대방어 & test',name:'Title'}));
 assert.equal(url.hostname,'search.naver.com');assert.equal(url.searchParams.get('query'),'대방어 & test');assert.equal(url.searchParams.get('where'),'news');
});
test('public trend API requests language and validates article reference identity',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async url=>{assert.equal(new URL(url).searchParams.get('lang'),'ja');return {ok:true,json:async()=>({success:true,data:{items:[item(1)],pastItems:[]}})};};
  assert.equal((await api.fetchTrends('ja')).hot.length,1);
  globalThis.fetch=async url=>{assert.equal(new URL(url).pathname,'/api/v1/trends/items/1');return {ok:true,json:async()=>({success:true,data:{item:{trendItemId:1},referenceUrl:'javascript:alert(1)'}})};};
  assert.equal(await api.fetchTrendReference(1,'en'),null);
  globalThis.fetch=async()=>({ok:true,json:async()=>({success:true,data:{item:{trendItemId:2},referenceUrl:'https://example.com'}})});
  await assert.rejects(api.fetchTrendReference(1,'en'),/Invalid/);
  await assert.rejects(api.fetchTrendReference(-1,'en'),/Invalid/);
 }finally{globalThis.fetch=original;}
});
