import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { fetchRecipeDetail } from '../api/backend';
import type { FoodContent, Nutrition, RecipeDetail } from '../types/content';
import { useUI } from '../utils/ui';
import { ContentImage } from './ContentImage';

function safeLink(value?: string | null) {
  try { const url = new URL(value || ''); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
export function FoodDetails({ item }: { item: FoodContent }) {
  const t = useUI();
  const info = item.foodInfo;
  const [selected, setSelected] = useState('');
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    setRecipe(null); setFailed(false);
    if (!selected) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    fetchRecipeDetail(Number(selected), controller.signal).then(result => { if (!controller.signal.aborted) setRecipe(result); }).catch(() => { if (!controller.signal.aborted) setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selected, retry]);
  const source = safeLink(info?.imageSourceUrl);
  return <div className="space-y-7">
    {info && <>
      <dl className="grid grid-cols-2 gap-4 border-b border-ink/10 pb-5 text-sm">
        {info.nameKo && <div><dt className="text-xs text-ink/50">{t('Korean name')}</dt><dd className="mt-1 font-semibold" lang="ko">{info.nameKo}</dd></div>}
        {info.nameRomanized && <div><dt className="text-xs text-ink/50">{t('Romanized name')}</dt><dd className="mt-1 font-semibold">{info.nameRomanized}</dd></div>}
        {info.spiceLevel != null && <div><dt className="text-xs text-ink/50">{t('Spice level')}</dt><dd className="mt-1 font-semibold">{info.spiceLevel}</dd></div>}
        {info.isVegetarian != null && <div><dt className="text-xs text-ink/50">{t('Dietary information')}</dt><dd className="mt-1 font-semibold">{t(info.isVegetarian ? 'Vegetarian' : 'Not vegetarian')}</dd></div>}
      </dl>
      <div className="flex flex-wrap gap-2 text-xs text-ink/65">{[[info.containsPork, 'Contains pork'], [info.containsBeef, 'Contains beef'], [info.containsSeafood, 'Contains seafood']].filter(([present]) => present === true).map(([, label]) => <span key={String(label)} className="rounded bg-ink/5 px-2 py-1">{t(String(label))}</span>)}</div>
      <p className="text-xs leading-5 text-ink/55">{t('Ingredients and dietary labels may vary by recipe.')}</p>
      {item.ingredients.length > 0 && <section><h3 className="text-lg font-black">{t('Ingredients')}</h3>{item.ingredients.map((text, index) => <p key={index} className="mt-2 whitespace-pre-line text-sm leading-7 text-ink/70">{text}</p>)}</section>}
      {info.taste && <section><h3 className="text-lg font-black">{t('Taste')}</h3><p className="mt-2 text-sm leading-7 text-ink/70">{info.taste}</p></section>}
      {info.howToEat && <section><h3 className="text-lg font-black">{t('How to eat')}</h3><p className="mt-2 text-sm leading-7 text-ink/70">{info.howToEat}</p></section>}
      <NutritionDetails values={info} />
      <section className="border-t border-ink/10 pt-5">
        <h3 className="text-lg font-black">{t('Recipes')}</h3>
        {info.recipes?.length ? <label className="mt-3 block text-sm"><span className="sr-only">{t('Choose a recipe')}</span><select aria-label={t('Choose a recipe')} className="min-h-11 w-full min-w-0 rounded-lg border border-ink/15 bg-white px-3" value={selected} onChange={event => setSelected(event.target.value)}><option value="">{t('Choose a recipe')}</option>{info.recipes.map(value => <option key={value.recipeId} value={value.recipeId}>{value.name}</option>)}</select></label> : <p className="mt-2 text-sm text-ink/60">{t('No linked recipes yet.')}</p>}
      </section>
      {source && <p className="border-t border-ink/10 pt-4 text-xs leading-6 text-ink/55">{t('Image credit')}: {info.imageAuthor || t('Source')} · {info.imageLicense || ''} <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sea underline">{t('View source')}<ExternalLink className="h-3 w-3" /></a></p>}
    </>}
    {loading && <p role="status" className="text-sm text-ink/60">{t('Loading recipe...')}</p>}
    {failed && <div role="alert" className="text-sm"><p>{t('Could not load recipe.')}</p><button className="inline-flex min-h-11 items-center gap-2 font-bold text-sea" onClick={() => setRetry(value => value + 1)}><RefreshCw className="h-4 w-4" />{t('Try again')}</button></div>}
    {recipe && !loading && !failed && <RecipeView recipe={recipe} />}
    {item.recipe && <RecipeView recipe={item.recipe} />}
  </div>;
}
function RecipeView({ recipe }: { recipe: RecipeDetail }) {
  const t = useUI();
  return <article lang="ko" className="space-y-5 border-t border-ink/10 pt-5">
    <div><p className="text-xs font-semibold text-sea">{t('Recipes are currently available in Korean.')}</p><h3 className="mt-2 break-words text-xl font-black">{recipe.name}</h3></div>
    {recipe.ingredients && <section><h4 className="font-bold">{t('Ingredients')}</h4><p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink/70">{recipe.ingredients}</p></section>}
    <section><h4 className="font-bold">{t('Cooking steps')}</h4>
      {recipe.steps?.length ? <ol className="mt-3 divide-y divide-ink/10">{recipe.steps.map((step, index) => <li key={`${step.order}:${index}`} className="flex min-w-0 gap-3 py-4">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-citron text-xs font-bold">{step.order}</span>
        <div className="min-w-0 flex-1"><p className="whitespace-pre-line text-sm leading-7 text-ink/75">{step.description}</p>{step.imageUrl && <ContentImage src={step.imageUrl} className="mt-3 max-h-52 w-full rounded-lg bg-white object-contain" />}</div>
      </li>)}</ol> : <p className="mt-2 text-sm text-ink/60">{t('Cooking steps are unavailable.')}</p>}
    </section>
    {recipe.tip && <section><h4 className="font-bold">{t('Cooking tip')}</h4><p className="mt-2 text-sm leading-7 text-ink/70">{recipe.tip}</p></section>}
    <NutritionDetails values={recipe} />
    <a href="https://www.foodsafetykorea.go.kr/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-xs text-sea underline">{t('Recipe source: Ministry of Food and Drug Safety')}<ExternalLink className="h-3 w-3" /></a>
  </article>;
}
function NutritionDetails({ values }: { values: Nutrition }) {
  const t = useUI();
  const entries = [['Calories', values.caloriesKcal, 'kcal'], ['Carbohydrate', values.carbohydrateG, 'g'], ['Protein', values.proteinG, 'g'], ['Fat', values.fatG, 'g'], ['Sodium', values.sodiumMg, 'mg']] as const;
  const present = entries.filter(([, value]) => typeof value === 'number' && Number.isFinite(value));
  if (!present.length) return null;
  return <section><h3 className="text-lg font-black">{t('Nutrition')}</h3><p className="mt-1 text-xs text-ink/50">{t('Per serving')}{values.servingSizeG != null ? ` · ${values.servingSizeG} g` : ''}</p><dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-ink/10 py-4 text-sm sm:grid-cols-3">{present.map(([label, value, unit]) => <div key={label}><dt className="text-xs text-ink/50">{t(label)}</dt><dd className="mt-1 font-semibold">{value} {unit}</dd></div>)}</dl></section>;
}

