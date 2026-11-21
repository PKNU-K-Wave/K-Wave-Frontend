import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronRight, Search, Utensils, X } from 'lucide-react';
import { useUI } from '../utils/ui';

export function RecipePicker({ recipes, value, onChange }: { recipes: { recipeId: number; name: string }[]; value: string; onChange: (value: string) => void }) {
  const t = useUI();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const id = useId();
  const selected = recipes.find(recipe => String(recipe.recipeId) === value);
  const shown = recipes.filter(recipe => recipe.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const close = () => { dialog.current?.close(); trigger.current?.focus({ preventScroll: true }); };
  return <>
    <button ref={trigger} type="button" aria-haspopup="dialog" onClick={() => { setQuery(''); dialog.current?.showModal(); }} className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-lg border border-ink/15 bg-white px-4 py-3 text-left hover:border-sea">
      <Utensils className="h-5 w-5 shrink-0 text-sea" /><span className="min-w-0 flex-1 break-words text-sm font-semibold">{selected?.name ?? t('Choose a recipe')}</span><ChevronDown className="h-4 w-4 shrink-0 text-ink/50" />
    </button>
    {createPortal(<dialog ref={dialog} aria-labelledby={id} onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => { if (event.key === 'Escape' || event.key === 'Tab') event.stopPropagation(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-3 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm">
      <div className="pointer-events-none flex h-full items-end justify-center md:items-center">
        <div className="timeline-year-menu pointer-events-auto mb-[env(safe-area-inset-bottom)] flex max-h-[min(75dvh,600px)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-ink/10 bg-white shadow-2xl md:mb-0">
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3"><h2 id={id} className="text-base font-black">{t('Choose a recipe')} <span className="ml-1 text-sm font-normal text-ink/45">{recipes.length}</span></h2><button type="button" onClick={close} aria-label={t('Close recipe picker')} title={t('Close recipe picker')} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink/50 hover:bg-ink/5"><X className="h-5 w-5" /></button></div>
          <label className="mx-5 mb-3 mt-2 flex shrink-0 items-center gap-2 rounded-lg border border-ink/15 px-3"><Search className="h-4 w-4 shrink-0 text-ink/45" /><input autoFocus aria-label={t('Search recipes')} placeholder={t('Search recipes')} value={query} onChange={event => setQuery(event.target.value)} className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
          <div className="min-h-0 overflow-y-auto overscroll-contain border-t border-ink/10 px-2 pb-2">
            {shown.length ? <ul className="divide-y divide-ink/5">{shown.map(recipe => <li key={recipe.recipeId}><button type="button" aria-pressed={String(recipe.recipeId) === value} onClick={() => { onChange(String(recipe.recipeId)); close(); }} className={`flex min-h-14 w-full items-center gap-3 rounded px-3 py-3 text-left text-sm hover:bg-sea/5 ${String(recipe.recipeId) === value ? 'bg-sea/5 font-bold text-sea' : 'text-ink/80'}`}><span lang="ko" className="min-w-0 flex-1 break-words leading-6">{recipe.name}</span>{String(recipe.recipeId) === value ? <Check className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0 text-ink/35" />}</button></li>)}</ul> : <p role="status" className="px-3 py-8 text-center text-sm text-ink/55">{t('No matching recipes.')}</p>}
          </div>
        </div>
      </div>
    </dialog>, document.body)}
  </>;
}
