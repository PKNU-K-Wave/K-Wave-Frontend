import { UIContext, useUI } from "../utils/ui";
import { Check, Clapperboard, Music2, Soup } from 'lucide-react';
import { useContext, useState } from 'react';
import { preferenceOptions, selectPreferenceCategory, type RecommendationPreference } from '../utils/recommendations';
import { usePreferenceTags } from '../hooks/usePreferenceTags';
import { saveUserPreference } from '../utils/preferenceStorage';

const categoryIcons = { video: Clapperboard, kpop: Music2, food: Soup };

export function PreferenceSetupPage({ userId, onComplete, onSkip }: { userId: number; onComplete: () => void; onSkip: () => void }) {
  const t = useUI();
  const language = useContext(UIContext);
  const [preference, setPreference] = useState<RecommendationPreference>({ categories: [], tags: [] });
  const tasteOptions = usePreferenceTags(preference, language);
  const [saveError, setSaveError] = useState(false);
  const tags = tasteOptions.tags;

  return <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
    <p className="text-xs font-bold uppercase text-coral">{t("For You")}</p>
    <h1 className="mt-2 text-3xl font-black">{t("What are you into?")}</h1>
    <p className="mt-3 text-sm leading-6 text-ink/60">{t("Pick your interests. You can change them any time in For You.")}</p>
    <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4" role="group" aria-label={t("Preferred categories")}>
      {preferenceOptions.categories.map(option => {
        const Icon = categoryIcons[option.value as keyof typeof categoryIcons];
        const active = option.kinds.some(kind => preference.categories.includes(kind));
        return <button key={option.value} aria-pressed={active} className={`relative flex min-h-28 min-w-0 flex-col items-center justify-center gap-3 rounded-lg border px-2 text-sm font-bold ${active ? 'border-sea bg-sea/10 text-sea' : 'border-ink/10 bg-white text-ink/70'}`} onClick={() => {
          setSaveError(false);
          setPreference(current => selectPreferenceCategory(current, option.value));
        }}><Icon className="h-7 w-7" />{option.label}{active && <Check className="absolute right-2 top-2 h-4 w-4" />}</button>;
      })}
    </div>
    {tasteOptions.loading && <p role="status" className="mt-8 text-sm text-ink/60">{t('Loading tastes...')}</p>}
    {tasteOptions.failed && <p role="status" className="mt-8 text-sm text-ink/60">{t('Could not load taste options.')} <button className="min-h-11 font-bold text-sea" onClick={tasteOptions.retry}>{t('Retry')}</button></p>}
    {tags.length > 0 && <section className="mt-8"><h2 className="text-lg font-bold">{t("A little more your style")}</h2><p className="mt-1 text-sm text-ink/55">{t("Optional")}</p><div className="mt-4 flex flex-wrap gap-2">{tags.map(tag => <button key={tag} aria-pressed={preference.tags.includes(tag)} className={`min-h-10 rounded-full px-4 text-sm font-semibold ${preference.tags.includes(tag) ? 'bg-ink text-white' : 'bg-white text-ink/65 ring-1 ring-ink/10'}`} onClick={() => { setSaveError(false); setPreference(current => ({ ...current, tags: current.tags.includes(tag) ? current.tags.filter(value => value !== tag) : [...current.tags, tag] })); }}>{tag}</button>)}</div></section>}
    <p className="mt-8 text-sm leading-6 text-ink/55">{t("Your choices are saved for this account on this browser.")}</p>
    {saveError && <p role="alert" className="mt-3 text-sm text-red-700">{t("Your choices could not be saved. Please allow browser storage and try again.")}</p>}
    <button className="mt-4 min-h-12 w-full rounded-lg bg-ink px-4 text-sm font-bold text-white disabled:opacity-40" disabled={!preference.categories.length} onClick={() => {
      if (saveUserPreference(userId, preference)) onComplete(); else setSaveError(true);
    }}>{t("Show my picks")}</button>
    <button className="mt-3 min-h-11 w-full text-sm font-semibold text-sea" onClick={onSkip}>{t("Not now")}</button>
  </main>;
}
