import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useUI } from '../utils/ui';

export function CatalogFilters({ children, count = 0, onReset }: { children: ReactNode; count?: number; onReset: () => void }) {
  const t = useUI();
  const [open, setOpen] = useState(false);
  const id = useId();
  return <div data-catalog-filters className="my-5 border-y border-ink/10 py-4">
    <div className="flex items-center gap-3">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-bold ${open || count ? 'border-sea/40 bg-sea/10 text-sea' : 'border-ink/10 bg-white text-ink/70'}`}><SlidersHorizontal className="h-4 w-4" />{t('Filters')}{count > 0 && <span className="text-xs">({count})</span>}<ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
      {count > 0 && <button type="button" onClick={onReset} className="min-h-11 text-sm font-bold text-sea">{t('Reset')}</button>}
    </div>
    <div id={id} hidden={!open} className="mt-4 space-y-5 border-t border-ink/10 pt-4">{children}</div>
  </div>;
}

export function FilterChoices({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: Array<{ value: string; label: string; disabled?: boolean }>; onChange: (value: string) => void; disabled?: boolean }) {
  return <fieldset disabled={disabled} className="min-w-0 disabled:opacity-50"><legend className="mb-2 text-sm font-bold text-ink/65">{label}</legend><div className="flex flex-wrap gap-2">{options.map(option => <button type="button" key={option.value} aria-pressed={value === option.value} disabled={option.disabled} onClick={() => onChange(option.value)} className={`min-h-10 max-w-full rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${value === option.value ? 'border-sea bg-sea text-white' : 'border-ink/10 bg-white text-ink/65 hover:border-sea/50'}`}>{option.label}</button>)}</div></fieldset>;
}
