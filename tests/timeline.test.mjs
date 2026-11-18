import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTypescript } from './load-typescript.mjs';
const api=await loadTypescript('../src/api/backend.ts');
const nav=await loadTypescript('../src/utils/navigation.ts');

test('timeline URL preserves year and detail without adding a navigation tab',()=>{
  const route={view:'timeline',year:2016,query:'',detail:'song-123',contentId:456};
  assert.deepEqual(nav.readRoute(nav.routeHash(route)),route);
  assert.equal(nav.readRoute('#/time-machine?year=not-a-year').year,undefined);
  assert.equal(nav.readRoute('#/time-machine?year=9999').year,undefined);
});
test('timeline uses server ordering, domain IDs, translated language and real counts',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async url=>{
      const parsed=new URL(url);
      assert.equal(parsed.pathname,'/api/v1/years/2016');assert.equal(parsed.searchParams.get('lang'),'ja');assert.equal(parsed.searchParams.get('limit'),'4');
      return {ok:true,json:async()=>({success:true,data:{year:2016,songCount:100,videoCount:20,songs:[{songId:9,contentId:99,title:'First',artistName:'Group'},{songId:1,title:'Second'}],videos:[{contentId:123,type:'DRAMA',title:'Drama'}],debutArtists:[{artistId:42,contentId:142,name:'Artist',isGroup:true,debutYear:2016}]}})};
    };
    const result=await api.fetchTimelineYear(2016,'ja');
    assert.deepEqual(result.songs.map(item=>item.id),['song-9','song-1']);assert.equal(result.videos[0].id,'video-123');assert.equal(result.artists[0].id,'artist-42');assert.equal(result.artists[0].contentId,142);assert.equal(result.songCount,100);
    await assert.rejects(api.fetchTimelineYear(1,'en'),/Invalid/);
    globalThis.fetch=async()=>({ok:true,json:async()=>({success:true,data:{year:2015,songs:[],videos:[],debutArtists:[]}})});
    await assert.rejects(api.fetchTimelineYear(2016,'en'),/Invalid/);
  } finally {globalThis.fetch=original;}
});
test('timeline year choices reject malformed counts and sort only year metadata',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async()=>({ok:true,json:async()=>({success:true,data:[{year:2020,songCount:2,videoCount:0},{year:2016,songCount:0,videoCount:3}]})});
    assert.deepEqual((await api.fetchTimelineYears()).map(item=>item.year),[2016,2020]);
    globalThis.fetch=async()=>({ok:true,json:async()=>({success:true,data:[{year:2020,songCount:-1,videoCount:0}]})});
    await assert.rejects(api.fetchTimelineYears(),/Invalid/);
  } finally {globalThis.fetch=original;}
});
