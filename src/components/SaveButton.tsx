import { useUI } from "../utils/ui";
import { Heart } from 'lucide-react';
import { useSavedContent } from '../hooks/savedContentContext';
import type { KWaveContent } from '../types/content';
import { favoriteId } from '../utils/savedContent';

export function SaveButton({ item }: { item: KWaveContent }) {
  const t = useUI();
  const saved = useSavedContent();
  const id = favoriteId(item);
  if (!id) return null;
  const active = saved.items.some(value => favoriteId(value) === id);
  const label = `${t(active ? 'Unsave' : 'Save')} ${item.title}`;
  return <button type="button" disabled={saved.busy} aria-label={label} aria-pressed={active} title={saved.signedIn ? label : t("Sign in to save")} onClick={event => { event.stopPropagation(); saved.toggle(item); }} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/95 shadow ring-1 ring-ink/10 transition hover:text-coral disabled:opacity-50 ${active ? 'text-coral' : 'text-ink/60'}`}><Heart className="h-[18px] w-[18px]" fill={active ? 'currentColor' : 'none'} /></button>;
}
