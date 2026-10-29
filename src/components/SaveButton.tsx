import { useUI } from "../utils/ui";
import { Heart } from 'lucide-react';
import { useSavedContent } from '../hooks/savedContentContext';
import type { KWaveContent } from '../types/content';

export function SaveButton({ item }: { item: KWaveContent }) {
  const t = useUI();
  const saved = useSavedContent();
  const active = saved.items.some(value => value.id === item.id);
  const label = `${t(active ? 'Unsave' : 'Save')} ${item.title}`;
  return <button type="button" aria-label={label} aria-pressed={active} title={saved.signedIn ? label : t("Sign in to save")} onClick={event => { event.stopPropagation(); saved.toggle(item); }} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/95 shadow ring-1 ring-ink/10 transition hover:text-coral ${active ? 'text-coral' : 'text-ink/60'}`}><Heart className="h-[18px] w-[18px]" fill={active ? 'currentColor' : 'none'} /></button>;
}
