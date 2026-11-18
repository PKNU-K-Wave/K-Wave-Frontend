import { useUI } from "../utils/ui";
import { Globe2, Search, X, MessageCircle } from 'lucide-react';
import type { Language } from '../types/content';
import { useEffect, useRef, useState } from 'react';
import { KWaveMark } from './KWaveMark';

type HeaderProps = {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  onHomeClick: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoginView: boolean;
  onChat: () => void;
};

const languages: Array<{ code: Language; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' },
  { code: 'ja', label: 'JA' },
];

export function Header({ selectedLanguage, onLanguageChange, onHomeClick, query, onQueryChange, onSearch, isLoginView, onChat }: HeaderProps) {
  const t = useUI();
  const [collapsed, setCollapsed] = useState(false);
  const topRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = topRow.current;
    const wrapper = row?.closest<HTMLElement>('[data-site-header]');
    if (!row || !wrapper) return;
    const update = () => wrapper.style.setProperty('--header-offset', collapsed && !isLoginView ? `-${row.offsetHeight}px` : '0px');
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => observer.disconnect();
  }, [collapsed, isLoginView]);
  useEffect(() => {
    let previous = window.scrollY;
    let direction = 0;
    let distance = 0;
    const onScroll = () => {
      const current = Math.max(0, window.scrollY);
      const delta = current - previous;
      previous = current;
      if (window.innerWidth >= 768 || current < 40) { setCollapsed(false); distance = 0; return; }
      if (Math.abs(delta) < 2) return;
      const nextDirection = Math.sign(delta);
      distance = direction === nextDirection ? distance + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      if (direction > 0 && current > 120 && distance > 24) setCollapsed(true);
      if (direction < 0 && distance > 64) setCollapsed(false);
    };
    const onResize = () => { if (window.innerWidth >= 768) setCollapsed(false); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, []);
  const searchInput = <form role="search" className="flex h-11 w-full items-center rounded-full border border-ink/10 bg-white px-3" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
    <input aria-label={t("Search K-Wave")} value={query} onChange={(event) => onQueryChange(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" placeholder={t("Search K-Wave")} type="search" />
    {query && <button type="button" aria-label={t('Clear search')} title={t('Clear search')} onClick={() => onQueryChange('')} className="grid h-10 w-8 shrink-0 place-items-center text-ink/50"><X className="h-4 w-4" /></button>}
    <button type="submit" aria-label={t("Search")} title={t("Search")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-ink/5"><Search className="h-5 w-5 text-ink/60" /></button>
  </form>;
  return (
    <header className="border-b border-ink/10 bg-paper/95 backdrop-blur">
      <div ref={topRow} className={collapsed && !isLoginView ? 'invisible md:visible' : ''}>
      <div className={`mx-auto flex max-w-7xl items-center gap-2 px-4 pt-3 sm:gap-4 sm:px-6 sm:py-3 lg:px-8 ${isLoginView ? 'pb-3' : ''}`}>
        <button
          className="flex h-11 shrink-0 items-center gap-1.5 text-left transition-opacity hover:opacity-80 sm:gap-2"
          onClick={onHomeClick}
        >
          <KWaveMark className="h-8 w-8" />
          <span className="bg-gradient-to-r from-[#b85b55] to-[#347a73] bg-clip-text text-base font-black tracking-normal text-transparent sm:text-xl">{t("K-Wave")}</span>
        </button>

        {!isLoginView && <div className="hidden flex-1 md:flex">{searchInput}</div>}

        <div className="ml-auto flex items-center gap-1 rounded-full border border-ink/10 bg-white p-1 sm:gap-2">
          <Globe2 className="ml-2 hidden h-4 w-4 text-ink/50 sm:block" />
          {languages.map((language) => (
            <button
              key={language.code}
              aria-pressed={selectedLanguage === language.code}
              title={language.code === 'en' ? 'English' : language.code === 'zh' ? '中文' : '日本語'}
              className={`h-8 rounded-full px-2 text-xs font-bold transition sm:px-3 ${
                selectedLanguage === language.code ? 'bg-sea text-white' : 'text-ink/55 hover:bg-ink/5'
              }`}
              onClick={() => onLanguageChange(language.code)}
            >
              {language.label}
            </button>
          ))}
        </div>
        {!isLoginView && <button onClick={onChat} title="Ask K-Wave" aria-label="Ask K-Wave" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white"><MessageCircle className="h-5 w-5" /></button>}
      </div>
      </div>
      {!isLoginView && <div className="mx-auto max-w-7xl px-4 pb-3 pt-2 sm:px-6 md:hidden">{searchInput}</div>}
    </header>
  );
}
