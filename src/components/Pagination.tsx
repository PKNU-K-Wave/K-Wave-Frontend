import { useEffect, useId, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUI } from '../utils/ui';

export function Pagination({ page, totalPages, disabled = false, onChange }: { page: number; totalPages: number; disabled?: boolean; onChange: (page: number) => void }) {
  const t = useUI();
  const id = useId();
  const [input, setInput] = useState(String(page + 1));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setInput(String(page + 1)); setInvalid(false); }, [page]);
  if (totalPages <= 1) return null;
  return <nav aria-label={t('Pagination')} className="mt-6 flex flex-wrap items-center justify-center gap-1">
    <button type="button" aria-label={t('Previous page')} title={t('Previous page')} disabled={disabled || page === 0} onClick={() => onChange(page - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 bg-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
    <form className="flex items-center gap-1 pr-3" onSubmit={event => {
      event.preventDefault();
      const value = /^\d+$/.test(input) ? Number(input) : NaN;
      if (!Number.isSafeInteger(value) || value < 1 || value > totalPages) { setInvalid(true); return; }
      setInvalid(false); if (!disabled) onChange(value - 1);
    }}>
      <label htmlFor={id} className="sr-only">{t('Page')}</label>
      <input id={id} title={t('Go to page')} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} inputMode="numeric" value={input} disabled={disabled} onChange={event => { setInput(event.target.value); setInvalid(false); }} className="h-9 w-10 rounded border border-transparent bg-transparent px-1 text-center text-sm tabular-nums hover:border-ink/15 focus:border-sea focus:bg-white focus:outline-none disabled:opacity-50" />
      <span className="text-sm tabular-nums text-ink/65">/ {totalPages}</span>
    </form>
    <button type="button" aria-label={t('Next page')} title={t('Next page')} disabled={disabled || page + 1 >= totalPages} onClick={() => onChange(page + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 bg-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
    {invalid && <p id={`${id}-error`} role="alert" className="w-full text-center text-sm text-red-700">{t('Enter a page number between')} 1–{totalPages}.</p>}
  </nav>;
}
