import { useUI } from "../utils/ui";
import { Globe2, Search, X, MessageCircle } from 'lucide-react';
import type { Language } from '../types/content';

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
  const searchInput = <form role="search" className="flex h-11 w-full items-center rounded-full border border-ink/10 bg-white px-3" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
    <input aria-label={t("Search K-Wave")} value={query} onChange={(event) => onQueryChange(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" placeholder={t("Search K-Wave")} type="search" />
    {query && <button type="button" aria-label={t('Clear search')} title={t('Clear search')} onClick={() => onQueryChange('')} className="grid h-10 w-8 shrink-0 place-items-center text-ink/50"><X className="h-4 w-4" /></button>}
    <button type="submit" aria-label={t("Search")} title={t("Search")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-ink/5"><Search className="h-5 w-5 text-ink/60" /></button>
  </form>;
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 pt-3 sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
        <button
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-2 text-left text-white shadow-soft sm:h-auto sm:px-4 sm:py-2"
          onClick={onHomeClick}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-coral text-sm font-black">{t("K")}</span>
          <span className="text-sm font-black tracking-normal sm:text-lg">{t("K-Wave")}</span>
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
      {!isLoginView && <div className="mx-auto max-w-7xl px-4 pb-3 pt-2 sm:px-6 md:hidden">{searchInput}</div>}
    </header>
  );
}
