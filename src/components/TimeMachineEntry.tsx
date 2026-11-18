import { ArrowUpRight, History } from 'lucide-react';
import { useUI } from '../utils/ui';

export function TimeMachineEntry({ onOpen }: { onOpen: () => void }) {
  const t = useUI();
  return <section className="my-8 border-y border-sea/25 sm:my-10" aria-label={t('K-Wave Time Machine')}>
    <button onClick={onOpen} className="group flex w-full items-center gap-4 bg-sea/5 py-6 text-left transition hover:bg-sea/10 focus-visible:outline-sea sm:gap-6 sm:px-5 sm:py-7">
      <History className="hidden h-9 w-9 shrink-0 text-sea sm:block" />
      <span className="min-w-0 flex-1"><span className="text-xs font-black uppercase text-sea">{t('K-Wave Time Machine')}</span><span className="mt-1 block text-xl font-black sm:text-2xl">{t('Which year takes you back?')}</span><span className="mt-2 block max-w-xl text-sm leading-6 text-ink/60">{t('Pick a year. Discover its releases, music and artist debuts.')}</span></span>
      <span aria-hidden="true" className="hidden shrink-0 items-baseline gap-3 text-ink/30 lg:flex"><span className="text-lg font-bold">2008</span><span className="text-4xl font-black text-sea">2019</span><span className="text-lg font-bold">2024</span></span>
      <ArrowUpRight className="mr-1 h-6 w-6 shrink-0 text-sea transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:mr-0" />
    </button>
  </section>;
}
