import { useEffect, useRef, useState } from 'react';
import { BookOpen, Soup, RefreshCw } from 'lucide-react';
import { fetchFoodCategories, fetchFoodPage, fetchRecipePage, FOOD_PAGE_SIZE, RECIPE_DISH_TYPES, RECIPE_METHODS, type FoodCategory, type FoodFilters, type RecipeFilters, type ApiPage } from '../api/backend';
import { ContentCard } from '../components/ContentCard';
import { ContentSkeleton } from '../components/ContentSkeleton';
import { Pagination } from '../components/Pagination';
import { CatalogFilters, FilterChoices } from '../components/CatalogFilters';
import { useSessionState } from '../hooks/useSessionState';
import { useUI } from '../utils/ui';
import type { FoodContent, KWaveContent, Language } from '../types/content';

type Tab = 'foods' | 'recipes';
const emptyFoods: FoodFilters = { category: '', vegetarian: false, exclude: [] };
const emptyRecipes: RecipeFilters = { dishType: '', cookingMethod: '' };
const dishLabels = { SIDE: 'Side dishes', ONE_DISH: 'One-dish meals', DESSERT: 'Desserts', RICE: 'Rice', SOUP: 'Soups and stews', ETC: 'Other' };
const methodLabels = { BOIL: 'Boil', GRILL: 'Grill', STIR_FRY: 'Stir-fry', STEAM: 'Steam', FRY: 'Deep-fry', ETC: 'Other' };
export function FoodPage({ language, active, onOpen }: { language: Language; active: boolean; onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const [tab, setTab] = useSessionState<Tab>('food-tab', 'foods');
  return <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
    <header>
      <p className="text-xs font-black uppercase text-coral">K-Food</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">{t('Korean food and recipes')}</h1>
      <div className="mt-5 flex gap-1" role="tablist" aria-label={t('K-Food catalog')}>
        {(['foods', 'recipes'] as const).map(value => {
          const Icon = value === 'foods' ? Soup : BookOpen;
          return <button key={value} id={`food-tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`food-panel-${value}`} tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)} onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 'foods' : event.key === 'End' ? 'recipes' : value === 'foods' ? 'recipes' : 'foods';
            setTab(next); document.getElementById(`food-tab-${next}`)?.focus();
          }} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-bold ${tab === value ? 'border-sea text-sea' : 'border-transparent text-ink/55'}`}><Icon className="h-4 w-4" />{t(value === 'foods' ? 'Foods' : 'Recipes')}</button>;
        })}
      </div>
    </header>
    {(['foods', 'recipes'] as const).map(value => <div key={value} id={`food-panel-${value}`} role="tabpanel" aria-labelledby={`food-tab-${value}`} hidden={tab !== value}><FoodCatalog collection={value} language={language} active={active && tab === value} onOpen={onOpen} /></div>)}
  </main>;
}

function FoodCatalog({ collection, language, active, onOpen }: { collection: Tab; language: Language; active: boolean; onOpen: (item: KWaveContent) => void }) {
  const t = useUI();
  const [foods, setFoods] = useSessionState('food-filters', emptyFoods);
  const [recipes, setRecipes] = useSessionState('recipe-filters', emptyRecipes);
  const [page, setPage] = useSessionState(`food-page:${collection}`, 0);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [data, setData] = useState<ApiPage<FoodContent> | null>(null);
  const [loadedKey, setLoadedKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const start = useRef<HTMLDivElement>(null);
  const key = JSON.stringify([collection, language, page, collection === 'foods' ? foods : recipes]);
  useEffect(() => {
    if (!active || collection !== 'foods') return;
    const controller = new AbortController();
    setCategoryError(false);
    fetchFoodCategories(language, controller.signal).then(result => { if (!controller.signal.aborted) setCategories(result); }).catch(() => { if (!controller.signal.aborted) setCategoryError(true); });
    return () => controller.abort();
  }, [active, collection, language, retry]);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    const request = collection === 'foods' ? fetchFoodPage(language, foods, page, controller.signal) : fetchRecipePage(recipes, page, language, controller.signal);
    request.then(result => {
      if (controller.signal.aborted) return;
      const last = Math.max(0, Math.min(result.totalPages, Math.floor(10_000 / FOOD_PAGE_SIZE) + 1) - 1);
      if (page > last) { setPage(last); return; }
      setData(result); setLoadedKey(key);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [active, collection, language, foods, recipes, page, key, retry, setPage]);
  const current = loadedKey === key ? data : null;
  const count = collection === 'foods' ? Number(Boolean(foods.category)) + Number(foods.vegetarian) + foods.exclude.length : Number(Boolean(recipes.dishType)) + Number(Boolean(recipes.cookingMethod));
  const reset = () => { setPage(0); if (collection === 'foods') setFoods(emptyFoods); else setRecipes(emptyRecipes); };
  return <section className="pb-5" aria-busy={loading}>
    <div ref={start} className="scroll-mt-44" />
    <CatalogFilters count={count} onReset={reset}>
      {collection === 'foods' ? <>
      <fieldset>
      <legend className="mb-2 text-sm font-bold text-ink/65">{t('Dietary filters')}</legend>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:flex-wrap sm:gap-x-5">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm"><input className="h-4 w-4 accent-sea" type="checkbox" checked={foods.vegetarian} onChange={event => { setPage(0); setFoods({ ...foods, vegetarian: event.target.checked }); }} />{t('Vegetarian')}</label>
        {(['PORK', 'BEEF', 'SEAFOOD'] as const).map(value => <label key={value} className="inline-flex min-h-11 items-center gap-2 text-sm"><input className="h-4 w-4 accent-sea" type="checkbox" checked={foods.exclude.includes(value)} onChange={event => { setPage(0); setFoods({ ...foods, exclude: event.target.checked ? [...foods.exclude, value] : foods.exclude.filter(item => item !== value) }); }} />{t({ PORK: 'Exclude pork', BEEF: 'Exclude beef', SEAFOOD: 'Exclude seafood' }[value])}</label>)}
      </div><p className="mt-2 text-xs leading-5 text-ink/55">{t('Ingredients and dietary labels may vary by recipe.')}</p>
      </fieldset>
      <FilterChoices label={t('Category')} value={foods.category} options={[{value:'',label:t('All categories')},...(foods.category && !categories.some(value => value.code === foods.category) ? [{value:foods.category,label:foods.category}] : []),...categories.map(value => ({value:value.code,label:`${value.name} (${value.foodCount.toLocaleString()})`}))]} onChange={value => {setPage(0);setFoods({...foods,category:value});}} />
      {categoryError && <p role="status" className="text-sm text-ink/60">{t('Could not load categories.')} <button className="min-h-11 font-bold text-sea" onClick={() => setRetry(value => value + 1)}>{t('Try again')}</button></p>}
      </> : <>
        <FilterChoices label={t('Dish type')} value={recipes.dishType} options={[{value:'',label:t('All types')},...RECIPE_DISH_TYPES.map(value => ({value,label:t(dishLabels[value])}))]} onChange={value => {setPage(0);setRecipes({...recipes,dishType:value});}} />
        <FilterChoices label={t('Cooking method')} value={recipes.cookingMethod} options={[{value:'',label:t('All methods')},...RECIPE_METHODS.map(value => ({value,label:t(methodLabels[value])}))]} onChange={value => {setPage(0);setRecipes({...recipes,cookingMethod:value});}} />
      </>}
    </CatalogFilters>
    <p className="mb-4 text-sm text-ink/60" role="status">{current ? `${current.totalElements.toLocaleString()} ${t(collection === 'foods' ? 'foods' : 'recipes')}` : t(collection === 'foods' ? 'Foods' : 'Recipes')}</p>
    {failed ? <div role="alert" className="flex flex-wrap items-center gap-3 py-8"><span>{t('Could not load food content.')}</span><button className="inline-flex min-h-11 items-center gap-2 font-bold text-sea" onClick={() => setRetry(value => value + 1)}><RefreshCw className="h-4 w-4" />{t('Try again')}</button></div>
      : loading || !current ? <ContentSkeleton />
      : !current.content.length ? <p role="status" className="py-10 text-ink/60">{t('No matching food content.')}</p>
      : <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{current.content.map(item => <ContentCard key={item.id} item={item} language={language} onOpen={onOpen} />)}</div>}
    {current && <Pagination page={page} totalPages={Math.min(current.totalPages, Math.floor(10_000 / FOOD_PAGE_SIZE) + 1)} disabled={loading} onChange={next => { setPage(next); start.current?.scrollIntoView({ block: 'start' }); }} />}
  </section>;
}

