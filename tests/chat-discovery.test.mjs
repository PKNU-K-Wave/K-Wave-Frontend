import {loadTypescript} from './load-typescript.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const api=await loadTypescript('../src/api/backend.ts');
test('chat food and recipe cards retain independent IDs and hydrate the right route',async()=>{
 const original=globalThis.fetch;const paths=[];
 try {
  globalThis.fetch=async url=>{paths.push(String(url));return {ok:true,json:async()=>({success:true,data:String(url).includes('/recipes/')?{recipeId:7,name:'Recipe',steps:[]}:{foodId:17408,name:'Kimchi'}})};};
  const base={title:'Food',subtitle:'',tags:[],description:'',score:1,reasons:[],domainId:7,contentId:17408};
  const recipe=api.recommendationToContent({...base,id:'food-recipe-7',contentType:'recipe'});
  assert.equal(recipe.kind,'food');assert.equal(recipe.recipeId,7);assert.equal(recipe.contentId,17408);
  await api.fetchContentDetail(recipe,'en',new AbortController().signal);
  const food=api.recommendationToContent({...base,id:'food-17408',domainId:17408,contentType:'food'});
  await api.fetchContentDetail(food,'en',new AbortController().signal);
  assert.ok(paths[0].endsWith('/api/v1/recipes/7?lang=en'));assert.ok(paths[1].includes('/api/v1/foods/17408?lang=en'));
 }finally{globalThis.fetch=original;}
});
